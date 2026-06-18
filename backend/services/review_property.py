from __future__ import annotations

from typing import Any


def property_name_from_room(room: dict[str, Any]) -> str:
    title = (room.get("title") or "").strip()
    if " · " in title:
        return title.split(" · ", 1)[0].strip()
    return title or "This property"


def property_query_from_room(room: dict[str, Any]) -> dict[str, Any]:
    host_id = room.get("host_id")
    city = (room.get("location") or {}).get("city")
    if not host_id or not city:
        return {"_id": room["_id"]}
    return {"host_id": host_id, "location.city": city}


async def get_property_room_ids(room: dict[str, Any], *, database) -> list[str]:
    q = property_query_from_room(room)
    siblings = await database.collection("rooms").find(q).to_list(200)
    if not siblings:
        return [str(room["_id"])]
    return [str(item["_id"]) for item in siblings]
