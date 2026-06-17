from __future__ import annotations

from typing import Any


def score_room(room: dict, preferences: dict[str, Any]) -> float:
    score = 0.0
    total = 0.0

    if preferences.get("food_preference"):
        total += 1
        if room.get("food_preference") in (
            preferences["food_preference"],
            "both",
        ):
            score += 1

    if preferences.get("smoking_policy"):
        total += 1
        if room.get("smoking_policy") == preferences["smoking_policy"]:
            score += 1

    if preferences.get("alcohol_policy"):
        total += 1
        if room.get("alcohol_policy") == preferences["alcohol_policy"]:
            score += 1

    if preferences.get("view_type"):
        total += 1
        if room.get("view_type") == preferences["view_type"]:
            score += 1

    if preferences.get("room_category"):
        total += 1
        if room.get("room_category") == preferences["room_category"]:
            score += 1

    if preferences.get("max_price"):
        total += 1
        if room.get("price_per_night", 0) <= preferences["max_price"]:
            score += 1

    if preferences.get("balcony") is True:
        total += 1
        if room.get("has_balcony"):
            score += 1

    if total == 0:
        return 50.0
    return round((score / total) * 100, 1)


def rank_rooms(rooms: list[dict], preferences: dict[str, Any]) -> list[dict]:
    ranked = []
    for room in rooms:
        match_score = score_room(room, preferences)
        item = dict(room)
        item["match_score"] = match_score
        ranked.append(item)
    ranked.sort(key=lambda r: r["match_score"], reverse=True)
    return ranked
