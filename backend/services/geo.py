from __future__ import annotations

import math


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def filter_by_distance(
    rooms: list[dict],
    lat: float,
    lng: float,
    radius_km: float = 50.0,
) -> list[dict]:
    filtered: list[dict] = []
    for room in rooms:
        loc = room.get("location") or {}
        rlat, rlng = loc.get("lat"), loc.get("lng")
        if rlat is None or rlng is None:
            continue
        distance = haversine_km(lat, lng, float(rlat), float(rlng))
        if distance <= radius_km:
            room = {**room, "distance_km": round(distance, 1)}
            filtered.append(room)
    filtered.sort(key=lambda r: r.get("distance_km", 9999))
    return filtered
