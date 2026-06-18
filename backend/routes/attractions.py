from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException

from config import settings
from database import database
from models.common import serialize_doc

router = APIRouter(prefix="/api", tags=["attractions"])


@router.get("/attractions/{city}")
async def get_attractions(city: str):
    items = (
        await database.collection("attractions")
        .find({"city": {"$regex": f"^{city}$", "$options": "i"}})
        .sort("distance_km", 1)
        .to_list(100)
    )
    return [serialize_doc(i) for i in items]


@router.get("/weather/{lat}/{lon}")
async def get_weather(lat: float, lon: float):
    url = (
        f"{settings.OPEN_METEO_BASE_URL.rstrip('/')}/forecast"
        f"?latitude={lat}&longitude={lon}"
        "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m"
        "&daily=temperature_2m_max,temperature_2m_min,weather_code"
        "&timezone=auto"
    )
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail="Weather service unavailable") from e
