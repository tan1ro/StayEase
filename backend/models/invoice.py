from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

from .common import MongoModel, utc_now


class InvoiceInDB(MongoModel):
    booking_id: str
    invoice_number: str
    guest_details: dict[str, Any]
    host_details: dict[str, Any]
    room_details: dict[str, Any]
    line_items: list[dict[str, Any]] = Field(default_factory=list)
    subtotal: float
    gst_breakdown: dict[str, Any]
    total: float
    pdf_url: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)
