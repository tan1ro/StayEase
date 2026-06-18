from __future__ import annotations

import calendar
from collections import Counter, defaultdict
from datetime import date, datetime

from fastapi import APIRouter, Depends

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


def _host_earning(booking: dict) -> float:
    if booking.get("host_payout") is not None:
        return float(booking["host_payout"])
    return float(booking.get("subtotal", booking.get("total_price", 0)))


def _host_platform_fee(booking: dict) -> float:
    if booking.get("host_platform_fee") is not None:
        return float(booking["host_platform_fee"])
    return 0.0


async def _host_year_analytics(host_id: str, year: int) -> dict:
    rooms = await database.collection("rooms").find({"host_id": host_id}).to_list(500)
    room_ids = [str(r["_id"]) for r in rooms]
    rooms_by_id = {str(r["_id"]): r for r in rooms}

    if not room_ids:
        empty_months = [
            {
                "month": MONTH_NAMES[m - 1],
                "month_number": m,
                "revenue": 0.0,
                "bookings": 0,
                "occupancy": 0.0,
                "platform_fees": 0.0,
                "gst_collected": 0.0,
                "booked_nights": 0,
                "available_nights": 0,
            }
            for m in range(1, 13)
        ]
        return {
            "year": year,
            "monthly_revenue": empty_months,
            "monthly_occupancy": [{"month": m["month"], "occupancy_percent": 0.0} for m in empty_months],
            "revenue_detail": empty_months,
            "room_type_distribution": [],
            "top_rooms": [],
            "avg_stay_nights": 0.0,
            "busiest_day": "Monday",
            "ytd_revenue": 0.0,
            "ytd_platform_fees": 0.0,
            "ytd_gst_collected": 0.0,
            "ytd_bookings": 0,
            "ytd_nights_booked": 0,
            "avg_daily_rate": 0.0,
            "net_earnings": 0.0,
            "ytd_occupancy_avg": 0.0,
            "peak_month": None,
            "revenue_by_category": [],
        }

    bookings_col = database.collection("bookings")
    active_bookings = await bookings_col.find(
        {
            "host_id": host_id,
            "status": {"$in": ["confirmed", "completed"]},
            "payment_status": {"$in": ["pending", "paid"]},
        }
    ).to_list(5000)
    paid_bookings = await bookings_col.find(
        {"host_id": host_id, "payment_status": "paid"}
    ).to_list(5000)

    num_rooms = len(room_ids)
    monthly_revenue = []
    monthly_occupancy = []
    revenue_detail = []
    ytd_revenue = 0.0
    ytd_platform_fees = 0.0
    ytd_gst_collected = 0.0

    for month in range(1, 13):
        month_start, month_end = _month_range(year, month)
        days_in_month = calendar.monthrange(year, month)[1]
        available_nights = days_in_month * num_rooms
        booked_nights = sum(
            _nights_in_month(b["check_in_date"], b["check_out_date"], year, month)
            for b in active_bookings
        )
        occupancy = round((booked_nights / available_nights) * 100, 1) if available_nights else 0.0

        month_paid = [
            b for b in paid_bookings
            if month_start.isoformat() <= b.get("check_in_date", "") < month_end.isoformat()
        ]
        revenue = round(sum(_host_earning(b) for b in month_paid), 2)
        platform_fees = round(sum(_host_platform_fee(b) for b in month_paid), 2)
        gst_collected = round(sum(float(b.get("gst_amount", 0) or 0) for b in month_paid), 2)

        ytd_revenue += revenue
        ytd_platform_fees += platform_fees
        ytd_gst_collected += gst_collected

        month_label = MONTH_NAMES[month - 1]
        monthly_revenue.append({
            "month": month_label,
            "month_number": month,
            "revenue": revenue,
            "bookings": len(month_paid),
            "occupancy": occupancy,
            "platform_fees": platform_fees,
            "gst_collected": gst_collected,
            "booked_nights": booked_nights,
            "available_nights": available_nights,
        })
        monthly_occupancy.append({"month": month_label, "occupancy_percent": occupancy})
        revenue_detail.append({
            "month": month_label,
            "month_number": month,
            "revenue": revenue,
            "platform_fees": platform_fees,
            "gst_collected": gst_collected,
        })

    type_counts: Counter[str] = Counter()
    for room in rooms:
        type_counts[room.get("room_category", "Other")] += 1
    room_type_distribution = [{"type": t, "count": c} for t, c in type_counts.items()]

    room_stats: dict[str, dict] = defaultdict(lambda: {"bookings": 0, "revenue": 0.0})
    for b in paid_bookings:
        try:
            check_in = date.fromisoformat(b["check_in_date"])
        except (TypeError, ValueError):
            continue
        if check_in.year != year:
            continue
        rid = b.get("room_id", "")
        room_stats[rid]["bookings"] += 1
        room_stats[rid]["revenue"] += _host_earning(b)

    top_rooms = []
    for rid, stats in sorted(room_stats.items(), key=lambda x: x[1]["revenue"], reverse=True)[:5]:
        room = rooms_by_id.get(rid, {})
        top_rooms.append({
            "room_id": rid,
            "room_number": room.get("room_number", ""),
            "title": room.get("title", ""),
            "bookings": stats["bookings"],
            "revenue": round(stats["revenue"], 2),
            "avg_rating": room.get("avg_rating", 0.0),
            "total_reviews": room.get("total_reviews", 0),
        })

    year_bookings = [
        b for b in active_bookings
        if b.get("check_in_date", "")[:4] == str(year)
    ]
    year_paid = [
        b for b in paid_bookings
        if b.get("check_in_date", "")[:4] == str(year)
    ]
    stay_nights = [b.get("total_nights", 0) for b in year_bookings if b.get("total_nights")]
    avg_stay_nights = round(sum(stay_nights) / len(stay_nights), 1) if stay_nights else 0.0
    ytd_nights_booked = sum(b.get("total_nights", 0) for b in year_paid)
    ytd_bookings = len(year_paid)
    avg_daily_rate = round(ytd_revenue / ytd_nights_booked, 2) if ytd_nights_booked else 0.0
    net_earnings = round(ytd_revenue - ytd_platform_fees, 2)
    ytd_occupancy_avg = round(
        sum(m["occupancy"] for m in monthly_revenue) / len(monthly_revenue), 1
    ) if monthly_revenue else 0.0
    peak_month = max(monthly_revenue, key=lambda m: m["revenue"])["month"] if monthly_revenue else None

    category_revenue: dict[str, float] = defaultdict(float)
    for b in year_paid:
        room = rooms_by_id.get(b.get("room_id", ""), {})
        cat = room.get("room_category", "Other")
        category_revenue[cat] += _host_earning(b)
    revenue_by_category = [
        {"category": cat, "revenue": round(rev, 2)}
        for cat, rev in sorted(category_revenue.items(), key=lambda x: x[1], reverse=True)
    ]

    weekday_counts: Counter[str] = Counter()
    for b in year_bookings:
        try:
            wd = date.fromisoformat(b["check_in_date"]).weekday()
            weekday_counts[WEEKDAY_NAMES[wd]] += 1
        except (TypeError, ValueError, KeyError):
            continue
    busiest_day = weekday_counts.most_common(1)[0][0] if weekday_counts else "Monday"

    return {
        "year": year,
        "monthly_revenue": monthly_revenue,
        "monthly_occupancy": monthly_occupancy,
        "revenue_detail": revenue_detail,
        "room_type_distribution": room_type_distribution,
        "top_rooms": top_rooms,
        "avg_stay_nights": avg_stay_nights,
        "busiest_day": busiest_day,
        "ytd_revenue": round(ytd_revenue, 2),
        "ytd_platform_fees": round(ytd_platform_fees, 2),
        "ytd_gst_collected": round(ytd_gst_collected, 2),
        "ytd_bookings": ytd_bookings,
        "ytd_nights_booked": ytd_nights_booked,
        "avg_daily_rate": avg_daily_rate,
        "net_earnings": net_earnings,
        "ytd_occupancy_avg": ytd_occupancy_avg,
        "peak_month": peak_month,
        "revenue_by_category": revenue_by_category,
    }


async def _host_stats_dashboard(host_id: str, year: int | None = None) -> dict:
    rooms = await database.collection("rooms").find({"host_id": host_id}).to_list(500)
    room_ids = [str(r["_id"]) for r in rooms]

    bookings_col = database.collection("bookings")
    all_bookings = await bookings_col.find({"host_id": host_id}).to_list(5000)
    today = date.today()
    today_iso = today.isoformat()
    yr = _parse_year(year)

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

    active = [b for b in all_bookings if b.get("status") == "confirmed"]
    avg_rating = round(sum(r.get("avg_rating", 0) for r in rooms) / len(rooms), 2) if rooms else 0.0

    month_revenue = 0.0
    month_platform_fees = 0.0
    for b in paid_bookings:
        check_in = b.get("check_in_date", "")
        if check_in >= date(today.year, today.month, 1).isoformat() and check_in[:7] == today.isoformat()[:7]:
            month_revenue += _host_earning(b)
            month_platform_fees += _host_platform_fee(b)

    year_analytics = await _host_year_analytics(host_id, yr)
    current_month = year_analytics["monthly_revenue"][today.month - 1] if yr == today.year else None

    cancellation_rate = (
        round((cancelled_bookings / total_bookings) * 100, 1) if total_bookings else 0.0
    )
    booking_status_breakdown = [
        {"status": "confirmed", "count": confirmed_bookings, "label": "Confirmed"},
        {"status": "completed", "count": completed_bookings, "label": "Completed"},
        {"status": "cancelled", "count": cancelled_bookings, "label": "Cancelled"},
    ]
    upcoming_check_ins = [
        serialize_doc(b)
        for b in sorted(
            [
                b for b in all_bookings
                if b.get("status") == "confirmed"
                and b.get("check_in_date", "") >= today_iso
            ],
            key=lambda x: x.get("check_in_date", ""),
        )[:5]
    ]

    return {
        "total_rooms": total_rooms,
        "available_rooms": available_rooms,
        "booked_rooms": booked_rooms,
        "total_bookings": total_bookings,
        "confirmed_bookings": confirmed_bookings,
        "cancelled_bookings": cancelled_bookings,
        "completed_bookings": completed_bookings,
        "total_revenue": total_revenue,
        "active_bookings": len(active),
        "month_revenue": round(month_revenue, 2),
        "month_platform_fees": round(month_platform_fees, 2),
        "occupancy_rate": current_month["occupancy"] if current_month else 0.0,
        "avg_rating": avg_rating,
        "recent_bookings": [
            serialize_doc(b)
            for b in sorted(all_bookings, key=lambda x: x.get("created_at", datetime.min), reverse=True)[:5]
        ],
        "cancellation_rate": cancellation_rate,
        "booking_status_breakdown": booking_status_breakdown,
        "upcoming_check_ins": upcoming_check_ins,
        **year_analytics,
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
async def dashboard(
    year: int | None = None,
    user: dict = Depends(require_role("tourist", "host", "admin")),
):
    if user.get("role") in ("host", "admin"):
        return await _host_stats_dashboard(str(user["_id"]), year=year)
    return await _tourist_dashboard(user)


@router.get("/guest/dashboard")
async def guest_dashboard(user: dict = Depends(require_role("tourist", "host", "admin"))):
    return await _tourist_dashboard(user)


@router.get("/host/dashboard")
async def host_dashboard(
    year: int | None = None,
    user: dict = Depends(require_role("host", "admin")),
):
    return await _host_stats_dashboard(str(user["_id"]), year=year)
