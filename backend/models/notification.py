from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from .common import MongoModel, utc_now


NotificationChannel = Literal["email", "whatsapp", "in-app"]


class NotificationInDB(MongoModel):
    user_id: str
    type: str
    title: str
    body: str
    channel: NotificationChannel
    sent_at: datetime = Field(default_factory=utc_now)
    read: bool = False
