from __future__ import annotations

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pymongo.errors import DuplicateKeyError

from database import database
from models.common import serialize_doc, utc_now
from models.waitlist import WaitlistCreate
from services.auth import get_current_user, require_role
from services.email import send_template_email
from services.whatsapp import send_whatsapp

router = APIRouter(prefix="/api/waitlist", tags=["waitlist"])


@router.post("", status_code=201)
async def join_waitlist(payload: WaitlistCreate, user: dict = Depends(require_role("tourist", "host", "admin"))):
    doc = {
        "room_id": payload.room_id,
        "guest_id": str(user["_id"]),
        "guest_name": payload.guest_name,
        "guest_phone": payload.guest_phone,
        "check_in_date": payload.check_in_date.isoformat(),
        "check_out_date": payload.check_out_date.isoformat(),
        "status": "waiting",
        "created_at": utc_now(),
    }
    try:
        res = await database.collection("waitlist").insert_one(doc)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="You are already on the waitlist for these dates") from exc
    created = await database.collection("waitlist").find_one({"_id": res.inserted_id})
    return serialize_doc(created)


@router.get("/{phone}")
async def get_waitlist_by_phone(phone: str):
    items = await database.collection("waitlist").find({"guest_phone": phone}).to_list(100)
    return [serialize_doc(i) for i in items]


@router.delete("/{id}", status_code=204)
async def leave_waitlist(id: str, user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=404, detail="Waitlist entry not found")
    entry = await database.collection("waitlist").find_one({"_id": ObjectId(id)})
    if not entry:
        raise HTTPException(status_code=404, detail="Waitlist entry not found")
    if entry["guest_id"] != str(user["_id"]) and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    await database.collection("waitlist").delete_one({"_id": ObjectId(id)})
    return None
