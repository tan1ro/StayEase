from __future__ import annotations

from typing import Literal

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from database import database
from models.common import serialize_doc
from services.auth import get_current_user
from services.transactions import commit_inquiry_reply

router = APIRouter(prefix="/api/inquiries", tags=["inquiries"])


def _serialize_replies(replies: list | None) -> list[dict]:
    if not replies:
        return []
    out = []
    for reply in replies:
        item = dict(reply)
        created = item.get("created_at")
        if hasattr(created, "isoformat"):
            item["created_at"] = created.isoformat()
        out.append(item)
    return out


async def _enrich_inquiries(items: list[dict]) -> list[dict]:
    if not items:
        return []

    room_ids = list({item["room_id"] for item in items if item.get("room_id")})
    host_ids = list({item["host_id"] for item in items if item.get("host_id")})

    room_map: dict[str, dict] = {}
    if room_ids:
        object_ids = [ObjectId(rid) for rid in room_ids if ObjectId.is_valid(rid)]
        if object_ids:
            rooms = await database.collection("rooms").find({"_id": {"$in": object_ids}}).to_list(len(object_ids))
            room_map = {str(room["_id"]): room for room in rooms}

    host_map: dict[str, dict] = {}
    if host_ids:
        object_ids = [ObjectId(hid) for hid in host_ids if ObjectId.is_valid(hid)]
        if object_ids:
            hosts = await database.collection("users").find({"_id": {"$in": object_ids}}).to_list(len(object_ids))
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
        row["replies"] = _serialize_replies(item.get("replies"))
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


class InquiryReplyCreate(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


@router.post("/{inquiry_id}/replies", status_code=201)
async def reply_to_inquiry(
    inquiry_id: str,
    payload: InquiryReplyCreate,
    user: dict = Depends(get_current_user),
):
    if not ObjectId.is_valid(inquiry_id):
        raise HTTPException(status_code=404, detail="Inquiry not found")

    inquiry = await database.collection("inquiries").find_one({"_id": ObjectId(inquiry_id)})
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    user_id = str(user["_id"])
    host_id = inquiry.get("host_id")
    guest_id = inquiry.get("guest_id")
    message = payload.message.strip()
    if len(message) < 1:
        raise HTTPException(status_code=422, detail="Message cannot be empty")

    if user_id == host_id and user.get("role") in ("host", "admin"):
        sender_role = "host"
    elif user_id == guest_id:
        sender_role = "guest"
    else:
        raise HTTPException(status_code=403, detail="Not allowed to reply to this inquiry")

    updated = await commit_inquiry_reply(
        inquiry_id=inquiry_id,
        sender_id=user_id,
        sender_role=sender_role,
        sender_name=user["name"],
        message=message,
        guest_id=guest_id,
        host_id=host_id,
        room_id=inquiry.get("room_id", ""),
    )
    enriched = await _enrich_inquiries([updated])
    return enriched[0]
