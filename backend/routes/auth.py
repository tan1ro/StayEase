from __future__ import annotations

import json
import secrets
from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from database import database
from models.auth import LoginRequest, VerifyEmailRequest
from models.user import IdentityProof, NotificationPrefs, UserCreate, UserPublic
from services.auth import (
    create_access_token,
    generate_unique_referral_code,
    get_current_user,
    hash_password,
    verify_password,
)
from models.common import serialize_doc, utc_now
from services.cloudinary import upload_image
from services.email import send_template_email
from services.roles import normalize_role, resolve_registration_role


router = APIRouter(prefix="/api/auth", tags=["auth"])


def _generate_otp() -> str:
    return "".join(secrets.choice("0123456789") for _ in range(6))


async def _send_otp_email(user: dict, otp: str) -> None:
    await send_template_email(
        to=user["email"],
        subject="StayEase email verification OTP",
        template_name="welcome.html",
        context={"user": user, "otp": otp},
    )


@router.post("/register", status_code=201)
async def register(payload: UserCreate):
    users = database.collection("users")

    existing = await users.find_one({"email": payload.email.strip().lower()})
    if existing:
        raise HTTPException(status_code=422, detail={"email": "Email already registered"})

    email = payload.email.strip().lower()

    referral_code = await generate_unique_referral_code()

    referred_by_user = None
    if payload.referred_by:
        referred_by_user = await users.find_one({"referral_code": payload.referred_by})
        if not referred_by_user:
            raise HTTPException(status_code=422, detail={"referred_by": "Invalid referral code"})

    role = resolve_registration_role(
        email=email,
        as_host=payload.role == "host",
    )

    doc = {
        "name": payload.name,
        "email": email,
        "phone": payload.phone,
        "password_hash": hash_password(payload.password),
        "role": role,
        "avatar_url": None,
        "about_me": None,
        "identity_proof": None,
        "email_verified": False,
        "email_otp": None,
        "email_otp_expires": None,
        "referral_code": referral_code,
        "referred_by": str(referred_by_user["_id"]) if referred_by_user else None,
        "referral_credits": 0.0,
        "wishlist": [],
        "notification_prefs": {"email": True, "whatsapp": False},
        "date_of_birth": payload.date_of_birth,
        "onboarding_completed": True,
        "created_at": utc_now(),
    }

    res = await users.insert_one(doc)

    if referred_by_user:
        await users.update_one(
            {"_id": referred_by_user["_id"]},
            {"$inc": {"referral_credits": 200.0}},
        )
        await users.update_one({"_id": res.inserted_id}, {"$inc": {"referral_credits": 100.0}})

    user = await users.find_one({"_id": res.inserted_id})
    token = create_access_token(subject=str(user["_id"]), role=user["role"])

    await send_template_email(
        to=user["email"],
        subject="Welcome to StayEase",
        template_name="welcome.html",
        context={"user": serialize_doc(user)},
    )

    return {"access_token": token, "token_type": "bearer", "user": UserPublic.from_mongo(user)}


@router.post("/login")
async def login(payload: LoginRequest):
    users = database.collection("users")
    email = payload.email.strip().lower()
    user = await users.find_one({"email": email})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(subject=str(user["_id"]), role=user["role"])
    return {"access_token": token, "token_type": "bearer", "user": UserPublic.from_mongo(user)}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return UserPublic.from_mongo(user)


@router.patch("/profile")
async def update_profile(
    name: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    about_me: Optional[str] = Form(None),
    notification_prefs: Optional[str] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    user: dict = Depends(get_current_user),
):
    updates: dict = {}

    if name is not None:
        updates["name"] = name
    if phone is not None:
        import re

        if not re.fullmatch(r"\d{10}", phone):
            raise HTTPException(status_code=422, detail={"phone": "Phone must be a 10-digit India mobile number"})
        updates["phone"] = phone
    if about_me is not None:
        updates["about_me"] = about_me
    if notification_prefs is not None:
        try:
            prefs_data = json.loads(notification_prefs)
            prefs = NotificationPrefs.model_validate(prefs_data)
            updates["notification_prefs"] = prefs.model_dump()
        except (json.JSONDecodeError, ValueError) as e:
            raise HTTPException(status_code=422, detail={"notification_prefs": "Invalid notification preferences"}) from e

    if avatar is not None and avatar.filename:
        uploaded = await upload_image(avatar)
        updates["avatar_url"] = uploaded["url"]

    if not updates:
        return UserPublic.from_mongo(user)

    await database.collection("users").update_one({"_id": user["_id"]}, {"$set": updates})
    updated = await database.collection("users").find_one({"_id": user["_id"]})
    return UserPublic.from_mongo(updated)


@router.post("/verify-identity")
async def verify_identity(
    id_type: str = Form(...),
    id_number: str = Form(...),
    document: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    if id_type not in ("aadhar", "pan", "passport"):
        raise HTTPException(status_code=422, detail={"id_type": "Invalid identity type"})

    uploaded = await upload_image(document)
    try:
        identity = IdentityProof(type=id_type, number=id_number, document_url=uploaded["url"], verified=False)
    except ValueError as e:
        raise HTTPException(status_code=422, detail={"id_number": str(e)}) from e

    proof = identity.model_dump()
    await database.collection("users").update_one(
        {"_id": user["_id"]},
        {"$set": {"identity_proof": proof}},
    )
    return {"message": "Identity document submitted for verification", "identity_proof": proof}


@router.post("/verify-email")
async def verify_email(payload: VerifyEmailRequest, user: dict = Depends(get_current_user)):
    if user.get("email_verified"):
        return {"message": "Email already verified"}

    stored_otp = user.get("email_otp")
    expires = user.get("email_otp_expires")
    if not stored_otp or not expires:
        raise HTTPException(status_code=422, detail={"otp": "No OTP requested. Use resend-otp first."})
    if utc_now() > expires:
        raise HTTPException(status_code=422, detail={"otp": "OTP expired. Request a new one."})
    if payload.otp != stored_otp:
        raise HTTPException(status_code=422, detail={"otp": "Invalid OTP"})

    await database.collection("users").update_one(
        {"_id": user["_id"]},
        {"$set": {"email_verified": True, "email_otp": None, "email_otp_expires": None}},
    )
    return {"message": "Email verified successfully"}


@router.post("/resend-otp")
async def resend_otp(user: dict = Depends(get_current_user)):
    if user.get("email_verified"):
        return {"message": "Email already verified"}

    otp = _generate_otp()
    expires = utc_now() + timedelta(minutes=10)
    await database.collection("users").update_one(
        {"_id": user["_id"]},
        {"$set": {"email_otp": otp, "email_otp_expires": expires}},
    )
    await _send_otp_email(user, otp)
    return {"message": "OTP sent to your email", "mock_otp": otp}
