from __future__ import annotations

from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

from .common import MongoModel, utc_now
from .user import IdentityProof


PaymentStatus = Literal["pending", "paid", "refunded"]
BookingStatus = Literal["confirmed", "cancelled", "completed"]
BookingFor = Literal["self", "other"]


class PriceLineItem(BaseModel):
    label: str
    amount: float
    type: str


class BookingIdentityProof(BaseModel):
    type: Literal["aadhar", "pan", "passport"]
    number: str
    document_url: str

    @field_validator("number")
    @classmethod
    def validate_number(cls, v: str, info):
        return IdentityProof.validate_identity_number(v, info)


class CheckInVerification(BaseModel):
    booking_for: BookingFor
    check_in_note: str
    staying_guest_name: Optional[str] = None
    staying_guest_phone: Optional[str] = None
    guest_photo_url: Optional[str] = None
    identity_proof: Optional[BookingIdentityProof] = None


class BookingCreate(BaseModel):
    room_id: str
    check_in_date: date
    check_out_date: date
    num_guests: int = Field(ge=1, le=10)
    offer_code: Optional[str] = None
    booking_for: BookingFor = "self"
    staying_guest_name: Optional[str] = Field(None, max_length=80)
    staying_guest_phone: Optional[str] = None
    guest_photo_url: Optional[str] = None
    identity_proof: Optional[BookingIdentityProof] = None
    host_message: Optional[str] = Field(None, max_length=500)
    preferred_room_number: Optional[str] = Field(None, max_length=20)
    room_preference_notes: Optional[str] = Field(None, max_length=300)


class BookingInDB(MongoModel):
    room_id: str
    guest_id: str
    host_id: str
    guest_name: str
    booker_name: Optional[str] = None
    guest_phone: str
    guest_email: str
    check_in_date: str
    check_out_date: str
    total_nights: int
    num_guests: int
    base_price: float
    final_price_per_night: float
    price_breakdown: list[PriceLineItem] = Field(default_factory=list)
    subtotal: float
    guest_platform_fee: float = 0.0
    host_platform_fee: float = 0.0
    host_payout: float = 0.0
    gst_rate: float
    gst_amount: float
    total_price: float
    offer_code: Optional[str] = None
    discount_amount: float = 0.0
    payment_status: PaymentStatus = "pending"
    status: BookingStatus = "confirmed"
    invoice_url: Optional[str] = None
    booking_for: BookingFor = "self"
    check_in_verification: Optional[CheckInVerification] = None
    host_message: Optional[str] = None
    preferred_room_number: Optional[str] = None
    room_preference_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)
