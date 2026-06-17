from __future__ import annotations

from fastapi import APIRouter, Depends

from config import settings
from database import database
from services.auth import get_current_user

router = APIRouter(prefix="/api/referrals", tags=["referrals"])


@router.get("/my-code")
async def my_referral_code(user: dict = Depends(get_current_user)):
    code = user["referral_code"]
    return {
        "referral_code": code,
        "referral_link": f"{settings.FRONTEND_URL.rstrip('/')}/register?ref={code}",
    }


@router.get("/stats")
async def referral_stats(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    referred = await database.collection("users").find({"referred_by": user_id}).to_list(500)
    credits_earned = len(referred) * 200.0
    return {
        "total_referred": len(referred),
        "credits_earned": credits_earned,
        "credits_available": float(user.get("referral_credits", 0)),
        "referred_users": [{"name": u["name"], "email": u["email"]} for u in referred],
    }
