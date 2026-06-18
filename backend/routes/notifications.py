from __future__ import annotations

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from database import database
from models.common import serialize_doc, utc_now
from services.auth import get_current_user
from services.email import send_template_email

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(user: dict = Depends(get_current_user)):
    items = (
        await database.collection("notifications")
        .find({"user_id": str(user["_id"])})
        .sort("sent_at", -1)
        .to_list(20)
    )
    return [serialize_doc(i) for i in items]


@router.patch("/{id}/read")
async def mark_notification_read(id: str, user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=404, detail="Notification not found")
    result = await database.collection("notifications").update_one(
        {"_id": ObjectId(id), "user_id": str(user["_id"])},
        {"$set": {"read": True}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    updated = await database.collection("notifications").find_one({"_id": ObjectId(id)})
    return serialize_doc(updated)


class TestEmailRequest(BaseModel):
    to: EmailStr | None = None


@router.post("/test-email")
async def test_email(payload: TestEmailRequest | None = None, user: dict = Depends(get_current_user)):
    to = (payload.to if payload and payload.to else None) or user["email"]
    sent = await send_template_email(
        to=to,
        subject="StayEase test email",
        template_name="welcome.html",
        context={"user": {"name": user["name"]}},
    )
    if not sent:
        return {"message": "Email not sent (mail not configured)", "mock": True}

    doc = {
        "user_id": str(user["_id"]),
        "type": "test",
        "title": "Test email sent",
        "body": f"Test email delivered to {to}",
        "channel": "email",
        "sent_at": utc_now(),
        "read": False,
    }
    res = await database.collection("notifications").insert_one(doc)
    created = await database.collection("notifications").find_one({"_id": res.inserted_id})
    return {"message": "Test email sent", "notification": serialize_doc(created)}
