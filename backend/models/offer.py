from __future__ import annotations

from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

from .common import MongoModel, utc_now


OfferType = Literal["percentage", "flat"]


class OfferCreate(BaseModel):
    code: str = Field(min_length=3, max_length=20)
    type: OfferType
    value: float = Field(gt=0)
    min_booking_amount: float = 0
    max_discount: Optional[float] = None
    valid_from: date
    valid_until: date
    usage_limit: int = Field(ge=1)
    applicable_rooms: list[str] = Field(default_factory=list)
    is_active: bool = True


class OfferInDB(MongoModel):
    host_id: Optional[str] = None
    code: str
    type: OfferType
    value: float
    min_booking_amount: float = 0
    max_discount: Optional[float] = None
    valid_from: str
    valid_until: str
    usage_limit: int
    used_count: int = 0
    applicable_rooms: list[str] = Field(default_factory=list)
    is_active: bool = True
    created_at: datetime = Field(default_factory=utc_now)
