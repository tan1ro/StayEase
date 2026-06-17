from __future__ import annotations

import calendar
from datetime import date, datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from database import database
from models.common import serialize_doc
from services.auth import get_current_user, require_role

router = APIRouter(prefix="/api", tags=["analytics"])


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


@router.get("/analytics/occupancy")
async def occupancy_analytics(
    year: int | None = None,
    user: dict = Depends(require_role("host", "admin")),
):
    yr = _parse_year(year)
    host_id = str(user["_id"])
    room_ids = await _host_room_ids(host_id)
    if not room_ids:
        return {"year": yr, "months": [{"month": m, "occupancy_rate": 0.0, "booked_nights": 0, "available_nights": 0} for m in range(1, 13)]}

    bookings = await database.collection("bookings").find(
        {
            "room_id": {"$in": room_ids},
            "status": {"$in": ["confirmed", "completed"]},
            "payment_status": {"$in": ["pending", "paid"]},
        }
    ).to_list(5000)

    months = []
    num_rooms = len(room_ids)
    for month in range(1, 13):
        days_in_month = calendar.monthrange(yr, month)[1]
        available_nights = days_in_month * num_rooms
        booked_nights = sum(_nights_in_month(b["check_in_date"], b["check_out_date"], yr, month) for b in bookings)
        rate = round((booked_nights / available_nights) * 100, 1) if available_nights else 0.0
        months.append(
            {
                "month": month,
                "occupancy_rate": rate,
                "booked_nights": booked_nights,
                "available_nights": available_nights,
            }
        )
    return {"year": yr, "months": months}


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


@router.get("/dashboard")
async def tourist_dashboard(user: dict = Depends(require_role("tourist", "host", "admin"))):
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
        "recent_bookings": [serialize_doc(b) for b in sorted(all_bookings, key=lambda x: x.get("created_at", datetime.min), reverse=True)[:5]],
    }


@router.get("/host/dashboard")
async def host_dashboard(user: dict = Depends(require_role("host", "admin"))):
    host_id = str(user["_id"])
    rooms = await database.collection("rooms").find({"host_id": host_id}).to_list(500)
    room_ids = [str(r["_id"]) for r in rooms]

    bookings_col = database.collection("bookings")
    all_bookings = await bookings_col.find({"host_id": host_id}).to_list(500)
    today = date.today()
    month_start = date(today.year, today.month, 1).isoformat()

    active = [b for b in all_bookings if b.get("status") == "confirmed"]
    month_revenue = sum(
        _host_earning(b)
        for b in all_bookings
        if b.get("payment_status") == "paid" and b.get("check_in_date", "") >= month_start
    )
    month_platform_fees = sum(
        _host_platform_fee(b)
        for b in all_bookings
        if b.get("payment_status") == "paid" and b.get("check_in_date", "") >= month_start
    )

    yr = today.year
    month = today.month
    days_in_month = calendar.monthrange(yr, month)[1]
    available_nights = days_in_month * max(len(room_ids), 1)
    booked_nights = sum(
        _nights_in_month(b["check_in_date"], b["check_out_date"], yr, month)
        for b in all_bookings
        if b.get("status") in ("confirmed", "completed")
    )
    occupancy_rate = round((booked_nights / available_nights) * 100, 1) if available_nights else 0.0

    return {
        "total_rooms": len(rooms),
        "active_bookings": len(active),
        "month_revenue": round(month_revenue, 2),
        "month_platform_fees": round(month_platform_fees, 2),
        "occupancy_rate": occupancy_rate,
        "avg_rating": round(sum(r.get("avg_rating", 0) for r in rooms) / len(rooms), 2) if rooms else 0.0,
        "recent_bookings": [serialize_doc(b) for b in sorted(all_bookings, key=lambda x: x.get("created_at", datetime.min), reverse=True)[:5]],
    }
