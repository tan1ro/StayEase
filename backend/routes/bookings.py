from __future__ import annotations

import logging
from datetime import date

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import Response
from motor.motor_asyncio import AsyncIOMotorDatabase

from config import settings
from database import get_database
from models.booking import (
    BookingBatchCreate,
    BookingCreate,
    BookingIdentityProof,
    CheckInVerification,
)
from models.common import serialize_doc, utc_now
from models.user import IdentityProof
from services.auth import get_current_user, require_role
from services.roles import is_host_role, is_tourist_role, normalize_role
from services.email import send_template_email
from services.invoice import generate_invoice_pdf, generate_tax_invoice_pdf
from services.cloudinary import upload_image, upload_pdf_optional
from services.pricing import calculate_dynamic_pricing
from services.cancellation import calculate_cancellation
from services.booking_commit import (
    commit_booking,
    commit_bookings_batch,
    commit_cancellation,
    commit_payment,
)
from services.waitlist import find_conflicting_booking
from services.availability import blocked_dates_conflict
from services.whatsapp import booking_confirmation_message, send_whatsapp
from services.review_eligibility import is_booking_reviewable

router = APIRouter(prefix="/api/bookings", tags=["bookings"])
logger = logging.getLogger(__name__)


def _build_check_in_verification(
    payload: BookingCreate, user: dict
) -> tuple[CheckInVerification, str, dict | None]:
    """Return verification payload, guest display name, and optional identity proof to persist on user."""
    if payload.booking_for == "other":
        name = (payload.staying_guest_name or "").strip()
        if not name:
            raise HTTPException(
                status_code=422, detail={"staying_guest_name": "Guest name is required"}
            )
        if not payload.guest_photo_url:
            raise HTTPException(
                status_code=422,
                detail={"guest_photo_url": "Guest photograph is required"},
            )
        verification = CheckInVerification(
            booking_for="other",
            staying_guest_name=name,
            staying_guest_phone=payload.staying_guest_phone,
            guest_photo_url=payload.guest_photo_url,
            check_in_note="The staying guest must present the uploaded photograph at hotel check-in.",
        )
        return verification, name, None

    proof_doc: dict | None = None
    if payload.identity_proof:
        try:
            proof = IdentityProof(
                type=payload.identity_proof.type,
                number=payload.identity_proof.number,
                document_url=payload.identity_proof.document_url,
                verified=False,
            )
        except ValueError as e:
            raise HTTPException(
                status_code=422, detail={"identity_proof": str(e)}
            ) from e
        proof_doc = proof.model_dump()
    elif user.get("identity_proof"):
        proof_doc = user["identity_proof"]
    else:
        raise HTTPException(
            status_code=422,
            detail={
                "identity_proof": "Government ID proof is required when booking for yourself"
            },
        )

    verification = CheckInVerification(
        booking_for="self",
        identity_proof=BookingIdentityProof.model_validate(proof_doc),
        check_in_note="You must present the same government ID proof at hotel check-in.",
    )
    persist = proof_doc if payload.identity_proof else None
    return verification, user["name"], persist


@router.post("/verification-upload")
async def upload_verification_document(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    uploaded = await upload_image(file)
    return {"url": uploaded["url"], "public_id": uploaded.get("public_id")}


async def _get_offer(code: str | None, room_id: str, db: AsyncIOMotorDatabase):
    if not code:
        return None
    offers = db["offers"]
    offer = await offers.find_one({"code": code.upper(), "is_active": True})
    if not offer:
        raise HTTPException(
            status_code=422, detail={"offer_code": "Invalid offer code"}
        )
    today = date.today().isoformat()
    if offer["valid_from"] > today or offer["valid_until"] < today:
        raise HTTPException(status_code=422, detail={"offer_code": "Offer expired"})
    if offer["used_count"] >= offer["usage_limit"]:
        raise HTTPException(
            status_code=422, detail={"offer_code": "Offer usage limit reached"}
        )
    applicable = offer.get("applicable_rooms") or []
    if applicable and room_id not in applicable:
        raise HTTPException(
            status_code=422, detail={"offer_code": "Offer not applicable to this room"}
        )
    return offer


@router.post("", status_code=201)
async def create_booking(
    payload: BookingCreate,
    user: dict = Depends(require_role("tourist", "host", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    if payload.check_in_date < date.today():
        raise HTTPException(
            status_code=422, detail={"check_in_date": "Cannot book past dates"}
        )
    if payload.check_out_date <= payload.check_in_date:
        raise HTTPException(
            status_code=422,
            detail={"check_out_date": "Check-out must be after check-in"},
        )

    rooms = db["rooms"]
    if not ObjectId.is_valid(payload.room_id):
        raise HTTPException(status_code=404, detail="Room not found")
    room = await rooms.find_one({"_id": ObjectId(payload.room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    conflict = await find_conflicting_booking(
        payload.room_id, payload.check_in_date, payload.check_out_date
    )
    if conflict:
        raise HTTPException(
            status_code=409,
            detail={"message": "Room unavailable for selected dates"},
        )

    if blocked_dates_conflict(
        room.get("blocked_dates"), payload.check_in_date, payload.check_out_date
    ):
        raise HTTPException(
            status_code=409,
            detail={"message": "Room unavailable for selected dates"},
        )

    offer = await _get_offer(payload.offer_code, payload.room_id, db)
    pricing = calculate_dynamic_pricing(
        base_price=room["price_per_night"],
        check_in=payload.check_in_date,
        check_out=payload.check_out_date,
        offer=offer,
        referral_credits=float(user.get("referral_credits", 0)),
        view_type=room.get("view_type"),
        facing_side=room.get("facing_side"),
        room_category=room.get("room_category"),
    )

    check_in_verification, staying_guest_name, persist_identity = (
        _build_check_in_verification(payload, user)
    )

    booking = await commit_booking(
        room_id=payload.room_id,
        check_in=payload.check_in_date,
        check_out=payload.check_out_date,
        num_guests=payload.num_guests,
        booking_for=payload.booking_for,
        room=room,
        user=user,
        offer=offer,
        pricing=pricing,
        check_in_verification=check_in_verification,
        staying_guest_name=staying_guest_name,
        persist_identity=persist_identity,
        host_message=payload.host_message,
        offer_code=payload.offer_code,
        preferred_room_number=payload.preferred_room_number,
        room_preference_notes=payload.room_preference_notes,
    )
    booking_ser = serialize_doc(booking)

    await send_template_email(
        to=user["email"],
        subject="StayEase booking confirmation",
        template_name="booking_confirmation.html",
        context={"booking": booking_ser, "room": serialize_doc(room)},
    )
    send_whatsapp(user["phone"], booking_confirmation_message(booking_ser, room))

    return booking_ser


@router.post("/batch", status_code=201)
async def create_bookings_batch(
    payload: BookingBatchCreate,
    user: dict = Depends(require_role("tourist", "host", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    if payload.check_in_date < date.today():
        raise HTTPException(
            status_code=422, detail={"check_in_date": "Cannot book past dates"}
        )
    if payload.check_out_date <= payload.check_in_date:
        raise HTTPException(
            status_code=422,
            detail={"check_out_date": "Check-out must be after check-in"},
        )

    rooms_coll = db["rooms"]
    valid_ids = [rid for rid in payload.room_ids if ObjectId.is_valid(rid)]
    if len(valid_ids) != len(payload.room_ids):
        raise HTTPException(status_code=404, detail="Room not found")

    room_docs = await rooms_coll.find(
        {"_id": {"$in": [ObjectId(rid) for rid in valid_ids]}}
    ).to_list(len(valid_ids))
    room_by_id = {str(room["_id"]): room for room in room_docs}
    if len(room_by_id) != len(payload.room_ids):
        raise HTTPException(status_code=404, detail="Room not found")

    ordered_rooms = [room_by_id[rid] for rid in payload.room_ids]
    property_rooms = (
        await rooms_coll.find(
            {
                "host_id": ordered_rooms[0]["host_id"],
                "location.city": ordered_rooms[0].get("location", {}).get("city"),
            }
        )
        .sort("room_number", 1)
        .to_list(100)
    )

    for room in ordered_rooms:
        room_id = str(room["_id"])
        conflict = await find_conflicting_booking(
            room_id, payload.check_in_date, payload.check_out_date
        )
        if conflict:
            raise HTTPException(
                status_code=409,
                detail={"message": "Room unavailable for selected dates"},
            )
        if blocked_dates_conflict(
            room.get("blocked_dates"), payload.check_in_date, payload.check_out_date
        ):
            raise HTTPException(
                status_code=409,
                detail={"message": "Room unavailable for selected dates"},
            )

    pricing_by_room_id: dict[str, dict] = {}
    primary_offer = None
    for index, room in enumerate(ordered_rooms):
        room_id = str(room["_id"])
        offer = (
            await _get_offer(payload.offer_code, room_id, db)
            if index == 0 and payload.offer_code
            else None
        )
        if index == 0:
            primary_offer = offer
        pricing_by_room_id[room_id] = calculate_dynamic_pricing(
            base_price=room["price_per_night"],
            check_in=payload.check_in_date,
            check_out=payload.check_out_date,
            offer=offer,
            referral_credits=(
                float(user.get("referral_credits", 0)) if index == 0 else 0.0
            ),
            view_type=room.get("view_type"),
            facing_side=room.get("facing_side"),
            room_category=room.get("room_category"),
        )

    verification_payload = BookingCreate(
        room_id=payload.room_ids[0],
        check_in_date=payload.check_in_date,
        check_out_date=payload.check_out_date,
        num_guests=payload.num_guests,
        offer_code=payload.offer_code,
        booking_for=payload.booking_for,
        staying_guest_name=payload.staying_guest_name,
        staying_guest_phone=payload.staying_guest_phone,
        guest_photo_url=payload.guest_photo_url,
        identity_proof=payload.identity_proof,
        host_message=payload.host_message,
        room_preference_notes=payload.room_preference_notes,
    )
    check_in_verification, staying_guest_name, persist_identity = (
        _build_check_in_verification(verification_payload, user)
    )

    created = await commit_bookings_batch(
        rooms=ordered_rooms,
        property_rooms=property_rooms,
        check_in=payload.check_in_date,
        check_out=payload.check_out_date,
        num_guests=payload.num_guests,
        booking_for=payload.booking_for,
        user=user,
        offer=primary_offer,
        pricing_by_room_id=pricing_by_room_id,
        check_in_verification=check_in_verification,
        staying_guest_name=staying_guest_name,
        persist_identity=persist_identity,
        host_message=payload.host_message,
        offer_code=payload.offer_code,
        room_preference_notes=payload.room_preference_notes,
    )

    serialized = [serialize_doc(booking) for booking in created]
    for booking_ser, room in zip(serialized, ordered_rooms, strict=True):
        await send_template_email(
            to=user["email"],
            subject="StayEase booking confirmation",
            template_name="booking_confirmation.html",
            context={"booking": booking_ser, "room": serialize_doc(room)},
        )
        send_whatsapp(user["phone"], booking_confirmation_message(booking_ser, room))

    paid_bookings: list[dict] = []
    for booking_ser in serialized:
        try:
            paid = await finalize_booking_payment(booking_ser["_id"], user, db)
            paid_bookings.append(paid)
        except Exception as exc:
            logger.warning(
                "Auto-pay failed for booking %s: %s",
                booking_ser.get("_id"),
                exc,
            )
            paid_bookings.append(booking_ser)

    return {
        "booking_group_id": serialized[0].get("booking_group_id"),
        "bookings": paid_bookings,
        "total_price": sum(item.get("total_price", 0) for item in paid_bookings),
        "all_paid": all(item.get("payment_status") == "paid" for item in paid_bookings),
    }


@router.get("")
async def list_bookings(
    status_filter: str | None = None,
    guest_id: str | None = None,
    host_id: str | None = None,
    scope: str | None = None,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    q: dict = {}
    role = normalize_role(user.get("role"))
    if status_filter:
        q["status"] = status_filter
    if guest_id:
        q["guest_id"] = guest_id
    elif scope == "traveling" or (scope is None and role == "tourist"):
        q["guest_id"] = str(user["_id"])
    if host_id:
        q["host_id"] = host_id
    elif scope == "hosting" or (
        scope is None and role == "host" and "guest_id" not in q
    ):
        q["host_id"] = str(user["_id"])

    items = await db["bookings"].find(q).sort("created_at", -1).to_list(200)
    if not items:
        return []

    booking_ids = [str(item["_id"]) for item in items]
    room_ids = list({item["room_id"] for item in items if item.get("room_id")})
    valid_room_ids = [ObjectId(rid) for rid in room_ids if ObjectId.is_valid(rid)]

    reviews = (
        await db["reviews"]
        .find({"booking_id": {"$in": booking_ids}})
        .to_list(len(booking_ids))
    )
    rooms = (
        await db["rooms"]
        .find({"_id": {"$in": valid_room_ids}})
        .to_list(len(valid_room_ids))
        if valid_room_ids
        else []
    )
    reviewed_ids = {review["booking_id"] for review in reviews}
    room_titles = {str(room["_id"]): room.get("title", "") for room in rooms}

    enriched = []
    for item in items:
        ser = serialize_doc(item)
        bid = str(item["_id"])
        ser["has_review"] = bid in reviewed_ids
        ser["can_review"] = is_booking_reviewable(item) and bid not in reviewed_ids
        ser["room_title"] = room_titles.get(item.get("room_id", ""), "")
        enriched.append(ser)
    return enriched


@router.get("/room/{id}")
async def get_bookings_by_room(
    id: str,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    room = (
        await db["rooms"].find_one({"_id": ObjectId(id)})
        if ObjectId.is_valid(id)
        else None
    )
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if is_tourist_role(user.get("role")):
        raise HTTPException(status_code=403, detail="Forbidden")
    if is_host_role(user.get("role")) and room.get("host_id") != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Forbidden")

    items = (
        await db["bookings"].find({"room_id": id}).sort("created_at", -1).to_list(200)
    )
    return [serialize_doc(i) for i in items]


@router.get("/{id}/cancellation-preview")
async def cancellation_preview(
    id: str,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    booking = await _get_booking_or_404(id, user, db)
    if booking["status"] == "cancelled":
        raise HTTPException(status_code=409, detail="Booking already cancelled")
    breakdown = calculate_cancellation(
        total_price=booking["total_price"],
        check_in_date=date.fromisoformat(booking["check_in_date"]),
        cancellation_policy=booking.get("cancellation_policy", "moderate"),
        payment_status=booking.get("payment_status", "pending"),
    )
    return breakdown


async def _get_booking_or_404(id: str, user: dict, db: AsyncIOMotorDatabase) -> dict:
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=404, detail="Booking not found")
    booking = await db["bookings"].find_one({"_id": ObjectId(id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    role = normalize_role(user.get("role"))
    if role == "tourist" and booking["guest_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Forbidden")
    if (
        role == "host"
        and booking["host_id"] != str(user["_id"])
        and booking["guest_id"] != str(user["_id"])
    ):
        raise HTTPException(status_code=403, detail="Forbidden")
    return booking


@router.get("/{id}")
async def get_booking(
    id: str,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    booking = await _get_booking_or_404(id, user, db)
    serialized = serialize_doc(booking)
    review = await db["reviews"].find_one({"booking_id": id})
    serialized["has_review"] = review is not None
    serialized["can_review"] = is_booking_reviewable(booking) and review is None
    room = (
        await db["rooms"].find_one({"_id": ObjectId(booking["room_id"])})
        if ObjectId.is_valid(booking.get("room_id", ""))
        else None
    )
    serialized["room_title"] = room.get("title", "") if room else ""
    return serialized


@router.delete("/{id}")
async def cancel_booking(
    id: str,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    booking = await _get_booking_or_404(id, user, db)
    if booking["guest_id"] != str(user["_id"]) and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    breakdown = calculate_cancellation(
        total_price=booking["total_price"],
        check_in_date=date.fromisoformat(booking["check_in_date"]),
        cancellation_policy=booking.get("cancellation_policy", "moderate"),
        payment_status=booking.get("payment_status", "pending"),
    )

    refund_status = "refunded" if breakdown["refund_amount"] > 0 else "no_refund"
    if booking.get("payment_status") == "pending":
        refund_status = "not_charged"
        new_payment_status = "pending"
    elif booking.get("payment_status") == "paid":
        if breakdown["refund_amount"] >= breakdown["total_price"]:
            new_payment_status = "refunded"
        elif breakdown["refund_amount"] > 0:
            new_payment_status = "partial_refund"
        else:
            new_payment_status = "no_refund"
    else:
        new_payment_status = booking.get("payment_status")

    updated, _ = await commit_cancellation(
        booking_id=id,
        breakdown=breakdown,
        new_payment_status=new_payment_status,
        refund_status=refund_status,
        room_id=booking["room_id"],
        check_in=date.fromisoformat(booking["check_in_date"]),
        check_out=date.fromisoformat(booking["check_out_date"]),
    )

    await send_template_email(
        to=booking["guest_email"],
        subject="StayEase booking cancelled",
        template_name="cancellation.html",
        context={"booking": serialize_doc(updated), "cancellation": breakdown},
    )
    return {
        "message": "Booking cancelled",
        "cancellation": breakdown,
        "booking": serialize_doc(updated),
    }


async def finalize_booking_payment(
    booking_id: str,
    user: dict,
    db: AsyncIOMotorDatabase,
) -> dict:
    if not ObjectId.is_valid(booking_id):
        raise HTTPException(status_code=404, detail="Booking not found")
    booking = await db["bookings"].find_one({"_id": ObjectId(booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["guest_id"] != str(user["_id"]) and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    if booking["payment_status"] == "paid":
        return serialize_doc(booking)

    room = await db["rooms"].find_one({"_id": ObjectId(booking["room_id"])})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    host = await db["users"].find_one({"_id": ObjectId(room["host_id"])})
    if not host:
        host = {"name": "Host", "email": settings.MAIL_FROM}
    guest = user

    invoice_number = (
        f"INV-{booking['check_in_date'].replace('-', '')}-{str(booking['_id'])[-6:]}"
    )
    pricing = {
        "price_breakdown": booking["price_breakdown"],
        "gst_breakdown": {
            "cgst_rate": booking["gst_rate"] / 2,
            "cgst_amount": booking["gst_amount"] / 2,
            "sgst_rate": booking["gst_rate"] / 2,
            "sgst_amount": booking["gst_amount"] / 2,
        },
        "guest_platform_fee": booking.get("guest_platform_fee", 0),
        "total_price": booking["total_price"],
    }
    pdf_bytes = generate_invoice_pdf(
        invoice_number=invoice_number,
        booking=booking,
        room=room,
        guest=guest,
        host=host,
        pricing=pricing,
    )
    invoice_url = await upload_pdf_optional(pdf_bytes, public_id=invoice_number) or ""

    invoice_doc = {
        "booking_id": booking_id,
        "invoice_number": invoice_number,
        "guest_details": {"name": guest["name"], "email": guest["email"]},
        "host_details": {"name": host["name"], "email": host["email"]},
        "room_details": {"title": room["title"], "room_number": room["room_number"]},
        "line_items": booking["price_breakdown"],
        "subtotal": booking["subtotal"],
        "guest_platform_fee": booking.get("guest_platform_fee", 0),
        "host_platform_fee": booking.get("host_platform_fee", 0),
        "host_payout": booking.get("host_payout", booking["subtotal"]),
        "gst_breakdown": pricing["gst_breakdown"],
        "total": booking["total_price"],
        "pdf_url": invoice_url,
        "created_at": utc_now(),
    }

    updated, is_new_payment = await commit_payment(
        booking_id=booking_id,
        invoice_doc=invoice_doc,
        invoice_url=invoice_url,
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    if is_new_payment:
        await send_template_email(
            to=guest["email"],
            subject="StayEase invoice",
            template_name="invoice.html",
            context={"invoice": invoice_doc, "booking": serialize_doc(updated)},
        )

    return serialize_doc(updated)


@router.post("/{id}/pay")
async def pay_booking(
    id: str,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await finalize_booking_payment(id, user, db)


@router.get("/{id}/receipt")
async def get_receipt(
    id: str,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await get_booking(id, user, db)


@router.get("/{id}/invoice")
async def get_booking_invoice(
    id: str,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    invoice = await db["invoices"].find_one({"booking_id": id})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return serialize_doc(invoice)


async def _pdf_context(id: str, user: dict, db: AsyncIOMotorDatabase):
    booking = await _get_booking_or_404(id, user, db)
    if booking.get("payment_status") != "paid":
        raise HTTPException(status_code=400, detail="Invoice available after payment")
    room = await db["rooms"].find_one({"_id": ObjectId(booking["room_id"])})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    host = await db["users"].find_one({"_id": ObjectId(room["host_id"])})
    if not host:
        raise HTTPException(status_code=404, detail="Host not found")
    invoice = await db["invoices"].find_one({"booking_id": id})
    invoice_number = (
        invoice.get("invoice_number")
        if invoice
        else f"INV-{booking['check_in_date'].replace('-', '')}-{str(booking['_id'])[-6:]}"
    )
    pricing = {
        "price_breakdown": booking.get("price_breakdown", []),
        "gst_breakdown": {
            "cgst_rate": booking.get("gst_rate", 0) / 2,
            "cgst_amount": booking.get("gst_amount", 0) / 2,
            "sgst_rate": booking.get("gst_rate", 0) / 2,
            "sgst_amount": booking.get("gst_amount", 0) / 2,
        },
        "guest_platform_fee": booking.get("guest_platform_fee", 0),
        "total_price": booking.get("total_price", 0),
    }
    return booking, room, host, user, invoice_number, pricing


@router.get("/{id}/voucher/pdf")
async def download_voucher_pdf(
    id: str,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    booking, room, host, guest, invoice_number, pricing = await _pdf_context(
        id, user, db
    )
    pdf_bytes = generate_invoice_pdf(
        invoice_number=invoice_number,
        booking=booking,
        room=room,
        guest=guest,
        host=host,
        pricing=pricing,
    )
    filename = f"StayEase-Voucher-{invoice_number}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{id}/tax-invoice/pdf")
async def download_tax_invoice_pdf(
    id: str,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    booking, room, host, guest, invoice_number, pricing = await _pdf_context(
        id, user, db
    )
    pdf_bytes = generate_tax_invoice_pdf(
        invoice_number=invoice_number,
        booking=booking,
        room=room,
        guest=guest,
        host=host,
        pricing=pricing,
    )
    filename = f"StayEase-Tax-Invoice-{invoice_number}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
