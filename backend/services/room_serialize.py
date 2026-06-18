from __future__ import annotations

from typing import Any

from models.common import serialize_doc

HOST_ONLY_ROOM_FIELDS = ("unavailable_reason", "unavailable_reason_note")


def serialize_room(doc: dict[str, Any] | None, *, for_guest: bool = False) -> dict[str, Any] | None:
    out = serialize_doc(doc)
    if not out or not for_guest:
        return out
    for key in HOST_ONLY_ROOM_FIELDS:
        out.pop(key, None)
    return out
