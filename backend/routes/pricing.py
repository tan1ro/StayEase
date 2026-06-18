from __future__ import annotations

from datetime import date

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from database import get_database
from services.pricing import calculate_dynamic_pricing

router = APIRouter(prefix="/api/pricing", tags=["pricing"])


class PricingRequest(BaseModel):
    room_id: str
    check_in: date
    check_out: date
    offer_code: str | None = None


@router.post("/calculate")
async def calculate_price(
    payload: PricingRequest,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    if payload.check_out <= payload.check_in:
        raise HTTPException(status_code=422, detail={"check_out": "Check-out must be after check-in"})
    if not ObjectId.is_valid(payload.room_id):
        raise HTTPException(status_code=404, detail="Room not found")
    room = await db["rooms"].find_one({"_id": ObjectId(payload.room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    offer = None
    if payload.offer_code:
        offer = await db["offers"].find_one(
            {"code": payload.offer_code.upper(), "is_active": True}
        )
        if not offer:
            raise HTTPException(status_code=422, detail={"offer_code": "Invalid offer code"})
        today = date.today().isoformat()
        if offer["valid_from"] > today or offer["valid_until"] < today:
            raise HTTPException(status_code=422, detail={"offer_code": "Offer expired"})

    return calculate_dynamic_pricing(
        base_price=room["price_per_night"],
        check_in=payload.check_in,
        check_out=payload.check_out,
        offer=offer,
        view_type=room.get("view_type"),
        facing_side=room.get("facing_side"),
    )
