from __future__ import annotations

from typing import Any

from bson import ObjectId
from fastapi import HTTPException
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from database import database
from models.common import utc_now


class ActiveBookingError(Exception):
    pass


class RoomNotFoundError(Exception):
    pass


class MaxPhotosError(Exception):
    pass


class MaxVideosError(Exception):
    pass


class PhotoNotFoundError(Exception):
    pass


class VideoNotFoundError(Exception):
    pass


async def commit_room_inquiry(
    *,
    room_id: str,
    host_id: str | None,
    guest_id: str,
    guest_name: str,
    guest_email: str,
    message: str,
    check_in: str | None,
    check_out: str | None,
) -> dict[str, Any]:
    inquiry_doc = {
        "room_id": room_id,
        "host_id": host_id,
        "guest_id": guest_id,
        "guest_name": guest_name,
        "guest_email": guest_email,
        "message": message,
        "check_in": check_in,
        "check_out": check_out,
        "created_at": utc_now(),
    }

    async def _txn(session) -> dict[str, Any]:
        res = await database.collection("inquiries").insert_one(
            inquiry_doc, session=session
        )
        if host_id:
            await database.collection("notifications").insert_one(
                {
                    "user_id": host_id,
                    "type": "inquiry",
                    "title": f"New message from {guest_name}",
                    "body": message[:200],
                    "channel": "in_app",
                    "sent_at": utc_now(),
                    "read": False,
                    "meta": {"room_id": room_id, "inquiry_id": str(res.inserted_id)},
                },
                session=session,
            )
        created = await database.collection("inquiries").find_one(
            {"_id": res.inserted_id}, session=session
        )
        if created is None:
            raise RuntimeError("Inquiry insert failed")
        return created

    return await database.run_transaction(_txn)


async def commit_listing_report(doc: dict[str, Any]) -> dict[str, Any]:
    async def _txn(session) -> dict[str, Any]:
        try:
            res = await database.collection("listing_reports").insert_one(
                doc, session=session
            )
        except DuplicateKeyError as exc:
            raise HTTPException(
                status_code=409, detail="You already reported this listing"
            ) from exc
        created = await database.collection("listing_reports").find_one(
            {"_id": res.inserted_id}, session=session
        )
        if created is None:
            raise RuntimeError("Report insert failed")
        return created

    return await database.run_transaction(_txn)


async def commit_room_delete(room_id: str) -> None:
    if not ObjectId.is_valid(room_id):
        raise RoomNotFoundError()

    async def _txn(session) -> None:
        room_oid = ObjectId(room_id)
        room = await database.collection("rooms").find_one(
            {"_id": room_oid}, session=session
        )
        if not room:
            raise RoomNotFoundError()

        active = await database.collection("bookings").find_one(
            {
                "room_id": room_id,
                "status": "confirmed",
                "payment_status": {"$in": ["pending", "paid"]},
            },
            session=session,
        )
        if active:
            raise ActiveBookingError()

        await database.collection("rooms").delete_one(
            {"_id": room_oid}, session=session
        )

    try:
        await database.run_transaction(_txn)
    except RoomNotFoundError:
        raise HTTPException(status_code=404, detail="Room not found") from None
    except ActiveBookingError:
        raise HTTPException(
            status_code=409, detail="Cannot delete room with active booking"
        ) from None


async def commit_add_photo(
    room_id: str, photo: dict[str, Any], *, max_photos: int
) -> dict[str, Any]:
    if not ObjectId.is_valid(room_id):
        raise HTTPException(status_code=404, detail="Room not found")

    async def _txn(session) -> dict[str, Any]:
        result = await database.collection("rooms").update_one(
            {
                "_id": ObjectId(room_id),
                "$expr": {"$lt": [{"$size": {"$ifNull": ["$photos", []]}}, max_photos]},
            },
            {"$push": {"photos": photo}},
            session=session,
        )
        if result.modified_count == 0:
            room = await database.collection("rooms").find_one(
                {"_id": ObjectId(room_id)}, session=session
            )
            if not room:
                raise HTTPException(status_code=404, detail="Room not found")
            raise MaxPhotosError()
        return photo

    try:
        return await database.run_transaction(_txn)
    except MaxPhotosError:
        raise HTTPException(
            status_code=422, detail={"photos": f"Maximum {max_photos} photos allowed"}
        ) from None


async def commit_delete_photo(room_id: str, public_id: str) -> list[dict[str, Any]]:
    if not ObjectId.is_valid(room_id):
        raise HTTPException(status_code=404, detail="Room not found")

    async def _txn(session) -> list[dict[str, Any]]:
        room = await database.collection("rooms").find_one_and_update(
            {"_id": ObjectId(room_id), "photos.public_id": public_id},
            {"$pull": {"photos": {"public_id": public_id}}},
            return_document=ReturnDocument.AFTER,
            session=session,
        )
        if not room:
            existing = await database.collection("rooms").find_one(
                {"_id": ObjectId(room_id)}, session=session
            )
            if not existing:
                raise HTTPException(status_code=404, detail="Room not found")
            raise PhotoNotFoundError()

        photos = room.get("photos", [])
        if photos and not any(p.get("is_primary") for p in photos):
            photos[0]["is_primary"] = True
            await database.collection("rooms").update_one(
                {"_id": ObjectId(room_id)},
                {"$set": {"photos": photos}},
                session=session,
            )
        return photos

    try:
        return await database.run_transaction(_txn)
    except PhotoNotFoundError:
        raise HTTPException(status_code=404, detail="Photo not found") from None


async def commit_set_primary_photo(
    room_id: str, public_id: str
) -> list[dict[str, Any]]:
    if not ObjectId.is_valid(room_id):
        raise HTTPException(status_code=404, detail="Room not found")

    async def _txn(session) -> list[dict[str, Any]]:
        room = await database.collection("rooms").find_one(
            {"_id": ObjectId(room_id)}, session=session
        )
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        photos = room.get("photos", [])
        if not any(p.get("public_id") == public_id for p in photos):
            raise PhotoNotFoundError()
        for photo in photos:
            photo["is_primary"] = photo.get("public_id") == public_id
        await database.collection("rooms").update_one(
            {"_id": ObjectId(room_id)},
            {"$set": {"photos": photos}},
            session=session,
        )
        return photos

    try:
        return await database.run_transaction(_txn)
    except PhotoNotFoundError:
        raise HTTPException(status_code=404, detail="Photo not found") from None


async def commit_reorder_photos(
    room_id: str, public_ids: list[str]
) -> list[dict[str, Any]]:
    if not ObjectId.is_valid(room_id):
        raise HTTPException(status_code=404, detail="Room not found")

    async def _txn(session) -> list[dict[str, Any]]:
        room = await database.collection("rooms").find_one(
            {"_id": ObjectId(room_id)}, session=session
        )
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        photos = room.get("photos", [])
        if not photos:
            return []

        current = {p.get("public_id"): p for p in photos if p.get("public_id")}
        ordered = [current[pid] for pid in public_ids if pid in current]
        ordered += [p for p in photos if p.get("public_id") not in public_ids]
        if ordered and not any(p.get("is_primary") for p in ordered):
            ordered[0]["is_primary"] = True
        await database.collection("rooms").update_one(
            {"_id": ObjectId(room_id)},
            {"$set": {"photos": ordered}},
            session=session,
        )
        return ordered

    return await database.run_transaction(_txn)


async def commit_add_video(
    room_id: str, video: dict[str, Any], *, max_videos: int
) -> dict[str, Any]:
    if not ObjectId.is_valid(room_id):
        raise HTTPException(status_code=404, detail="Room not found")

    async def _txn(session) -> dict[str, Any]:
        result = await database.collection("rooms").update_one(
            {
                "_id": ObjectId(room_id),
                "$expr": {"$lt": [{"$size": {"$ifNull": ["$videos", []]}}, max_videos]},
            },
            {"$push": {"videos": video}},
            session=session,
        )
        if result.modified_count == 0:
            room = await database.collection("rooms").find_one(
                {"_id": ObjectId(room_id)}, session=session
            )
            if not room:
                raise HTTPException(status_code=404, detail="Room not found")
            raise MaxVideosError()
        return video

    try:
        return await database.run_transaction(_txn)
    except MaxVideosError:
        raise HTTPException(
            status_code=422, detail={"videos": f"Maximum {max_videos} videos allowed"}
        ) from None


async def commit_delete_video(room_id: str, public_id: str) -> list[dict[str, Any]]:
    if not ObjectId.is_valid(room_id):
        raise HTTPException(status_code=404, detail="Room not found")

    async def _txn(session) -> list[dict[str, Any]]:
        room = await database.collection("rooms").find_one_and_update(
            {"_id": ObjectId(room_id), "videos.public_id": public_id},
            {"$pull": {"videos": {"public_id": public_id}}},
            return_document=ReturnDocument.AFTER,
            session=session,
        )
        if not room:
            existing = await database.collection("rooms").find_one(
                {"_id": ObjectId(room_id)}, session=session
            )
            if not existing:
                raise HTTPException(status_code=404, detail="Room not found")
            raise VideoNotFoundError()
        return room.get("videos", [])

    try:
        return await database.run_transaction(_txn)
    except VideoNotFoundError:
        raise HTTPException(status_code=404, detail="Video not found") from None
