from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class VerifyEmailRequest(BaseModel):
    otp: str = Field(min_length=6, max_length=6)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class OAuthGoogleRequest(BaseModel):
    email: EmailStr
    name: str = Field(min_length=2, max_length=80)
    as_host: bool = False
    referred_by: Optional[str] = None


class CompleteProfileRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    phone: str
    date_of_birth: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        import re

        if not re.fullmatch(r"\d{10}", v):
            raise ValueError("Phone must be a 10-digit India mobile number")
        if v == "0000000000":
            raise ValueError("Enter a valid phone number")
        return v

    @field_validator("date_of_birth")
    @classmethod
    def validate_date_of_birth(cls, v: str) -> str:
        import re

        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
            raise ValueError("Date of birth must be YYYY-MM-DD")
        return v


class RoomRecommendRequest(BaseModel):
    food_preference: str | None = None
    smoking_policy: str | None = None
    alcohol_policy: str | None = None
    view_type: str | None = None
    room_category: str | None = None
    max_price: float | None = None
    balcony: bool | None = None
    city: str | None = None
