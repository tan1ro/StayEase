from __future__ import annotations

from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, HTTPException

from database import database
from models.common import serialize_doc
from services.review_stats import aggregate_reviews_by_room
from services.roles import is_host_role, normalize_role

router = APIRouter(prefix="/api/hosts", tags=["hosts"])

AMENITY_INTERESTS = {
    "Spa": "Spa",
    "Restaurant": "Food scenes",
    "Pool": "Outdoors",
    "Coffee": "Coffee",
    "Gym": "Live sports",
    "Nature Trails": "Outdoors",
    "Bar": "Wine",
    "Yoga studio": "Self-care",
    "Game room": "Chess",
    "Sound system": "Live music",
}


def _years_hosting(created_at) -> int:
    if not created_at:
        return 1
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    years = (datetime.utcnow() - created_at.replace(tzinfo=None)).days / 365.25
    return max(1, int(years))


def _derive_interests(rooms: list[dict], host_profile: dict | None) -> list[str]:
    if host_profile and host_profile.get("interests"):
        return list(host_profile["interests"])[:16]
    found: list[str] = []
    for room in rooms:
        for amenity in room.get("amenities") or []:
            label = AMENITY_INTERESTS.get(amenity)
            if label and label not in found:
                found.append(label)
    defaults = ["Travel", "Hospitality", "Food scenes", "Outdoors"]
    for item in defaults:
        if item not in found:
            found.append(item)
    return found[:12]


@router.get("/{host_id}/profile")
async def get_host_profile(host_id: str):
    if not ObjectId.is_valid(host_id):
        raise HTTPException(status_code=404, detail="Host not found")

    host = await database.collection("users").find_one({"_id": ObjectId(host_id)})
    if not host or not is_host_role(host.get("role")):
        raise HTTPException(status_code=404, detail="Host not found")

    rooms = (
        await database.collection("rooms")
        .find({"host_id": host_id})
        .sort("created_at", -1)
        .to_list(200)
    )
    room_ids = [str(room["_id"]) for room in rooms]
    room_titles = {str(room["_id"]): room.get("title", "") for room in rooms}
    room_photos = {
        str(room["_id"]): next(
            (photo.get("url") for photo in (room.get("photos") or []) if photo.get("is_primary")),
            (room.get("photos") or [{}])[0].get("url") if room.get("photos") else None,
        )
        for room in rooms
    }

    reviews = []
    if room_ids:
        reviews = (
            await database.collection("reviews")
            .find({"room_id": {"$in": room_ids}})
            .sort("created_at", -1)
            .to_list(500)
        )

    reviews_by_room = aggregate_reviews_by_room(reviews, reviews_per_room=4)
    avg_rating = round(sum(review["rating"] for review in reviews) / len(reviews), 2) if reviews else 0.0
    identity = host.get("identity_proof") or {}

    listings = []
    reviews_by_listing = []
    for room in rooms:
        room_id = str(room["_id"])
        room_stats = reviews_by_room.get(room_id, {"avg_rating": 0.0, "total_reviews": 0, "reviews": []})
        listing = serialize_doc(room)
        listing["avg_rating"] = room_stats["avg_rating"]
        listing["total_reviews"] = room_stats["total_reviews"]
        listings.append(listing)

        if room_stats["total_reviews"] > 0:
            listing_reviews = []
            for review in room_stats["reviews"]:
                item = serialize_doc(review)
                item["room_id"] = room_id
                item["room_title"] = room_titles.get(room_id, "")
                listing_reviews.append(item)

            reviews_by_listing.append(
                {
                    "room_id": room_id,
                    "room_title": room_titles.get(room_id, ""),
                    "photo_url": room_photos.get(room_id),
                    "avg_rating": room_stats["avg_rating"],
                    "total_reviews": room_stats["total_reviews"],
                    "reviews": listing_reviews,
                }
            )

    review_items = []
    for review in reviews[:24]:
        item = serialize_doc(review)
        room_id = review.get("room_id", "")
        item["room_id"] = room_id
        item["room_title"] = room_titles.get(room_id, "")
        room_doc = next((room for room in rooms if str(room["_id"]) == room_id), None)
        if room_doc:
            item["room_city"] = (room_doc.get("location") or {}).get("city")
        review_items.append(item)

    host_profile = host.get("host_profile") or {}

    return {
        "id": host_id,
        "name": host["name"],
        "role": normalize_role(host.get("role")),
        "avatar_url": host.get("avatar_url"),
        "about_me": host.get("about_me"),
        "created_at": host.get("created_at").isoformat() if host.get("created_at") else None,
        "email_verified": bool(host.get("email_verified")),
        "identity_verified": bool(identity.get("verified")),
        "host_profile": host_profile,
        "interests": _derive_interests(rooms, host_profile),
        "stats": {
            "listing_count": len(rooms),
            "total_reviews": len(reviews),
            "avg_rating": avg_rating,
            "years_hosting": _years_hosting(host.get("created_at")),
            "response_rate": 100,
        },
        "listings": listings,
        "reviews": review_items,
        "reviews_by_listing": reviews_by_listing,
    }
