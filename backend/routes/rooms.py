from __future__ import annotations

from datetime import date
from typing import Literal, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from database import get_database
from models.auth import RoomRecommendRequest
from models.room import RoomCreate, RoomInDB, RoomUpdate
from models.common import serialize_doc, utc_now
from services.auth import get_current_user, get_optional_user, require_role
from services.cloudinary import delete_asset, upload_image, upload_video
from services.geo import filter_by_distance
from services.recommender import rank_rooms
from services.roles import normalize_role
from services.room_serialize import serialize_room
from services.waitlist import find_conflicting_booking
from services.availability import (
    blocked_dates_conflict,
    find_next_available_any_room,
    find_next_available_for_room_sets,
)
from services.transactions import (
    commit_add_photo,
    commit_add_video,
    commit_delete_photo,
    commit_delete_video,
    commit_listing_report,
    commit_reorder_photos,
    commit_room_delete,
    commit_room_inquiry,
    commit_set_primary_photo,
)

router = APIRouter(prefix="/api/rooms", tags=["rooms"])

MAX_PHOTOS = 10
MAX_VIDEOS = 2


def _split_csv(v: Optional[str]) -> Optional[list[str]]:
    if not v:
        return None
    parts = [p.strip() for p in v.split(",") if p.strip()]
    return parts or None


def _validate_unavailable_updates(room: dict, updates: dict) -> None:
    if updates.get("is_available") is False:
        reason = updates.get("unavailable_reason")
        if not reason:
            raise HTTPException(
                status_code=422,
                detail={"unavailable_reason": "Choose why this room is unavailable"},
            )
        if reason == "other":
            note = (updates.get("unavailable_reason_note") or "").strip()
            if len(note) < 3:
                raise HTTPException(
                    status_code=422,
                    detail={
                        "unavailable_reason_note": "Please describe why the room is unavailable"
                    },
                )


def _viewer_is_room_owner(user: dict | None, room: dict) -> bool:
    if not user:
        return False
    if normalize_role(user.get("role")) == "admin":
        return True
    return str(user["_id"]) == room.get("host_id")


async def _get_room_or_404(
    id: str,
    db: AsyncIOMotorDatabase,
    user: dict | None = None,
    require_owner: bool = False,
) -> dict:
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=404, detail="Room not found")
    room = await db["rooms"].find_one({"_id": ObjectId(id)})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if require_owner and user:
        if user["role"] != "admin" and room.get("host_id") != str(user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden"
            )
    return room


@router.post("", status_code=201)
async def create_room(
    payload: RoomCreate,
    user: dict = Depends(require_role("host", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    rooms = db["rooms"]
    doc = RoomInDB(host_id=str(user["_id"]), **payload.model_dump()).model_dump(
        by_alias=True,
        exclude_none=True,
    )
    doc.pop("_id", None)
    res = await rooms.insert_one(doc)
    created = await rooms.find_one({"_id": res.inserted_id})
    return serialize_doc(created)


@router.post("/recommend")
async def recommend_rooms(
    payload: RoomRecommendRequest,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    q: dict = {"is_available": True}
    if payload.city:
        q["location.city"] = {"$regex": f"^{payload.city}$", "$options": "i"}
    rooms = await db["rooms"].find(q).to_list(200)
    preferences = payload.model_dump(exclude_none=True)
    ranked = rank_rooms(rooms, preferences)
    return [serialize_doc(r) for r in ranked[:20]]


@router.get("/host/{host_id}")
async def get_rooms_by_host(
    host_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    items = (
        await db["rooms"].find({"host_id": host_id}).sort("created_at", -1).to_list(200)
    )
    return [serialize_doc(i) for i in items if i.get("_id") is not None]


@router.get("")
async def list_rooms(
    type: Optional[str] = None,
    food: Optional[str] = None,
    smoking: Optional[str] = None,
    alcohol: Optional[str] = None,
    view: Optional[str] = None,
    balcony: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    guests: Optional[int] = None,
    city: Optional[str] = None,
    search: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: Optional[float] = None,
    sort: Optional[str] = None,
    available: Optional[bool] = None,
    check_in: Optional[date] = None,
    check_out: Optional[date] = None,
    host_id: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    rooms = db["rooms"]

    q: dict = {}

    type_vals = _split_csv(type)
    if type_vals:
        q["room_category"] = {"$in": type_vals}

    food_vals = _split_csv(food)
    if food_vals:
        q["food_preference"] = {"$in": food_vals}

    view_vals = _split_csv(view)
    if view_vals and "Any" not in view_vals:
        q["view_type"] = {"$in": view_vals}

    if smoking:
        q["smoking_policy"] = smoking
    if alcohol:
        q["alcohol_policy"] = alcohol
    if balcony is True:
        q["has_balcony"] = True

    if min_price is not None or max_price is not None:
        price_q: dict = {}
        if min_price is not None:
            price_q["$gte"] = min_price
        if max_price is not None:
            price_q["$lte"] = max_price
        q["price_per_night"] = price_q

    if guests is not None:
        q["max_guests"] = {"$gte": guests}

    if city:
        q["location.city"] = {"$regex": f"^{city}$", "$options": "i"}

    if host_id:
        q["host_id"] = host_id

    if available is True:
        q["is_available"] = True

    if search:
        q["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"location.area": {"$regex": search, "$options": "i"}},
            {"location.city": {"$regex": search, "$options": "i"}},
        ]

    if check_in and check_out and check_out <= check_in:
        raise HTTPException(
            status_code=422, detail={"check_out": "Check-out must be after check-in"}
        )

    cursor = rooms.find(q)

    sort_map = {
        "price_asc": ("price_per_night", 1),
        "price_desc": ("price_per_night", -1),
        "top_rated": ("avg_rating", -1),
        "newest": ("created_at", -1),
    }
    if sort in sort_map:
        key, direction = sort_map[sort]
        cursor = cursor.sort(key, direction)

    items = await cursor.to_list(length=200)

    if lat is not None and lng is not None:
        items = filter_by_distance(items, lat, lng, radius_km or 50.0)

    if check_in and check_out:
        filtered = []
        for room in items:
            conflict = await find_conflicting_booking(
                str(room["_id"]), check_in, check_out
            )
            blocked = blocked_dates_conflict(
                room.get("blocked_dates"), check_in, check_out
            )
            if not conflict and not blocked:
                filtered.append(room)
        items = filtered

    return [serialize_room(r, for_guest=not host_id) for r in items]


@router.get("/{id}")
async def get_room(
    id: str,
    user: dict | None = Depends(get_optional_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    room = await _get_room_or_404(id, db)
    for_guest = not _viewer_is_room_owner(user, room)
    room_doc = serialize_room(room, for_guest=for_guest)
    host_id = room.get("host_id")
    if host_id and ObjectId.is_valid(host_id):
        host = await db["users"].find_one({"_id": ObjectId(host_id)})
        if host:
            room_doc["host"] = {
                "id": str(host["_id"]),
                "name": host["name"],
                "about_me": host.get("about_me"),
                "avatar_url": host.get("avatar_url"),
                "created_at": (
                    host.get("created_at").isoformat()
                    if host.get("created_at")
                    else None
                ),
            }
    return room_doc


@router.get("/{id}/booked-dates")
async def get_booked_dates(
    id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    await _get_room_or_404(id, db)
    items = (
        await db["bookings"]
        .find(
            {
                "room_id": id,
                "status": {"$in": ["confirmed", "completed"]},
            }
        )
        .to_list(500)
    )
    return [
        {
            "check_in_date": item.get("check_in_date"),
            "check_out_date": item.get("check_out_date"),
        }
        for item in items
        if item.get("check_in_date") and item.get("check_out_date")
    ]


async def _room_availability_set(room_id: str, db: AsyncIOMotorDatabase) -> dict | None:
    if not ObjectId.is_valid(room_id):
        return None
    room = await db["rooms"].find_one({"_id": ObjectId(room_id)})
    if not room:
        return None
    items = (
        await db["bookings"]
        .find(
            {
                "room_id": room_id,
                "status": {"$in": ["confirmed", "completed"]},
            }
        )
        .to_list(500)
    )
    booking_ranges = [
        (item["check_in_date"], item["check_out_date"])
        for item in items
        if item.get("check_in_date") and item.get("check_out_date")
    ]
    return {
        "_id": room_id,
        "room_number": room.get("room_number"),
        "blocked_dates": room.get("blocked_dates"),
        "booking_ranges": booking_ranges,
    }


@router.get("/{id}/next-available")
async def get_next_available(
    id: str,
    check_in: date,
    check_out: date,
    room_ids: Optional[str] = None,
    any_room: bool = False,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    if check_out <= check_in:
        raise HTTPException(
            status_code=422, detail={"check_out": "Check-out must be after check-in"}
        )

    nights = (check_out - check_in).days
    search_from = max(check_in, date.today())
    base_room = await _get_room_or_404(id, db)

    if any_room:
        host_id = base_room.get("host_id")
        city = base_room.get("location", {}).get("city")
        if not host_id or not city:
            return {"check_in": None, "check_out": None, "nights": nights}

        siblings = await db["rooms"].find(
            {
                "host_id": host_id,
                "location.city": city,
                "is_available": True,
            }
        ).sort("room_number", 1).to_list(50)

        room_sets = []
        for sibling in siblings:
            data = await _room_availability_set(str(sibling["_id"]), db)
            if data:
                room_sets.append(data)

        result = find_next_available_any_room(
            room_sets,
            nights=nights,
            search_from=search_from,
        )
        if not result:
            return {"check_in": None, "check_out": None, "nights": nights}

        next_check_in, next_check_out, room = result
        return {
            "check_in": next_check_in.isoformat(),
            "check_out": next_check_out.isoformat(),
            "nights": nights,
            "room_id": room["_id"],
            "room_number": room.get("room_number"),
        }

    target_ids = [part.strip() for part in (room_ids or id).split(",") if part.strip()]
    room_sets = []
    for target_id in target_ids:
        data = await _room_availability_set(target_id, db)
        if not data:
            raise HTTPException(status_code=404, detail="Room not found")
        room_sets.append(data)

    window = find_next_available_for_room_sets(
        room_sets,
        nights=nights,
        search_from=search_from,
    )
    if not window:
        return {"check_in": None, "check_out": None, "nights": nights}

    next_check_in, next_check_out = window
    return {
        "check_in": next_check_in.isoformat(),
        "check_out": next_check_out.isoformat(),
        "nights": nights,
    }


@router.get("/{id}/alternatives")
async def get_room_alternatives(
    id: str,
    check_in: Optional[date] = None,
    check_out: Optional[date] = None,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    room = await _get_room_or_404(id, db)
    host_id = room.get("host_id")
    city = room.get("location", {}).get("city")
    if not host_id or not city:
        return []

    if check_in and check_out and check_out <= check_in:
        raise HTTPException(
            status_code=422, detail={"check_out": "Check-out must be after check-in"}
        )

    q: dict = {
        "host_id": host_id,
        "location.city": city,
    }
    siblings = await db["rooms"].find(q).sort("room_number", 1).to_list(50)

    result = []
    for sibling in siblings:
        published = bool(sibling.get("is_available", True))
        available = published
        if published and check_in and check_out:
            if blocked_dates_conflict(
                sibling.get("blocked_dates"), check_in, check_out
            ):
                available = False
            else:
                conflict = await find_conflicting_booking(
                    str(sibling["_id"]), check_in, check_out
                )
                if conflict:
                    available = False
        doc = serialize_room(sibling, for_guest=True)
        doc["available_for_dates"] = available
        result.append(doc)
    return result


@router.get("/{id}/rating")
async def get_room_rating(
    id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    room = await _get_room_or_404(id, db)
    reviews = await db["reviews"].find({"room_id": id}).to_list(500)
    breakdown = {str(i): 0 for i in range(1, 6)}
    for r in reviews:
        star = str(int(r.get("rating", 0)))
        if star in breakdown:
            breakdown[star] += 1
    return {
        "room_id": id,
        "avg_rating": room.get("avg_rating", 0.0),
        "total_reviews": room.get("total_reviews", 0),
        "breakdown": breakdown,
    }


class RoomInquiryCreate(BaseModel):
    message: str = Field(min_length=10, max_length=1000)
    check_in: Optional[date] = None
    check_out: Optional[date] = None


class RoomReportCreate(BaseModel):
    reason: Literal["inaccurate", "scam", "offensive", "safety", "other"]
    details: str = Field(min_length=10, max_length=2000)


@router.post("/{id}/inquiries", status_code=201)
async def send_room_inquiry(
    id: str,
    payload: RoomInquiryCreate,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    room = await _get_room_or_404(id, db)
    if payload.check_in and payload.check_out and payload.check_out <= payload.check_in:
        raise HTTPException(status_code=422, detail="Check-out must be after check-in")

    host_id = room.get("host_id")
    created = await commit_room_inquiry(
        room_id=id,
        host_id=host_id,
        guest_id=str(user["_id"]),
        guest_name=user["name"],
        guest_email=user["email"],
        message=payload.message.strip(),
        check_in=payload.check_in.isoformat() if payload.check_in else None,
        check_out=payload.check_out.isoformat() if payload.check_out else None,
    )
    return serialize_doc(created)


@router.post("/{id}/reports", status_code=201)
async def report_room(
    id: str,
    payload: RoomReportCreate,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    room = await _get_room_or_404(id, db)
    guest_id = str(user["_id"])

    doc = {
        "room_id": id,
        "host_id": room.get("host_id"),
        "reporter_id": guest_id,
        "reporter_name": user["name"],
        "reporter_email": user["email"],
        "reason": payload.reason,
        "details": payload.details.strip(),
        "status": "open",
        "created_at": utc_now(),
    }
    created = await commit_listing_report(doc)
    return serialize_doc(created)


@router.patch("/{id}")
async def update_room(
    id: str,
    payload: RoomUpdate,
    user: dict = Depends(require_role("host", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    room = await _get_room_or_404(id, db, user, require_owner=True)

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return serialize_doc(room)

    if updates.get("is_available") is True:
        updates["unavailable_reason"] = None
        updates["unavailable_reason_note"] = None
    _validate_unavailable_updates(room, updates)

    await db["rooms"].update_one({"_id": ObjectId(id)}, {"$set": updates})
    updated = await db["rooms"].find_one({"_id": ObjectId(id)})
    return serialize_doc(updated)


@router.delete("/{id}", status_code=204)
async def delete_room(
    id: str,
    user: dict = Depends(require_role("host", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    await _get_room_or_404(id, db, user, require_owner=True)
    await commit_room_delete(id)
    return None


@router.post("/{id}/photos")
async def add_photo(
    id: str,
    file: UploadFile = File(...),
    user: dict = Depends(require_role("host", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    room = await _get_room_or_404(id, db, user, require_owner=True)

    uploaded = await upload_image(file)
    photo = {
        "url": uploaded["url"],
        "public_id": uploaded["public_id"],
        "is_primary": len(room.get("photos", [])) == 0,
    }
    return await commit_add_photo(id, photo, max_photos=MAX_PHOTOS)


@router.delete("/{id}/photos/{pid:path}")
async def delete_photo(
    id: str,
    pid: str,
    user: dict = Depends(require_role("host", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    room = await _get_room_or_404(id, db, user, require_owner=True)
    photos = room.get("photos", [])
    target = next((p for p in photos if p.get("public_id") == pid), None)
    if not target:
        raise HTTPException(status_code=404, detail="Photo not found")

    delete_asset(pid)
    await commit_delete_photo(id, pid)
    return {"message": "Photo deleted"}


@router.patch("/{id}/photos/{pid:path}/primary")
async def set_primary_photo(
    id: str,
    pid: str,
    user: dict = Depends(require_role("host", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    await _get_room_or_404(id, db, user, require_owner=True)
    photos = await commit_set_primary_photo(id, pid)
    return {"message": "Primary photo updated", "photos": photos}


class PhotoReorderPayload(BaseModel):
    public_ids: list[str] = Field(default_factory=list)


@router.patch("/{id}/photos/reorder")
async def reorder_photos(
    id: str,
    payload: PhotoReorderPayload,
    user: dict = Depends(require_role("host", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    await _get_room_or_404(id, db, user, require_owner=True)
    ordered = await commit_reorder_photos(id, payload.public_ids)
    return {"message": "Photo order updated", "photos": ordered}


@router.post("/{id}/videos")
async def add_video(
    id: str,
    file: UploadFile = File(...),
    user: dict = Depends(require_role("host", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    room = await _get_room_or_404(id, db, user, require_owner=True)

    uploaded = await upload_video(file)
    video = {"url": uploaded["url"], "public_id": uploaded["public_id"]}
    return await commit_add_video(id, video, max_videos=MAX_VIDEOS)


@router.delete("/{id}/videos/{vid:path}")
async def delete_video(
    id: str,
    vid: str,
    user: dict = Depends(require_role("host", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    room = await _get_room_or_404(id, db, user, require_owner=True)
    videos = room.get("videos", [])
    if not any(v.get("public_id") == vid for v in videos):
        raise HTTPException(status_code=404, detail="Video not found")

    delete_asset(vid, resource_type="video")
    await commit_delete_video(id, vid)
    return {"message": "Video deleted"}
