from __future__ import annotations

from datetime import date

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from pymongo.errors import DuplicateKeyError

from database import get_database
from models.common import serialize_doc, utc_now
from models.offer import OfferCreate
from services.auth import require_role

router = APIRouter(prefix="/api/offers", tags=["offers"])


@router.post("", status_code=201)
async def create_offer(
    payload: OfferCreate,
    user: dict = Depends(require_role("host", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    offers = db["offers"]
    existing = await offers.find_one({"code": payload.code.upper()})
    if existing:
        raise HTTPException(status_code=422, detail={"code": "Offer code already exists"})
    doc = {
        "host_id": str(user["_id"]) if user["role"] == "host" else None,
        "code": payload.code.upper(),
        "type": payload.type,
        "value": payload.value,
        "min_booking_amount": payload.min_booking_amount,
        "max_discount": payload.max_discount,
        "valid_from": payload.valid_from.isoformat(),
        "valid_until": payload.valid_until.isoformat(),
        "usage_limit": payload.usage_limit,
        "used_count": 0,
        "applicable_rooms": payload.applicable_rooms,
        "is_active": payload.is_active,
        "created_at": utc_now(),
    }
    try:
        res = await offers.insert_one(doc)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=422, detail={"code": "Offer code already exists"}) from exc
    created = await offers.find_one({"_id": res.inserted_id})
    return serialize_doc(created)


@router.get("")
async def list_offers(
    host_id: str | None = None,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    q = {}
    if host_id:
        q["host_id"] = host_id
    items = await db["offers"].find(q).sort("created_at", -1).to_list(200)
    return [serialize_doc(i) for i in items]


@router.get("/{code}")
async def get_offer_by_code(
    code: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    offer = await db["offers"].find_one({"code": code.upper()})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    return serialize_doc(offer)


@router.patch("/{id}")
async def update_offer(
    id: str,
    payload: dict,
    user: dict = Depends(require_role("host", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=404, detail="Offer not found")
    await db["offers"].update_one({"_id": ObjectId(id)}, {"$set": payload})
    updated = await db["offers"].find_one({"_id": ObjectId(id)})
    return serialize_doc(updated)


@router.delete("/{id}", status_code=204)
async def delete_offer(
    id: str,
    user: dict = Depends(require_role("host", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=404, detail="Offer not found")
    await db["offers"].delete_one({"_id": ObjectId(id)})
    return None


class ValidateOfferRequest(BaseModel):
    code: str
    room_id: str
    amount: float


@router.post("/validate")
async def validate_offer(
    payload: ValidateOfferRequest,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    offer = await db["offers"].find_one({"code": payload.code.upper(), "is_active": True})
    if not offer:
        raise HTTPException(status_code=422, detail={"code": "Invalid offer code"})
    today = date.today().isoformat()
    if offer["valid_from"] > today or offer["valid_until"] < today:
        raise HTTPException(status_code=422, detail={"code": "Offer expired"})
    if offer["used_count"] >= offer["usage_limit"]:
        raise HTTPException(status_code=422, detail={"code": "Offer usage limit reached"})
    if payload.amount < offer.get("min_booking_amount", 0):
        raise HTTPException(status_code=422, detail={"amount": "Minimum booking amount not met"})
    return {"valid": True, "offer": serialize_doc(offer)}
