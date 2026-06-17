from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from .common import MongoModel, utc_now


class ReviewCreate(BaseModel):
    booking_id: str
    rating: int = Field(ge=1, le=5)
    title: str = Field(min_length=3, max_length=120)
    body: str = Field(min_length=10, max_length=2000)
    would_recommend: bool = True
    photos: list[str] = Field(default_factory=list)


class ReviewInDB(MongoModel):
    booking_id: str
    room_id: str
    guest_id: str
    guest_name: str
    rating: int
    title: str
    body: str
    would_recommend: bool
    photos: list[str] = Field(default_factory=list)
    host_response: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)
