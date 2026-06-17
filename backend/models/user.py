from __future__ import annotations

import re
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from .common import MongoModel, serialize_doc, utc_now
from services.roles import normalize_role


Role = Literal["tourist", "host", "admin"]
IdentityType = Literal["aadhar", "pan", "passport"]


class NotificationPrefs(BaseModel):
    email: bool = True
    whatsapp: bool = False


class IdentityProof(BaseModel):
    type: IdentityType
    number: str
    document_url: str
    verified: bool = False

    @field_validator("number")
    @classmethod
    def validate_identity_number(cls, v: str, info):
        id_type = info.data.get("type")
        if id_type == "aadhar":
            if not re.fullmatch(r"\d{12}", v):
                raise ValueError("Aadhar must be 12 digits")
        elif id_type == "pan":
            if not re.fullmatch(r"[A-Z]{5}\d{4}[A-Z]{1}", v.upper()):
                raise ValueError("PAN must match AAAAA9999A")
            v = v.upper()
        elif id_type == "passport":
            if not re.fullmatch(r"[A-Za-z][A-Za-z0-9]{6,8}", v):
                raise ValueError("Passport must start with a letter")
        return v


class UserPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="_id")
    name: str
    email: EmailStr
    phone: str
    role: Role
    avatar_url: Optional[str] = None
    about_me: Optional[str] = None
    email_verified: bool = False
    referral_code: str
    referred_by: Optional[str] = None
    referral_credits: float = 0.0
    wishlist: list[str] = Field(default_factory=list)
    notification_prefs: NotificationPrefs = Field(default_factory=NotificationPrefs)
    onboarding_completed: bool = False
    identity_proof: Optional[IdentityProof] = None
    created_at: datetime

    @classmethod
    def from_mongo(cls, doc: dict) -> "UserPublic":
        data = serialize_doc(doc)
        data["role"] = normalize_role(data.get("role"))
        return cls.model_validate(data)


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    phone: str
    password: str
    role: Optional[Role] = None
    referred_by: Optional[str] = None  # referral code
    date_of_birth: Optional[str] = None

    @field_validator("role", mode="before")
    @classmethod
    def normalize_role_value(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return normalize_role(v)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not re.fullmatch(r"\d{10}", v):
            raise ValueError("Phone must be a 10-digit India mobile number")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must include an uppercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must include a number")
        if not re.search(r"[^\w\s]", v):
            raise ValueError("Password must include a special character")
        return v

    @field_validator("date_of_birth")
    @classmethod
    def validate_date_of_birth(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
            raise ValueError("Date of birth must be YYYY-MM-DD")
        return v


class UserInDB(MongoModel):
    name: str
    email: EmailStr
    phone: str
    password_hash: str
    role: Role
    avatar_url: Optional[str] = None
    about_me: Optional[str] = None
    identity_proof: Optional[IdentityProof] = None
    email_verified: bool = False
    referral_code: str
    referred_by: Optional[str] = None
    referral_credits: float = 0.0
    wishlist: list[str] = Field(default_factory=list)
    notification_prefs: NotificationPrefs = Field(default_factory=NotificationPrefs)
    date_of_birth: Optional[str] = None
    onboarding_completed: bool = False
    created_at: datetime = Field(default_factory=utc_now)

