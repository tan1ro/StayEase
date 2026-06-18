from __future__ import annotations

import json
import secrets
from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from database import database, get_database
from models.auth import (
    CompleteProfileRequest,
    ForgotPasswordRequest,
    LoginRequest,
    OAuthGoogleRequest,
    VerifyEmailRequest,
)
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
from services.roles import is_host_role, resolve_registration_role

router = APIRouter(prefix="/api/auth", tags=["auth"])

PHONE_PLACEHOLDER = "0000000000"


def _needs_phone(user: dict) -> bool:
    return user.get("phone") == PHONE_PLACEHOLDER


def _auth_payload(user: dict) -> dict:
    token = create_access_token(subject=str(user["_id"]), role=user["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserPublic.from_mongo(user),
        "needs_phone": _needs_phone(user),
    }


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
async def register(
    payload: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    users = db["users"]

    existing = await users.find_one({"email": payload.email.strip().lower()})
    if existing:
        raise HTTPException(
            status_code=422, detail={"email": "Email already registered"}
        )

    email = payload.email.strip().lower()

    referral_code = await generate_unique_referral_code()

    referred_by_user = None
    if payload.referred_by:
        referred_by_user = await users.find_one({"referral_code": payload.referred_by})
        if not referred_by_user:
            raise HTTPException(
                status_code=422, detail={"referred_by": "Invalid referral code"}
            )

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

    async def _register_txn(session):
        try:
            res = await users.insert_one(doc, session=session)
        except DuplicateKeyError as exc:
            key = getattr(exc, "details", {}).get("keyPattern", {})
            if "email" in key:
                raise HTTPException(
                    status_code=422, detail={"email": "Email already registered"}
                ) from exc
            raise
        if referred_by_user:
            await users.update_one(
                {"_id": referred_by_user["_id"]},
                {"$inc": {"referral_credits": 200.0}},
                session=session,
            )
            await users.update_one(
                {"_id": res.inserted_id},
                {"$inc": {"referral_credits": 100.0}},
                session=session,
            )
        return res.inserted_id

    inserted_id = None
    for attempt in range(5):
        if attempt > 0:
            doc["referral_code"] = await generate_unique_referral_code()
        try:
            inserted_id = await database.run_transaction(_register_txn)
            break
        except HTTPException:
            raise
        except DuplicateKeyError:
            if attempt == 4:
                raise HTTPException(
                    status_code=500, detail="Registration failed, please retry"
                ) from None
            continue

    if inserted_id is None:
        raise HTTPException(status_code=500, detail="Registration failed, please retry")

    user = await users.find_one({"_id": inserted_id})
    token = create_access_token(subject=str(user["_id"]), role=user["role"])

    await send_template_email(
        to=user["email"],
        subject="Welcome to StayEase",
        template_name="welcome.html",
        context={"user": serialize_doc(user)},
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserPublic.from_mongo(user),
    }


@router.post("/login")
async def login(
    payload: LoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    users = db["users"]
    email = payload.email.strip().lower()
    user = await users.find_one({"email": email})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    token = create_access_token(subject=str(user["_id"]), role=user["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserPublic.from_mongo(user),
    }


@router.post("/forgot-password")
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    users = db["users"]
    email = payload.email.strip().lower()
    user = await users.find_one({"email": email})
    if user:
        await send_template_email(
            to=email,
            subject="Reset your StayEase password",
            template_name="welcome.html",
            context={"user": user, "otp": _generate_otp()},
        )
    return {
        "message": "If an account exists for this email, password reset instructions have been sent.",
    }


@router.post("/oauth/google")
async def oauth_google(
    payload: OAuthGoogleRequest,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    users = db["users"]
    email = payload.email.strip().lower()
    user = await users.find_one({"email": email})
    if user:
        return _auth_payload(user)

    referral_code = await generate_unique_referral_code()
    referred_by_user = None
    if payload.referred_by:
        referred_by_user = await users.find_one({"referral_code": payload.referred_by})

    role = resolve_registration_role(email=email, as_host=payload.as_host)
    random_password = f"{secrets.token_urlsafe(12)}A1!"

    doc = {
        "name": payload.name.strip(),
        "email": email,
        "phone": PHONE_PLACEHOLDER,
        "password_hash": hash_password(random_password),
        "role": role,
        "avatar_url": None,
        "about_me": None,
        "identity_proof": None,
        "email_verified": True,
        "email_otp": None,
        "email_otp_expires": None,
        "referral_code": referral_code,
        "referred_by": str(referred_by_user["_id"]) if referred_by_user else None,
        "referral_credits": 0.0,
        "wishlist": [],
        "notification_prefs": {"email": True, "whatsapp": False},
        "date_of_birth": None,
        "onboarding_completed": False,
        "oauth_provider": "google",
        "created_at": utc_now(),
    }

    try:
        res = await users.insert_one(doc)
    except DuplicateKeyError:
        user = await users.find_one({"email": email})
        if not user:
            raise HTTPException(
                status_code=500, detail="OAuth sign-in failed"
            ) from None
        return _auth_payload(user)

    if referred_by_user:
        await users.update_one(
            {"_id": referred_by_user["_id"]},
            {"$inc": {"referral_credits": 200.0}},
        )

    user = await users.find_one({"_id": res.inserted_id})
    return _auth_payload(user)


@router.patch("/complete-profile")
async def complete_profile(
    payload: CompleteProfileRequest,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    users = db["users"]
    if not _needs_phone(user) and user.get("onboarding_completed"):
        raise HTTPException(
            status_code=400, detail={"profile": "Profile is already complete"}
        )

    await users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "name": payload.name.strip(),
                "phone": payload.phone,
                "date_of_birth": payload.date_of_birth,
                "onboarding_completed": True,
            }
        },
    )
    updated = await users.find_one({"_id": user["_id"]})
    return {"user": UserPublic.from_mongo(updated), "needs_phone": False}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return UserPublic.from_mongo(user)


@router.post("/become-host")
async def become_host(
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Upgrade a guest account to host so they can use both portals without re-registering."""
    if is_host_role(user.get("role")):
        return _auth_payload(user)

    await db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {"role": "host"}},
    )
    updated = await db["users"].find_one({"_id": user["_id"]})
    return _auth_payload(updated)


@router.patch("/profile")
async def update_profile(
    name: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    about_me: Optional[str] = Form(None),
    notification_prefs: Optional[str] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    updates: dict = {}

    if name is not None:
        updates["name"] = name
    if phone is not None:
        import re

        if not re.fullmatch(r"\d{10}", phone):
            raise HTTPException(
                status_code=422,
                detail={"phone": "Phone must be a 10-digit India mobile number"},
            )
        updates["phone"] = phone
    if about_me is not None:
        updates["about_me"] = about_me
    if notification_prefs is not None:
        try:
            prefs_data = json.loads(notification_prefs)
            prefs = NotificationPrefs.model_validate(prefs_data)
            updates["notification_prefs"] = prefs.model_dump()
        except (json.JSONDecodeError, ValueError) as e:
            raise HTTPException(
                status_code=422,
                detail={"notification_prefs": "Invalid notification preferences"},
            ) from e

    if avatar is not None and avatar.filename:
        uploaded = await upload_image(avatar)
        updates["avatar_url"] = uploaded["url"]

    if not updates:
        return UserPublic.from_mongo(user)

    await db["users"].update_one({"_id": user["_id"]}, {"$set": updates})
    updated = await db["users"].find_one({"_id": user["_id"]})
    return UserPublic.from_mongo(updated)


@router.post("/verify-identity")
async def verify_identity(
    id_type: str = Form(...),
    id_number: str = Form(...),
    document: UploadFile = File(...),
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    if id_type not in ("aadhar", "pan", "passport"):
        raise HTTPException(
            status_code=422, detail={"id_type": "Invalid identity type"}
        )

    uploaded = await upload_image(document)
    try:
        identity = IdentityProof(
            type=id_type, number=id_number, document_url=uploaded["url"], verified=False
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail={"id_number": str(e)}) from e

    proof = identity.model_dump()
    await db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {"identity_proof": proof}},
    )
    return {
        "message": "Identity document submitted for verification",
        "identity_proof": proof,
    }


@router.post("/verify-email")
async def verify_email(
    payload: VerifyEmailRequest,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    if user.get("email_verified"):
        return {"message": "Email already verified"}

    stored_otp = user.get("email_otp")
    expires = user.get("email_otp_expires")
    if not stored_otp or not expires:
        raise HTTPException(
            status_code=422, detail={"otp": "No OTP requested. Use resend-otp first."}
        )
    if utc_now() > expires:
        raise HTTPException(
            status_code=422, detail={"otp": "OTP expired. Request a new one."}
        )
    if payload.otp != stored_otp:
        raise HTTPException(status_code=422, detail={"otp": "Invalid OTP"})

    await db["users"].update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "email_verified": True,
                "email_otp": None,
                "email_otp_expires": None,
            }
        },
    )
    return {"message": "Email verified successfully"}


@router.post("/resend-otp")
async def resend_otp(
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    if user.get("email_verified"):
        return {"message": "Email already verified"}

    otp = _generate_otp()
    expires = utc_now() + timedelta(minutes=10)
    await db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {"email_otp": otp, "email_otp_expires": expires}},
    )
    await _send_otp_email(user, otp)
    return {"message": "OTP sent to your email", "mock_otp": otp}
