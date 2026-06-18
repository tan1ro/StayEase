from __future__ import annotations

import calendar
from collections import Counter, defaultdict
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException

from database import database
from models.common import serialize_doc
from services.auth import get_current_user, require_role

router = APIRouter(prefix="/api", tags=["analytics"])

MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _parse_year(year: int | None) -> int:
    return year or date.today().year


def _month_range(year: int, month: int) -> tuple[date, date]:
    last_day = calendar.monthrange(year, month)[1]
    return date(year, month, 1), date(year, month, last_day)


def _nights_in_month(check_in: str, check_out: str, year: int, month: int) -> int:
    start, end = _month_range(year, month)
    ci = date.fromisoformat(check_in)
    co = date.fromisoformat(check_out)
    overlap_start = max(ci, start)
    overlap_end = min(co, end)
    if overlap_end <= overlap_start:
        return 0
    return (overlap_end - overlap_start).days


async def _host_room_ids(host_id: str) -> list[str]:
    rooms = await database.collection("rooms").find({"host_id": host_id}).to_list(500)
    return [str(r["_id"]) for r in rooms]


def _host_earning(booking: dict) -> float:
    if booking.get("host_payout") is not None:
        return float(booking["host_payout"])
    return float(booking.get("subtotal", booking.get("total_price", 0)))


def _host_platform_fee(booking: dict) -> float:
    if booking.get("host_platform_fee") is not None:
        return float(booking["host_platform_fee"])
    return 0.0


async def _host_stats_dashboard(host_id: str) -> dict:
    rooms = await database.collection("rooms").find({"host_id": host_id}).to_list(500)
    room_ids = [str(r["_id"]) for r in rooms]
    rooms_by_id = {str(r["_id"]): r for r in rooms}

    bookings_col = database.collection("bookings")
    all_bookings = await bookings_col.find({"host_id": host_id}).to_list(5000)
    today = date.today()
    today_iso = today.isoformat()

    total_rooms = len(rooms)
    available_rooms = sum(1 for r in rooms if r.get("is_available"))
    booked_room_ids = {
        b["room_id"]
        for b in all_bookings
        if b.get("status") == "confirmed"
        and b.get("check_in_date", "") <= today_iso < b.get("check_out_date", "")
    }
    booked_rooms = len(booked_room_ids)

    total_bookings = len(all_bookings)
    confirmed_bookings = sum(1 for b in all_bookings if b.get("status") == "confirmed")
    cancelled_bookings = sum(1 for b in all_bookings if b.get("status") == "cancelled")
    completed_bookings = sum(1 for b in all_bookings if b.get("status") == "completed")

    paid_bookings = [b for b in all_bookings if b.get("payment_status") == "paid"]
    total_revenue = round(sum(_host_earning(b) for b in paid_bookings), 2)

    yr = today.year
    monthly_revenue = []
    legacy_months = []
    num_rooms = max(len(room_ids), 1)

    active_booking_list = [
        b for b in all_bookings
        if b.get("status") in ("confirmed", "completed")
        and b.get("payment_status") in ("pending", "paid")
    ]

    for month in range(1, 13):
        month_start, month_end = _month_range(yr, month)
        month_bookings = [
            b for b in paid_bookings
            if month_start.isoformat() <= b.get("check_in_date", "") < month_end.isoformat()
        ]
        revenue = round(sum(_host_earning(b) for b in month_bookings), 2)

        days_in_month = calendar.monthrange(yr, month)[1]
        available_nights = days_in_month * num_rooms
        booked_nights = sum(
            _nights_in_month(b["check_in_date"], b["check_out_date"], yr, month)
            for b in active_booking_list
        )
        occupancy = round((booked_nights / available_nights) * 100, 1) if available_nights else 0.0

        monthly_revenue.append({
            "month": MONTH_NAMES[month - 1],
            "revenue": revenue,
            "bookings": len(month_bookings),
            "occupancy": occupancy,
        })
        legacy_months.append({
            "month": month,
            "occupancy_rate": occupancy,
            "booked_nights": booked_nights,
            "available_nights": available_nights,
        })

    month_revenue = monthly_revenue[today.month - 1]["revenue"]
    month_platform_fees = sum(
        _host_platform_fee(b)
        for b in paid_bookings
        if b.get("check_in_date", "") >= date(today.year, today.month, 1).isoformat()
    )

    active = [b for b in all_bookings if b.get("status") == "confirmed"]
    avg_rating = round(sum(r.get("avg_rating", 0) for r in rooms) / len(rooms), 2) if rooms else 0.0

    return {
        "total_rooms": total_rooms,
        "available_rooms": available_rooms,
        "booked_rooms": booked_rooms,
        "total_bookings": total_bookings,
        "confirmed_bookings": confirmed_bookings,
        "cancelled_bookings": cancelled_bookings,
        "completed_bookings": completed_bookings,
        "total_revenue": total_revenue,
        "monthly_revenue": monthly_revenue,
        # Legacy fields for existing host UI
        "active_bookings": len(active),
        "month_revenue": month_revenue,
        "month_platform_fees": round(month_platform_fees, 2),
        "occupancy_rate": monthly_revenue[today.month - 1]["occupancy"],
        "avg_rating": avg_rating,
        "recent_bookings": [
            serialize_doc(b)
            for b in sorted(all_bookings, key=lambda x: x.get("created_at", datetime.min), reverse=True)[:5]
        ],
        "months": legacy_months,
    }


async def _tourist_dashboard(user: dict) -> dict:
    guest_id = str(user["_id"])
    bookings_col = database.collection("bookings")
    today = date.today().isoformat()

    all_bookings = await bookings_col.find({"guest_id": guest_id}).to_list(500)
    paid = [b for b in all_bookings if b.get("payment_status") == "paid" and b.get("status") != "cancelled"]
    upcoming = [
        b for b in all_bookings
        if b.get("status") == "confirmed" and b.get("check_in_date", "") >= today
    ]
    total_spent = sum(b.get("total_price", 0) for b in paid)

    return {
        "total_bookings": len(all_bookings),
        "upcoming_trips": len(upcoming),
        "total_spent": round(total_spent, 2),
        "referral_credits": float(user.get("referral_credits", 0)),
        "wishlist_count": len(user.get("wishlist", [])),
        "recent_bookings": [
            serialize_doc(b)
            for b in sorted(all_bookings, key=lambda x: x.get("created_at", datetime.min), reverse=True)[:5]
        ],
    }


@router.get("/dashboard")
async def dashboard(user: dict = Depends(require_role("tourist", "host", "admin"))):
    if user.get("role") in ("host", "admin"):
        return await _host_stats_dashboard(str(user["_id"]))
    return await _tourist_dashboard(user)


@router.get("/guest/dashboard")
async def guest_dashboard(user: dict = Depends(require_role("tourist", "host", "admin"))):
    return await _tourist_dashboard(user)


@router.get("/host/dashboard")
async def host_dashboard(user: dict = Depends(require_role("host", "admin"))):
    return await _host_stats_dashboard(str(user["_id"]))


@router.get("/analytics/occupancy")
async def occupancy_analytics(
    year: int | None = None,
    user: dict = Depends(require_role("host", "admin")),
):
    yr = _parse_year(year)
    host_id = str(user["_id"])
    room_ids = await _host_room_ids(host_id)
    rooms = await database.collection("rooms").find({"host_id": host_id}).to_list(500)
    rooms_by_id = {str(r["_id"]): r for r in rooms}

    if not room_ids:
        empty_months = [{"month": m, "occupancy_rate": 0.0, "booked_nights": 0, "available_nights": 0} for m in range(1, 13)]
        empty_occ = [{"month": name, "occupancy_percent": 0.0} for name in MONTH_NAMES]
        empty_rev = [{"month": name, "revenue": 0.0} for name in MONTH_NAMES]
        return {
            "year": yr,
            "months": empty_months,
            "monthly_occupancy": empty_occ,
            "monthly_revenue": empty_rev,
            "room_type_distribution": [],
            "top_rooms": [],
            "avg_stay_nights": 0.0,
            "busiest_day": "Monday",
        }

    bookings = await database.collection("bookings").find(
        {
            "host_id": host_id,
            "status": {"$in": ["confirmed", "completed"]},
            "payment_status": {"$in": ["pending", "paid"]},
        }
    ).to_list(5000)

    paid_bookings = await database.collection("bookings").find(
        {"host_id": host_id, "payment_status": "paid"}
    ).to_list(5000)

    months = []
    monthly_occupancy = []
    monthly_revenue = []
    num_rooms = len(room_ids)

    for month in range(1, 13):
        days_in_month = calendar.monthrange(yr, month)[1]
        available_nights = days_in_month * num_rooms
        booked_nights = sum(
            _nights_in_month(b["check_in_date"], b["check_out_date"], yr, month) for b in bookings
        )
        rate = round((booked_nights / available_nights) * 100, 1) if available_nights else 0.0
        months.append({
            "month": month,
            "occupancy_rate": rate,
            "booked_nights": booked_nights,
            "available_nights": available_nights,
        })
        monthly_occupancy.append({"month": MONTH_NAMES[month - 1], "occupancy_percent": rate})

        month_start, month_end = _month_range(yr, month)
        month_paid = [
            b for b in paid_bookings
            if month_start.isoformat() <= b.get("check_in_date", "") < month_end.isoformat()
        ]
        revenue = round(sum(_host_earning(b) for b in month_paid), 2)
        monthly_revenue.append({"month": MONTH_NAMES[month - 1], "revenue": revenue})

    type_counts: Counter[str] = Counter()
    for room in rooms:
        type_counts[room.get("room_category", "Other")] += 1
    room_type_distribution = [{"type": t, "count": c} for t, c in type_counts.items()]

    room_stats: dict[str, dict] = defaultdict(lambda: {"bookings": 0, "revenue": 0.0})
    for b in paid_bookings:
        rid = b.get("room_id", "")
        room_stats[rid]["bookings"] += 1
        room_stats[rid]["revenue"] += _host_earning(b)

    top_rooms = []
    for rid, stats in sorted(room_stats.items(), key=lambda x: x[1]["revenue"], reverse=True)[:3]:
        room = rooms_by_id.get(rid, {})
        top_rooms.append({
            "room_number": room.get("room_number", ""),
            "title": room.get("title", ""),
            "bookings": stats["bookings"],
            "revenue": round(stats["revenue"], 2),
        })

    stay_nights = [b.get("total_nights", 0) for b in bookings if b.get("total_nights")]
    avg_stay_nights = round(sum(stay_nights) / len(stay_nights), 1) if stay_nights else 0.0

    weekday_counts: Counter[str] = Counter()
    for b in bookings:
        try:
            wd = date.fromisoformat(b["check_in_date"]).weekday()
            weekday_counts[WEEKDAY_NAMES[wd]] += 1
        except (TypeError, ValueError, KeyError):
            continue
    busiest_day = weekday_counts.most_common(1)[0][0] if weekday_counts else "Monday"

    return {
        "year": yr,
        "months": months,
        "monthly_occupancy": monthly_occupancy,
        "monthly_revenue": monthly_revenue,
        "room_type_distribution": room_type_distribution,
        "top_rooms": top_rooms,
        "avg_stay_nights": avg_stay_nights,
        "busiest_day": busiest_day,
    }


@router.get("/analytics/revenue")
async def revenue_analytics(
    year: int | None = None,
    host_id: str | None = None,
    user: dict = Depends(require_role("host", "admin")),
):
    yr = _parse_year(year)
    target_host = host_id or str(user["_id"])
    if user["role"] != "admin" and target_host != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Forbidden")

    room_ids = await _host_room_ids(target_host)
    months = []
    for month in range(1, 13):
        month_start, month_end = _month_range(yr, month)
        q = {
            "host_id": target_host,
            "status": {"$in": ["confirmed", "completed"]},
            "payment_status": "paid",
            "check_in_date": {"$gte": month_start.isoformat(), "$lt": month_end.isoformat()},
        }
        if room_ids:
            q["room_id"] = {"$in": room_ids}
        bookings = await database.collection("bookings").find(q).to_list(5000)
        revenue = sum(_host_earning(b) for b in bookings)
        platform_fees = sum(_host_platform_fee(b) for b in bookings)
        gst_collected = sum(b.get("gst_amount", 0) for b in bookings)
        months.append({
            "month": month,
            "revenue": round(revenue, 2),
            "platform_fees": round(platform_fees, 2),
            "gst_collected": round(gst_collected, 2),
        })
    return {"year": yr, "host_id": target_host, "months": months}
