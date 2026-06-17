from __future__ import annotations

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from database import database
from models.common import serialize_doc, utc_now
from models.review import ReviewCreate
from services.auth import get_current_user, require_role
from services.review_eligibility import is_booking_reviewable
from services.review_stats import sync_room_review_stats
from services.roles import can_book_stays

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


async def _eligible_booking_for_room(*, guest_id: str, room_id: str) -> dict:
    bookings = (
        await database.collection("bookings")
        .find({"guest_id": guest_id, "room_id": room_id, "status": {"$ne": "cancelled"}})
        .sort("check_out_date", -1)
        .to_list(50)
    )
    if not bookings:
        return {"can_review": False, "has_review": False, "booking": None}

    booking_ids = [str(booking["_id"]) for booking in bookings]
    existing_reviews = (
        await database.collection("reviews")
        .find({"booking_id": {"$in": booking_ids}})
        .to_list(len(booking_ids))
    )
    reviewed_ids = {review["booking_id"] for review in existing_reviews}

    room = await database.collection("rooms").find_one({"_id": ObjectId(room_id)}) if ObjectId.is_valid(room_id) else None
    room_title = room.get("title", "") if room else ""

    for booking in bookings:
        booking_id = str(booking["_id"])
        if booking_id in reviewed_ids:
            continue
        if is_booking_reviewable(booking):
            serialized = serialize_doc(booking)
            serialized["room_title"] = room_title
            return {"can_review": True, "has_review": False, "booking": serialized}

    latest = bookings[0]
    latest_id = str(latest["_id"])
    if latest_id in reviewed_ids:
        serialized = serialize_doc(latest)
        serialized["room_title"] = room_title
        return {"can_review": False, "has_review": True, "booking": serialized}

    return {"can_review": False, "has_review": False, "booking": None}


@router.post("", status_code=201)
async def create_review(payload: ReviewCreate, user: dict = Depends(require_role("tourist", "host", "admin"))):
    if not ObjectId.is_valid(payload.booking_id):
        raise HTTPException(status_code=404, detail="Booking not found")
    booking = await database.collection("bookings").find_one({"_id": ObjectId(payload.booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["guest_id"] != str(user["_id"]) and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    if not is_booking_reviewable(booking):
        raise HTTPException(status_code=422, detail="Can only review stays after checkout")

    existing = await database.collection("reviews").find_one({"booking_id": payload.booking_id})
    if existing:
        raise HTTPException(status_code=409, detail="Review already submitted")

    doc = {
        "booking_id": payload.booking_id,
        "room_id": booking["room_id"],
        "guest_id": str(user["_id"]),
        "guest_name": user["name"],
        "rating": payload.rating,
        "title": payload.title,
        "body": payload.body,
        "would_recommend": payload.would_recommend,
        "photos": payload.photos,
        "host_response": None,
        "created_at": utc_now(),
    }
    res = await database.collection("reviews").insert_one(doc)

    await sync_room_review_stats(booking["room_id"])
    created = await database.collection("reviews").find_one({"_id": res.inserted_id})
    return serialize_doc(created)


@router.get("/eligible/room/{room_id}")
async def get_eligible_review_for_room(room_id: str, user: dict = Depends(get_current_user)):
    if not can_book_stays(user.get("role")):
        raise HTTPException(status_code=403, detail="Forbidden")
    if not ObjectId.is_valid(room_id):
        raise HTTPException(status_code=404, detail="Room not found")
    room = await database.collection("rooms").find_one({"_id": ObjectId(room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return await _eligible_booking_for_room(guest_id=str(user["_id"]), room_id=room_id)


@router.get("/room/{id}")
async def get_room_reviews(id: str):
    items = (
        await database.collection("reviews").find({"room_id": id}).sort("created_at", -1).to_list(200)
    )
    return [serialize_doc(i) for i in items]


@router.get("/booking/{booking_id}")
async def get_booking_review(booking_id: str, user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(booking_id):
        raise HTTPException(status_code=404, detail="Review not found")
    booking = await database.collection("bookings").find_one({"_id": ObjectId(booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["guest_id"] != str(user["_id"]) and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    review = await database.collection("reviews").find_one({"booking_id": booking_id})
    return {
        "can_review": is_booking_reviewable(booking) and review is None,
        "has_review": review is not None,
        "review": serialize_doc(review) if review else None,
    }


class HostResponse(BaseModel):
    response: str


@router.patch("/{id}/host-response")
async def host_respond(id: str, payload: HostResponse, user: dict = Depends(require_role("host", "admin"))):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=404, detail="Review not found")
    review = await database.collection("reviews").find_one({"_id": ObjectId(id)})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    room = await database.collection("rooms").find_one({"_id": ObjectId(review["room_id"])})
    if user["role"] != "admin" and room["host_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Forbidden")
    await database.collection("reviews").update_one(
        {"_id": ObjectId(id)}, {"$set": {"host_response": payload.response}}
    )
    updated = await database.collection("reviews").find_one({"_id": ObjectId(id)})
    return serialize_doc(updated)
