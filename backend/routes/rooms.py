from __future__ import annotations

from datetime import date
from typing import Literal, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from database import database
from models.auth import RoomRecommendRequest
from models.room import RoomCreate, RoomInDB, RoomUpdate
from models.common import serialize_doc, utc_now
from services.auth import get_current_user, require_role
from services.cloudinary import delete_asset, upload_image, upload_video
from services.geo import filter_by_distance
from services.recommender import rank_rooms
from services.waitlist import find_conflicting_booking


router = APIRouter(prefix="/api/rooms", tags=["rooms"])

MAX_PHOTOS = 10
MAX_VIDEOS = 2


def _split_csv(v: Optional[str]) -> Optional[list[str]]:
    if not v:
        return None
    parts = [p.strip() for p in v.split(",") if p.strip()]
    return parts or None


async def _get_room_or_404(id: str, user: dict | None = None, require_owner: bool = False) -> dict:
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=404, detail="Room not found")
    room = await database.collection("rooms").find_one({"_id": ObjectId(id)})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if require_owner and user:
        if user["role"] != "admin" and room.get("host_id") != str(user["_id"]):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return room


@router.post("", status_code=201)
async def create_room(payload: RoomCreate, user: dict = Depends(require_role("host", "admin"))):
    rooms = database.collection("rooms")
    doc = RoomInDB(host_id=str(user["_id"]), **payload.model_dump()).model_dump(
        by_alias=True,
        exclude_none=True,
    )
    doc.pop("_id", None)
    res = await rooms.insert_one(doc)
    created = await rooms.find_one({"_id": res.inserted_id})
    return serialize_doc(created)


@router.post("/recommend")
async def recommend_rooms(payload: RoomRecommendRequest):
    q: dict = {"is_available": True}
    if payload.city:
        q["location.city"] = {"$regex": f"^{payload.city}$", "$options": "i"}
    rooms = await database.collection("rooms").find(q).to_list(200)
    preferences = payload.model_dump(exclude_none=True)
    ranked = rank_rooms(rooms, preferences)
    return [serialize_doc(r) for r in ranked[:20]]


@router.get("/host/{host_id}")
async def get_rooms_by_host(host_id: str):
    items = await database.collection("rooms").find({"host_id": host_id}).sort("created_at", -1).to_list(200)
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
):
    rooms = database.collection("rooms")

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
        raise HTTPException(status_code=422, detail={"check_out": "Check-out must be after check-in"})

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
            conflict = await find_conflicting_booking(str(room["_id"]), check_in, check_out)
            if not conflict:
                filtered.append(room)
        items = filtered

    return [serialize_doc(r) for r in items]


@router.get("/{id}")
async def get_room(id: str):
    room = await _get_room_or_404(id)
    room_doc = serialize_doc(room)
    host_id = room.get("host_id")
    if host_id and ObjectId.is_valid(host_id):
        host = await database.collection("users").find_one({"_id": ObjectId(host_id)})
        if host:
            room_doc["host"] = {
                "id": str(host["_id"]),
                "name": host["name"],
                "about_me": host.get("about_me"),
                "avatar_url": host.get("avatar_url"),
                "created_at": host.get("created_at").isoformat() if host.get("created_at") else None,
            }
    return room_doc


@router.get("/{id}/rating")
async def get_room_rating(id: str):
    room = await _get_room_or_404(id)
    reviews = await database.collection("reviews").find({"room_id": id}).to_list(500)
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
):
    room = await _get_room_or_404(id)
    if payload.check_in and payload.check_out and payload.check_out <= payload.check_in:
        raise HTTPException(status_code=422, detail="Check-out must be after check-in")

    host_id = room.get("host_id")
    doc = {
        "room_id": id,
        "host_id": host_id,
        "guest_id": str(user["_id"]),
        "guest_name": user["name"],
        "guest_email": user["email"],
        "message": payload.message.strip(),
        "check_in": payload.check_in.isoformat() if payload.check_in else None,
        "check_out": payload.check_out.isoformat() if payload.check_out else None,
        "created_at": utc_now(),
    }
    res = await database.collection("inquiries").insert_one(doc)

    if host_id:
        await database.collection("notifications").insert_one(
            {
                "user_id": host_id,
                "type": "inquiry",
                "title": f"New message from {user['name']}",
                "body": payload.message.strip()[:200],
                "channel": "in_app",
                "sent_at": utc_now(),
                "read": False,
                "meta": {"room_id": id, "inquiry_id": str(res.inserted_id)},
            }
        )

    created = await database.collection("inquiries").find_one({"_id": res.inserted_id})
    return serialize_doc(created)


@router.post("/{id}/reports", status_code=201)
async def report_room(
    id: str,
    payload: RoomReportCreate,
    user: dict = Depends(get_current_user),
):
    room = await _get_room_or_404(id)
    guest_id = str(user["_id"])
    existing = await database.collection("listing_reports").find_one(
        {"room_id": id, "reporter_id": guest_id, "status": "open"}
    )
    if existing:
        raise HTTPException(status_code=409, detail="You already reported this listing")

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
    res = await database.collection("listing_reports").insert_one(doc)
    created = await database.collection("listing_reports").find_one({"_id": res.inserted_id})
    return serialize_doc(created)


@router.patch("/{id}")
async def update_room(
    id: str,
    payload: RoomUpdate,
    user: dict = Depends(require_role("host", "admin")),
):
    room = await _get_room_or_404(id, user, require_owner=True)

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        return serialize_doc(room)

    await database.collection("rooms").update_one({"_id": ObjectId(id)}, {"$set": updates})
    updated = await database.collection("rooms").find_one({"_id": ObjectId(id)})
    return serialize_doc(updated)


@router.delete("/{id}", status_code=204)
async def delete_room(
    id: str,
    user: dict = Depends(require_role("host", "admin")),
):
    bookings = database.collection("bookings")
    room = await _get_room_or_404(id, user, require_owner=True)

    active = await bookings.find_one(
        {"room_id": id, "status": {"$in": ["confirmed"]}, "payment_status": {"$in": ["pending", "paid"]}}
    )
    if active:
        raise HTTPException(status_code=409, detail="Cannot delete room with active booking")

    await database.collection("rooms").delete_one({"_id": ObjectId(id)})
    return None


@router.post("/{id}/photos")
async def add_photo(
    id: str,
    file: UploadFile = File(...),
    user: dict = Depends(require_role("host", "admin")),
):
    room = await _get_room_or_404(id, user, require_owner=True)
    photos = room.get("photos", [])
    if len(photos) >= MAX_PHOTOS:
        raise HTTPException(status_code=422, detail={"photos": f"Maximum {MAX_PHOTOS} photos allowed"})

    uploaded = await upload_image(file)
    photo = {"url": uploaded["url"], "public_id": uploaded["public_id"], "is_primary": len(photos) == 0}
    photos.append(photo)
    await database.collection("rooms").update_one({"_id": ObjectId(id)}, {"$set": {"photos": photos}})
    return photo


@router.delete("/{id}/photos/{pid}")
async def delete_photo(
    id: str,
    pid: str,
    user: dict = Depends(require_role("host", "admin")),
):
    room = await _get_room_or_404(id, user, require_owner=True)
    photos = room.get("photos", [])
    target = next((p for p in photos if p.get("public_id") == pid), None)
    if not target:
        raise HTTPException(status_code=404, detail="Photo not found")

    delete_asset(pid)
    photos = [p for p in photos if p.get("public_id") != pid]
    if photos and not any(p.get("is_primary") for p in photos):
        photos[0]["is_primary"] = True
    await database.collection("rooms").update_one({"_id": ObjectId(id)}, {"$set": {"photos": photos}})
    return {"message": "Photo deleted"}


@router.patch("/{id}/photos/{pid}/primary")
async def set_primary_photo(
    id: str,
    pid: str,
    user: dict = Depends(require_role("host", "admin")),
):
    room = await _get_room_or_404(id, user, require_owner=True)
    photos = room.get("photos", [])
    if not any(p.get("public_id") == pid for p in photos):
        raise HTTPException(status_code=404, detail="Photo not found")

    for p in photos:
        p["is_primary"] = p.get("public_id") == pid
    await database.collection("rooms").update_one({"_id": ObjectId(id)}, {"$set": {"photos": photos}})
    return {"message": "Primary photo updated", "photos": photos}


@router.post("/{id}/videos")
async def add_video(
    id: str,
    file: UploadFile = File(...),
    user: dict = Depends(require_role("host", "admin")),
):
    room = await _get_room_or_404(id, user, require_owner=True)
    videos = room.get("videos", [])
    if len(videos) >= MAX_VIDEOS:
        raise HTTPException(status_code=422, detail={"videos": f"Maximum {MAX_VIDEOS} videos allowed"})

    uploaded = await upload_video(file)
    video = {"url": uploaded["url"], "public_id": uploaded["public_id"]}
    videos.append(video)
    await database.collection("rooms").update_one({"_id": ObjectId(id)}, {"$set": {"videos": videos}})
    return video


@router.delete("/{id}/videos/{vid}")
async def delete_video(
    id: str,
    vid: str,
    user: dict = Depends(require_role("host", "admin")),
):
    room = await _get_room_or_404(id, user, require_owner=True)
    videos = room.get("videos", [])
    if not any(v.get("public_id") == vid for v in videos):
        raise HTTPException(status_code=404, detail="Video not found")

    delete_asset(vid, resource_type="video")
    videos = [v for v in videos if v.get("public_id") != vid]
    await database.collection("rooms").update_one({"_id": ObjectId(id)}, {"$set": {"videos": videos}})
    return {"message": "Video deleted"}
