from __future__ import annotations

from datetime import date

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from pymongo.errors import DuplicateKeyError

from database import database, get_database
from models.common import serialize_doc, utc_now
from models.review import ReviewCreate
from services.auth import get_current_user, require_role
from services.review_eligibility import is_booking_reviewable
from services.review_property import get_property_room_ids, property_name_from_room
from services.review_stats import sync_room_review_stats
from services.roles import can_book_stays

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


async def _room_map(db: AsyncIOMotorDatabase, room_ids: list[str]) -> dict[str, dict]:
    valid = [ObjectId(rid) for rid in room_ids if ObjectId.is_valid(rid)]
    if not valid:
        return {}
    rooms = await db["rooms"].find({"_id": {"$in": valid}}).to_list(len(valid))
    return {str(room["_id"]): room for room in rooms}


def _enrich_review(review: dict, rooms_by_id: dict[str, dict]) -> dict:
    doc = serialize_doc(review)
    room = rooms_by_id.get(doc.get("room_id", ""), {})
    doc["room_number"] = room.get("room_number")
    doc["room_title"] = room.get("title")
    return doc


async def _eligible_booking_for_property(*, guest_id: str, room: dict, db: AsyncIOMotorDatabase) -> dict:
    property_name = property_name_from_room(room)
    room_ids = await get_property_room_ids(room, database=db)
    rooms_by_id = await _room_map(db, room_ids)

    bookings = (
        await db["bookings"]
        .find({"guest_id": guest_id, "room_id": {"$in": room_ids}, "status": {"$ne": "cancelled"}})
        .sort("check_out_date", -1)
        .to_list(50)
    )
    if not bookings:
        return {
            "can_review": False,
            "has_review": False,
            "booking": None,
            "property_name": property_name,
            "review_after": None,
        }

    booking_ids = [str(booking["_id"]) for booking in bookings]
    existing_reviews = (
        await db["reviews"]
        .find({"booking_id": {"$in": booking_ids}})
        .to_list(len(booking_ids))
    )
    reviewed_ids = {review["booking_id"] for review in existing_reviews}

    for booking in bookings:
        booking_id = str(booking["_id"])
        if booking_id in reviewed_ids:
            continue
        if is_booking_reviewable(booking):
            serialized = serialize_doc(booking)
            stayed_room = rooms_by_id.get(booking["room_id"], {})
            serialized["room_title"] = stayed_room.get("title", "")
            serialized["room_number"] = stayed_room.get("room_number")
            return {
                "can_review": True,
                "has_review": False,
                "booking": serialized,
                "property_name": property_name,
                "review_after": None,
            }

    for booking in bookings:
        booking_id = str(booking["_id"])
        if booking_id in reviewed_ids:
            continue
        if booking.get("payment_status") != "paid":
            continue
        try:
            check_out = date.fromisoformat(str(booking["check_out_date"]))
        except (TypeError, ValueError):
            continue
        if date.today() < check_out:
            return {
                "can_review": False,
                "has_review": False,
                "booking": None,
                "property_name": property_name,
                "review_after": booking["check_out_date"],
            }

    if reviewed_ids:
        latest_reviewed = next((b for b in bookings if str(b["_id"]) in reviewed_ids), bookings[0])
        serialized = serialize_doc(latest_reviewed)
        stayed_room = rooms_by_id.get(latest_reviewed["room_id"], {})
        serialized["room_title"] = stayed_room.get("title", "")
        serialized["room_number"] = stayed_room.get("room_number")
        return {
            "can_review": False,
            "has_review": True,
            "booking": serialized,
            "property_name": property_name,
            "review_after": None,
        }

    return {
        "can_review": False,
        "has_review": False,
        "booking": None,
        "property_name": property_name,
        "review_after": None,
    }


@router.post("", status_code=201)
async def create_review(
    payload: ReviewCreate,
    user: dict = Depends(require_role("tourist", "host", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    if not ObjectId.is_valid(payload.booking_id):
        raise HTTPException(status_code=404, detail="Booking not found")
    booking = await db["bookings"].find_one({"_id": ObjectId(payload.booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["guest_id"] != str(user["_id"]) and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    if not is_booking_reviewable(booking):
        raise HTTPException(status_code=422, detail="Can only review stays after checkout")

    existing = await db["reviews"].find_one({"booking_id": payload.booking_id})
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

    async def _review_txn(session):
        try:
            res = await db["reviews"].insert_one(doc, session=session)
        except DuplicateKeyError as exc:
            raise HTTPException(status_code=409, detail="Review already submitted") from exc
        await sync_room_review_stats(booking["room_id"], session=session)
        return res.inserted_id

    try:
        inserted_id = await database.run_transaction(_review_txn)
    except HTTPException:
        raise

    created = await db["reviews"].find_one({"_id": inserted_id})
    return serialize_doc(created)


@router.get("/eligible/room/{room_id}")
async def get_eligible_review_for_room(
    room_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    if not can_book_stays(user.get("role")):
        raise HTTPException(status_code=403, detail="Forbidden")
    if not ObjectId.is_valid(room_id):
        raise HTTPException(status_code=404, detail="Room not found")
    room = await db["rooms"].find_one({"_id": ObjectId(room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return await _eligible_booking_for_property(guest_id=str(user["_id"]), room=room, db=db)


@router.get("/property/{room_id}")
async def get_property_reviews(
    room_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    if not ObjectId.is_valid(room_id):
        raise HTTPException(status_code=404, detail="Room not found")
    room = await db["rooms"].find_one({"_id": ObjectId(room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    property_name = property_name_from_room(room)
    room_ids = await get_property_room_ids(room, database=db)
    items = (
        await db["reviews"]
        .find({"room_id": {"$in": room_ids}})
        .sort("created_at", -1)
        .to_list(300)
    )
    rooms_by_id = await _room_map(db, room_ids)
    reviews = [_enrich_review(item, rooms_by_id) for item in items]
    avg_rating = round(sum(r["rating"] for r in reviews) / len(reviews), 2) if reviews else 0.0

    return {
        "property_name": property_name,
        "avg_rating": avg_rating,
        "total_reviews": len(reviews),
        "reviews": reviews,
    }


@router.get("/room/{id}")
async def get_room_reviews(
    id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    items = (
        await db["reviews"].find({"room_id": id}).sort("created_at", -1).to_list(200)
    )
    rooms_by_id = await _room_map(db, [id])
    return [_enrich_review(item, rooms_by_id) for item in items]


@router.get("/booking/{booking_id}")
async def get_booking_review(
    booking_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    if not ObjectId.is_valid(booking_id):
        raise HTTPException(status_code=404, detail="Review not found")
    booking = await db["bookings"].find_one({"_id": ObjectId(booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["guest_id"] != str(user["_id"]) and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    review = await db["reviews"].find_one({"booking_id": booking_id})
    return {
        "can_review": is_booking_reviewable(booking) and review is None,
        "has_review": review is not None,
        "review": serialize_doc(review) if review else None,
    }


class HostResponse(BaseModel):
    response: str


@router.patch("/{id}/host-response")
async def host_respond(
    id: str,
    payload: HostResponse,
    user: dict = Depends(require_role("host", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=404, detail="Review not found")
    review = await db["reviews"].find_one({"_id": ObjectId(id)})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    room = await db["rooms"].find_one({"_id": ObjectId(review["room_id"])})
    if user["role"] != "admin" and room["host_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Forbidden")
    await db["reviews"].update_one(
        {"_id": ObjectId(id)}, {"$set": {"host_response": payload.response}}
    )
    updated = await db["reviews"].find_one({"_id": ObjectId(id)})
    return serialize_doc(updated)
