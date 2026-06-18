from __future__ import annotations

from bson import ObjectId

from database import database


async def sync_room_review_stats(room_id: str, *, session=None) -> dict[str, float | int]:
    reviews = (
        await database.collection("reviews")
        .find({"room_id": room_id}, session=session)
        .to_list(500)
    )
    if reviews:
        avg_rating = round(sum(r["rating"] for r in reviews) / len(reviews), 2)
        total_reviews = len(reviews)
    else:
        avg_rating = 0.0
        total_reviews = 0

    if ObjectId.is_valid(room_id):
        await database.collection("rooms").update_one(
            {"_id": ObjectId(room_id)},
            {"$set": {"avg_rating": avg_rating, "total_reviews": total_reviews}},
            session=session,
        )

    return {"avg_rating": avg_rating, "total_reviews": total_reviews}


async def sync_all_room_review_stats() -> int:
    rooms = await database.collection("rooms").find({}, {"_id": 1}).to_list(5000)
    for room in rooms:
        await sync_room_review_stats(str(room["_id"]))
    return len(rooms)


def aggregate_reviews_by_room(
    reviews: list[dict],
    *,
    reviews_per_room: int | None = None,
) -> dict[str, dict]:
    grouped: dict[str, list[dict]] = {}
    for review in reviews:
        room_id = review.get("room_id")
        if not room_id:
            continue
        grouped.setdefault(room_id, []).append(review)

    result: dict[str, dict] = {}
    for room_id, room_reviews in grouped.items():
        avg_rating = round(sum(r["rating"] for r in room_reviews) / len(room_reviews), 2)
        ordered = sorted(room_reviews, key=lambda r: r.get("created_at") or "", reverse=True)
        if reviews_per_room is not None:
            ordered = ordered[:reviews_per_room]
        result[room_id] = {
            "avg_rating": avg_rating,
            "total_reviews": len(room_reviews),
            "reviews": ordered,
        }

    return result
