from __future__ import annotations

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from database import database
from models.common import serialize_doc
from services.auth import get_current_user
from services.roles import is_host_role, is_tourist_role, normalize_role

router = APIRouter(prefix="/api/invoices", tags=["invoices"])


@router.get("/{booking_id}")
async def get_invoice(booking_id: str, user: dict = Depends(get_current_user)):
    invoice = await database.collection("invoices").find_one({"booking_id": booking_id})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    booking = (
        await database.collection("bookings").find_one({"_id": ObjectId(booking_id)})
        if ObjectId.is_valid(booking_id)
        else None
    )
    if booking:
        role = normalize_role(user.get("role"))
        if role == "tourist" and booking.get("guest_id") != str(user["_id"]):
            raise HTTPException(status_code=403, detail="Forbidden")
        if (
            role == "host"
            and booking.get("host_id") != str(user["_id"])
            and booking.get("guest_id") != str(user["_id"])
        ):
            raise HTTPException(status_code=403, detail="Forbidden")

    return serialize_doc(invoice)
