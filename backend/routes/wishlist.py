from __future__ import annotations

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from database import database
from models.common import serialize_doc
from services.auth import get_current_user

router = APIRouter(prefix="/api/wishlist", tags=["wishlist"])


@router.post("/{room_id}")
async def add_to_wishlist(room_id: str, user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(room_id):
        raise HTTPException(status_code=404, detail="Room not found")
    room = await database.collection("rooms").find_one({"_id": ObjectId(room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    wishlist = user.get("wishlist", [])
    if room_id not in wishlist:
        wishlist.append(room_id)
        await database.collection("users").update_one(
            {"_id": user["_id"]},
            {"$set": {"wishlist": wishlist}},
        )
    return {"message": "Added to wishlist", "wishlist": wishlist}


@router.get("")
async def get_wishlist(user: dict = Depends(get_current_user)):
    wishlist_ids = user.get("wishlist", [])
    if not wishlist_ids:
        return []
    object_ids = [ObjectId(rid) for rid in wishlist_ids if ObjectId.is_valid(rid)]
    rooms = await database.collection("rooms").find({"_id": {"$in": object_ids}}).to_list(100)
    return [serialize_doc(r) for r in rooms]
