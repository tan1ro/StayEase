from __future__ import annotations

from datetime import datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from database import database
from models.common import utc_now
from services.email import send_template_email
from services.whatsapp import send_whatsapp

scheduler = AsyncIOScheduler()


async def _process_reminders() -> None:
    bookings = database.collection("bookings")
    now = datetime.utcnow().date()
    windows = [
        (7, "booking_reminder.html", True),
        (3, "booking_reminder.html", True),
        (1, "booking_reminder.html", True),
        (-1, "review_request.html", True),
    ]
    for days, template, send_wa in windows:
        target = (now + timedelta(days=days)).isoformat()
        field = "check_in_date" if days >= 0 else "check_out_date"
        cursor = bookings.find({field: target, "status": {"$in": ["confirmed", "completed"]}})
        async for booking in cursor:
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
