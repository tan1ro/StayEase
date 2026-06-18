from __future__ import annotations

from datetime import date, datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from database import database
from services.email import send_template_email
from services.whatsapp import send_whatsapp

scheduler = AsyncIOScheduler()

REMINDER_WINDOWS = [
    (7, "check_in_date", "booking_reminder.html", True, "d7"),
    (3, "check_in_date", "booking_reminder.html", True, "d3"),
    (1, "check_in_date", "booking_reminder.html", True, "d1"),
    (-1, "check_out_date", "review_request.html", True, "review"),
]


async def _complete_past_stays() -> None:
    today = date.today().isoformat()
    await database.collection("bookings").update_many(
        {
            "check_out_date": {"$lte": today},
            "status": "confirmed",
            "payment_status": "paid",
        },
        {"$set": {"status": "completed"}},
    )


async def _send_checkin_day_whatsapp() -> None:
    """Check-in morning: WhatsApp only (no email)."""
    today = date.today().isoformat()
    bookings = database.collection("bookings")
    cursor = bookings.find({"check_in_date": today, "status": "confirmed"})
    async for booking in cursor:
        result = await bookings.update_one(
            {"_id": booking["_id"], "reminder_flags.checkin_day": {"$ne": True}},
            {"$set": {"reminder_flags.checkin_day": True}},
        )
        if result.modified_count == 0:
            continue
        phone = booking.get("guest_phone")
        if not phone:
            continue
        room_id = booking.get("room_id", "")
        send_whatsapp(
            phone,
            (
                f"StayEase: Today is your check-in day. "
                f"Booking {str(booking.get('_id', ''))[-8:].upper()} is ready. "
                f"Room ref {room_id[-6:] if room_id else 'N/A'}. Have a great stay."
            ),
        )


async def _process_reminders() -> None:
    await _complete_past_stays()
    await _send_checkin_day_whatsapp()
    bookings = database.collection("bookings")
    now = datetime.utcnow().date()
    for days, date_field, template, send_wa, flag_key in REMINDER_WINDOWS:
        target = (now + timedelta(days=days)).isoformat()
        cursor = bookings.find({date_field: target, "status": {"$in": ["confirmed", "completed"]}})
        async for booking in cursor:
            result = await bookings.update_one(
                {"_id": booking["_id"], f"reminder_flags.{flag_key}": {"$ne": True}},
                {"$set": {f"reminder_flags.{flag_key}": True}},
            )
            if result.modified_count == 0:
                continue

            guest_email = booking.get("guest_email")
            if guest_email:
                await send_template_email(
                    to=guest_email,
                    subject="StayEase booking reminder",
                    template_name=template,
                    context={"booking": booking, "days": days},
                )
            if send_wa and booking.get("guest_phone"):
                send_whatsapp(
                    booking["guest_phone"],
                    f"StayEase reminder: your stay is in {abs(days)} day(s).",
                )


def start_scheduler() -> None:
    if not scheduler.running:
        scheduler.add_job(_process_reminders, "interval", hours=1, id="reminders")
        scheduler.start()


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
