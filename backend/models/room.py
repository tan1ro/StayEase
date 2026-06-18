from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

from .common import MongoModel, utc_now


RoomCategory = Literal["Single", "Double", "Triple", "Suite", "Villa", "Homestay", "Dormitory"]
FoodPreference = Literal["veg", "nonveg", "both"]
SmokingPolicy = Literal["smoking", "non_smoking"]
AlcoholPolicy = Literal["alcohol", "non_alcohol"]
ViewType = Literal[
    "hill_view",
    "beach_view",
    "garden_view",
    "sea_view",
    "city_view",
    "pool_view",
    "none",
]
FacingSide = Literal[
    "north",
    "south",
    "east",
    "west",
    "north_east",
    "north_west",
    "south_east",
    "south_west",
    "none",
]

class Photo(BaseModel):
    url: str
    public_id: str
    is_primary: bool = False


class Video(BaseModel):
    url: str
    public_id: str


class Location(BaseModel):
    city: str
    area: str
    lat: float
    lng: float
    address: str
    state: Optional[str] = None
    pincode: Optional[str] = None


class Policies(BaseModel):
    check_in_time: str
    check_out_time: str
    cancellation: Literal["flexible", "moderate", "strict"]
    pet_allowed: bool = False
    smoking_allowed: bool = False
    alcohol_allowed: bool = False


class ArrivalGuide(BaseModel):
    check_in_end_time: Optional[str] = None
    directions: Optional[str] = None
    check_in_method: Optional[str] = None
    wifi_network: Optional[str] = None
    wifi_password: Optional[str] = None
    house_manual: Optional[str] = None
    checkout_instructions: Optional[str] = None
    guidebook: Optional[str] = None
    interaction_preferences: Optional[str] = None


class RoomCreate(BaseModel):
    room_number: str
    title: str = Field(min_length=5, max_length=120)
    description: str = Field(min_length=50, max_length=5000)
    room_category: RoomCategory
    bed_configuration: str
    price_per_night: float = Field(gt=0)
    amenities: list[str] = Field(default_factory=list)
    is_available: bool = True
    max_guests: int = Field(ge=1, le=10)
    location: Location

    food_preference: FoodPreference
    smoking_policy: SmokingPolicy
    alcohol_policy: AlcoholPolicy
    view_type: ViewType = "none"
    has_balcony: bool = False
    facing_side: FacingSide = "none"
    floor_label: Optional[str] = Field(default=None, max_length=40)
    floor_number: Optional[int] = Field(default=None, ge=0, le=200)
    view_description: Optional[str] = Field(default=None, max_length=300)

    policies: Policies
    arrival_guide: ArrivalGuide = Field(default_factory=ArrivalGuide)

    @field_validator("room_number")
    @classmethod
    def room_number_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Room number is required")
        return v


class RoomUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=5, max_length=120)
    description: Optional[str] = Field(default=None, min_length=50, max_length=5000)
    room_category: Optional[RoomCategory] = None
    bed_configuration: Optional[str] = None
    price_per_night: Optional[float] = Field(default=None, gt=0)
    amenities: Optional[list[str]] = None
    is_available: Optional[bool] = None
    max_guests: Optional[int] = Field(default=None, ge=1, le=10)
    location: Optional[Location] = None
    food_preference: Optional[FoodPreference] = None
    smoking_policy: Optional[SmokingPolicy] = None
    alcohol_policy: Optional[AlcoholPolicy] = None
    view_type: Optional[ViewType] = None
    has_balcony: Optional[bool] = None
    facing_side: Optional[FacingSide] = None
    floor_label: Optional[str] = Field(default=None, max_length=40)
    floor_number: Optional[int] = Field(default=None, ge=0, le=200)
    view_description: Optional[str] = Field(default=None, max_length=300)
    policies: Optional[Policies] = None
    arrival_guide: Optional[ArrivalGuide] = None
    blocked_dates: Optional[list[str]] = None


class RoomInDB(MongoModel):
    host_id: str
    room_number: str
    title: str
    description: str
    room_category: RoomCategory
    bed_configuration: str
    price_per_night: float
    amenities: list[str] = Field(default_factory=list)
    is_available: bool = True
    max_guests: int
    location: Location
    photos: list[Photo] = Field(default_factory=list)
    videos: list[Video] = Field(default_factory=list)
    avg_rating: float = 0.0
    total_reviews: int = 0
    food_preference: FoodPreference
    smoking_policy: SmokingPolicy
    alcohol_policy: AlcoholPolicy
    view_type: ViewType = "none"
    has_balcony: bool = False
    facing_side: FacingSide = "none"
    floor_label: Optional[str] = None
    floor_number: Optional[int] = None
    view_description: Optional[str] = None
    policies: Policies
    arrival_guide: ArrivalGuide = Field(default_factory=ArrivalGuide)
    blocked_dates: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=utc_now)

