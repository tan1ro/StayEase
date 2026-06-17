from __future__ import annotations

from datetime import date


def is_booking_reviewable(booking: dict) -> bool:
    if booking.get("status") == "cancelled":
        return False
    try:
        check_out = date.fromisoformat(str(booking["check_out_date"]))
    except (TypeError, ValueError, KeyError):
        return False
    if date.today() < check_out:
        return False
    if booking.get("status") == "completed":
        return True
    return booking.get("status") == "confirmed" and booking.get("payment_status") == "paid"
