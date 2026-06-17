from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

from .common import MongoModel, utc_now


WaitlistStatus = Literal["waiting", "notify", "expired"]


class WaitlistCreate(BaseModel):
    room_id: str
    guest_name: str
    guest_phone: str
    check_in_date: date
    check_out_date: date


class WaitlistInDB(MongoModel):
    room_id: str
    guest_id: str
    guest_name: str
    guest_phone: str
    check_in_date: str
    check_out_date: str
    status: WaitlistStatus = "waiting"
    created_at: datetime = Field(default_factory=utc_now)
