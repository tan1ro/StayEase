from __future__ import annotations

import logging

from twilio.rest import Client

from config import settings

logger = logging.getLogger(__name__)


def _client() -> Client | None:
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        return None
    return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)


def send_whatsapp(to_phone: str, body: str) -> bool:
    client = _client()
    if client is None:
        return False
    to = to_phone if to_phone.startswith("+") else f"+91{to_phone}"
    try:
        client.messages.create(
            from_=settings.TWILIO_WHATSAPP_FROM,
            to=f"whatsapp:{to}",
            body=body,
        )
        return True
    except Exception as exc:
        logger.warning("Failed to send WhatsApp to %s: %s", to_phone, exc)
        return False


def booking_confirmation_message(booking: dict, room: dict) -> str:
    return (
        f"StayEase booking confirmed. Booking ID: {booking['_id']}. "
        f"Room {room.get('room_number')} from {booking['check_in_date']} to "
        f"{booking['check_out_date']}. Total INR {booking['total_price']}."
    )
