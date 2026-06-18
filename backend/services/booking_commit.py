from __future__ import annotations

from datetime import date
from typing import Any

from bson import ObjectId
from fastapi import HTTPException

from database import database
from models.booking import CheckInVerification
from models.common import utc_now
from services.availability import blocked_dates_conflict
from services.waitlist import find_conflicting_booking, promote_waitlist_on_cancel


class BookingConflictError(Exception):
    pass


class OfferExhaustedError(Exception):
    pass


class InsufficientReferralCreditsError(Exception):
    pass


async def commit_booking(
    *,
    room_id: str,
    check_in: date,
    check_out: date,
    num_guests: int,
    booking_for: str,
    room: dict[str, Any],
    user: dict[str, Any],
    offer: dict[str, Any] | None,
    pricing: dict[str, Any],
    check_in_verification: CheckInVerification,
    staying_guest_name: str,
    persist_identity: dict | None,
    host_message: str | None,
    offer_code: str | None,
    preferred_room_number: str | None = None,
    room_preference_notes: str | None = None,
) -> dict[str, Any]:
    credit_used = float(pricing.get("referral_credit_used", 0))
    offer_applied = offer is not None and pricing.get("discount_amount", 0) > 0

    doc: dict[str, Any] = {
        "room_id": room_id,
        "guest_id": str(user["_id"]),
        "host_id": room["host_id"],
        "guest_name": staying_guest_name,
        "booker_name": user["name"],
        "guest_phone": user["phone"],
        "guest_email": user["email"],
        "check_in_date": check_in.isoformat(),
        "check_out_date": check_out.isoformat(),
        "total_nights": pricing["total_nights"],
        "num_guests": num_guests,
        "base_price": pricing["base_price"],
        "final_price_per_night": pricing["final_price_per_night"],
        "price_breakdown": pricing["price_breakdown"],
        "subtotal": pricing["subtotal"],
        "guest_platform_fee": pricing["guest_platform_fee"],
        "host_platform_fee": pricing["host_platform_fee"],
        "host_payout": pricing["host_payout"],
        "gst_rate": pricing["gst_rate"],
        "gst_amount": pricing["gst_amount"],
        "total_price": pricing["total_price"],
        "offer_code": offer_code.upper() if offer_code else None,
        "discount_amount": pricing["discount_amount"],
        "referral_credit_used": credit_used,
        "payment_status": "pending",
        "status": "confirmed",
        "invoice_url": None,
        "cancellation_policy": room.get("policies", {}).get("cancellation", "moderate"),
        "booking_for": booking_for,
        "check_in_verification": check_in_verification.model_dump(),
        "host_message": host_message,
        "preferred_room_number": preferred_room_number,
        "room_preference_notes": room_preference_notes,
        "created_at": utc_now(),
    }

    async def _txn(session) -> dict[str, Any]:
        conflict = await find_conflicting_booking(room_id, check_in, check_out, session=session)
        if conflict:
            raise BookingConflictError()

        if blocked_dates_conflict(room.get("blocked_dates"), check_in, check_out):
            raise BookingConflictError()

        if offer_applied and offer is not None:
            result = await database.collection("offers").update_one(
                {"_id": offer["_id"], "used_count": {"$lt": offer["usage_limit"]}},
                {"$inc": {"used_count": 1}},
                session=session,
            )
            if result.modified_count == 0:
                raise OfferExhaustedError()

        if credit_used > 0:
            result = await database.collection("users").update_one(
                {"_id": user["_id"], "referral_credits": {"$gte": credit_used}},
                {"$inc": {"referral_credits": -credit_used}},
                session=session,
            )
            if result.modified_count == 0:
                raise InsufficientReferralCreditsError()

        if persist_identity:
            await database.collection("users").update_one(
                {"_id": user["_id"]},
                {"$set": {"identity_proof": persist_identity}},
                session=session,
            )

        res = await database.collection("bookings").insert_one(doc, session=session)
        created = await database.collection("bookings").find_one({"_id": res.inserted_id}, session=session)
        if created is None:
            raise RuntimeError("Booking insert failed")
        return created

    try:
        return await database.run_transaction(_txn)
    except BookingConflictError:
        raise HTTPException(
            status_code=409,
            detail={"message": "Room unavailable for selected dates"},
        ) from None
    except OfferExhaustedError:
        raise HTTPException(status_code=422, detail={"offer_code": "Offer usage limit reached"}) from None
    except InsufficientReferralCreditsError:
        raise HTTPException(status_code=422, detail={"referral_credits": "Insufficient referral credits"}) from None


async def commit_payment(
    *,
    booking_id: str,
    invoice_doc: dict[str, Any],
    invoice_url: str,
) -> tuple[dict[str, Any] | None, bool]:
    if not ObjectId.is_valid(booking_id):
        return None, False

    async def _txn(session) -> tuple[dict[str, Any] | None, bool]:
        booking_oid = ObjectId(booking_id)
        existing = await database.collection("invoices").find_one({"booking_id": booking_id}, session=session)
        if existing:
            booking = await database.collection("bookings").find_one({"_id": booking_oid}, session=session)
            return booking, False

        result = await database.collection("bookings").update_one(
            {"_id": booking_oid, "payment_status": {"$ne": "paid"}},
            {"$set": {"payment_status": "paid", "invoice_url": invoice_url}},
            session=session,
        )
        if result.modified_count == 0:
            booking = await database.collection("bookings").find_one({"_id": booking_oid}, session=session)
            return booking, False

        await database.collection("invoices").insert_one(invoice_doc, session=session)
        booking = await database.collection("bookings").find_one({"_id": booking_oid}, session=session)
        return booking, True

    return await database.run_transaction(_txn)


class AlreadyCancelledError(Exception):
    pass


async def commit_cancellation(
    *,
    booking_id: str,
    breakdown: dict[str, Any],
    new_payment_status: str,
    refund_status: str,
    room_id: str,
    check_in: date,
    check_out: date,
) -> tuple[dict[str, Any], bool]:
    if not ObjectId.is_valid(booking_id):
        raise HTTPException(status_code=404, detail="Booking not found")

    async def _txn(session) -> tuple[dict[str, Any], bool]:
        booking_oid = ObjectId(booking_id)
        booking = await database.collection("bookings").find_one(
            {"_id": booking_oid, "status": {"$ne": "cancelled"}},
            session=session,
        )
        if not booking:
            existing = await database.collection("bookings").find_one({"_id": booking_oid}, session=session)
            if existing and existing.get("status") == "cancelled":
                raise AlreadyCancelledError()
            raise HTTPException(status_code=404, detail="Booking not found")

        await database.collection("bookings").update_one(
            {"_id": booking_oid, "status": {"$ne": "cancelled"}},
            {
                "$set": {
                    "status": "cancelled",
                    "payment_status": new_payment_status,
                    "cancelled_at": utc_now().isoformat(),
                    "cancellation_charge": breakdown["cancellation_charge"],
                    "refund_amount": breakdown["refund_amount"],
                    "refund_status": refund_status,
                    "cancellation_reason": breakdown["reason"],
                }
            },
            session=session,
        )

        credit_used = float(booking.get("referral_credit_used", 0))
        if credit_used > 0 and ObjectId.is_valid(booking.get("guest_id", "")):
            await database.collection("users").update_one(
                {"_id": ObjectId(booking["guest_id"])},
                {"$inc": {"referral_credits": credit_used}},
                session=session,
            )

        if booking.get("offer_code") and float(booking.get("discount_amount", 0)) > 0:
            await database.collection("offers").update_one(
                {"code": booking["offer_code"], "used_count": {"$gt": 0}},
                {"$inc": {"used_count": -1}},
                session=session,
            )

        await promote_waitlist_on_cancel(room_id, check_in, check_out, session=session)

        updated = await database.collection("bookings").find_one({"_id": booking_oid}, session=session)
        if updated is None:
            raise RuntimeError("Cancellation update failed")
        return updated, True

    try:
        return await database.run_transaction(_txn)
    except AlreadyCancelledError:
        raise HTTPException(status_code=409, detail="Booking already cancelled") from None
