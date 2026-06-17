from __future__ import annotations

from pydantic import BaseModel, Field

from .common import MongoModel


class AttractionInDB(MongoModel):
    city: str
    name: str
    category: str
    distance_km: float
    description: str
    open_hours: str = Field(default="")
