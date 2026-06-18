from __future__ import annotations

import re
from typing import Any


def parse_floor_number(room: dict[str, Any]) -> int:
    floor_number = room.get("floor_number")
    if floor_number is not None:
        try:
            return int(floor_number)
        except (TypeError, ValueError):
            pass

    label = str(room.get("floor_label") or "")
    label_match = re.search(r"(\d+)", label)
    if label_match:
        return int(label_match.group(1))

    num = str(room.get("room_number") or "").strip()
    if not num:
        return 0
    if num.upper().startswith("G"):
        return 0
    digits = re.sub(r"\D", "", num)
    if len(digits) >= 3:
        return int(digits[:-2])
    if len(digits) == 2:
        return int(digits[0])
    return 0


def _sorted_floor_rooms(rooms: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(rooms, key=lambda room: str(room.get("room_number") or ""))


def rooms_are_contiguous(
    selected: list[dict[str, Any]], floor_rooms: list[dict[str, Any]]
) -> bool:
    if not selected:
        return False
    sorted_floor = _sorted_floor_rooms(floor_rooms)
    id_to_index = {
        str(room.get("_id") or room.get("id")): idx
        for idx, room in enumerate(sorted_floor)
    }
    indices = sorted(
        id_to_index[str(room.get("_id") or room.get("id"))]
        for room in selected
        if str(room.get("_id") or room.get("id")) in id_to_index
    )
    if len(indices) != len(selected):
        return False
    for idx in range(1, len(indices)):
        if indices[idx] != indices[idx - 1] + 1:
            return False
    return True


def validate_adjacent_room_selection(
    selected: list[dict[str, Any]],
    property_rooms: list[dict[str, Any]] | None = None,
) -> None:
    if not selected:
        raise ValueError("Select at least one room")
    if len(selected) == 1:
        return

    floors = {parse_floor_number(room) for room in selected}
    if len(floors) != 1:
        raise ValueError("Adjacent rooms must be on the same floor")

    floor = next(iter(floors))
    floor_context = property_rooms or selected
    floor_rooms = [room for room in floor_context if parse_floor_number(room) == floor]
    if not rooms_are_contiguous(selected, floor_rooms):
        raise ValueError("Selected rooms must be next to each other on the floor map")
