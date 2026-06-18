from __future__ import annotations

from typing import Literal

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from database import database
from models.common import serialize_doc
from services.auth import get_current_user

router = APIRouter(prefix="/api/inquiries", tags=["inquiries"])


async def _enrich_inquiries(items: list[dict]) -> list[dict]:
    if not items:
        return []

    room_ids = list({item["room_id"] for item in items if item.get("room_id")})
    host_ids = list({item["host_id"] for item in items if item.get("host_id")})

    room_map: dict[str, dict] = {}
    if room_ids:
        object_ids = [ObjectId(rid) for rid in room_ids if ObjectId.is_valid(rid)]
        if object_ids:
            rooms = (
                await database.collection("rooms")
                .find({"_id": {"$in": object_ids}})
                .to_list(len(object_ids))
            )
            room_map = {str(room["_id"]): room for room in rooms}

    host_map: dict[str, dict] = {}
    if host_ids:
        object_ids = [ObjectId(hid) for hid in host_ids if ObjectId.is_valid(hid)]
        if object_ids:
            hosts = (
                await database.collection("users")
                .find({"_id": {"$in": object_ids}})
                .to_list(len(object_ids))
            )
            host_map = {str(host["_id"]): host for host in hosts}

    enriched: list[dict] = []
    for item in items:
        row = serialize_doc(item)
        room = room_map.get(item.get("room_id", ""))
        host = host_map.get(item.get("host_id", ""))
        if room:
            row["room_title"] = room.get("title")
            row["room_city"] = room.get("location", {}).get("city")
        if host:
            row["host_name"] = host.get("name")
        enriched.append(row)
    return enriched


@router.get("")
async def list_inquiries(
    scope: Literal["sent", "received"] = Query("sent"),
    user: dict = Depends(get_current_user),
):
    user_id = str(user["_id"])
    if scope == "sent":
        query = {"guest_id": user_id}
    else:
        if user.get("role") not in ("host", "admin"):
            raise HTTPException(status_code=403, detail="Host access required")
        query = {"host_id": user_id}

    items = (
        await database.collection("inquiries")
        .find(query)
        .sort("created_at", -1)
        .to_list(200)
    )
    return await _enrich_inquiries(items)
