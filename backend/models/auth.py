from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class VerifyEmailRequest(BaseModel):
    otp: str = Field(min_length=6, max_length=6)


class RoomRecommendRequest(BaseModel):
    food_preference: str | None = None
    smoking_policy: str | None = None
    alcohol_policy: str | None = None
    view_type: str | None = None
    room_category: str | None = None
    max_price: float | None = None
    balcony: bool | None = None
    city: str | None = None

