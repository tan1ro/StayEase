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
    base = settings.OPEN_METEO_BASE_URL.rstrip("/")
    url = f"{base}/v1/forecast" f"?latitude={lat}&longitude={lon}&current_weather=true"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            payload = resp.json()
            current = payload.get("current_weather")
            if not current:
                raise HTTPException(
                    status_code=502, detail="Weather service unavailable"
                )
            return current
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=502, detail="Weather service unavailable"
        ) from e
