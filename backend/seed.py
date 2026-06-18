"""Comprehensive database seeder for StayEase demo data."""

from __future__ import annotations

import asyncio
import random
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from typing import Any

from bson import ObjectId

from config import settings
from database import connect_db, disconnect_db, get_database
from models.common import utc_now
from services.auth import hash_password
from services.pricing import calculate_dynamic_pricing

TODAY = date(2026, 6, 18)
PASSWORD = "Password1!"
DOCUMENT_URL = "https://res.cloudinary.com/demo/image/upload/sample.jpg"

COLLECTIONS = [
    "users",
    "rooms",
    "bookings",
    "reviews",
    "offers",
    "attractions",
    "waitlist",
    "notifications",
    "referrals",
]

CITY_META: dict[str, dict[str, str]] = {
    "Bangalore": {"state": "Karnataka", "pincode": "560001"},
    "Mumbai": {"state": "Maharashtra", "pincode": "400001"},
    "North Goa": {"state": "Goa", "pincode": "403516"},
    "Coorg": {"state": "Karnataka", "pincode": "571201"},
    "Nandi Hills": {"state": "Karnataka", "pincode": "562103"},
}

CITY_AREAS: dict[str, dict[str, tuple[float, float]]] = {
    "Bangalore": {
        "MG Road": (12.9756, 77.6097),
        "Indiranagar": (12.9784, 77.6408),
        "Koramangala": (12.9352, 77.6245),
        "Whitefield": (12.9698, 77.7499),
        "Marathahalli": (12.9591, 77.6974),
        "HSR Layout": (12.9116, 77.6389),
        "Jayanagar": (12.9250, 77.5938),
        "JP Nagar": (12.9063, 77.5857),
        "Malleshwaram": (13.0035, 77.5710),
        "Rajajinagar": (12.9902, 77.5530),
        "Hebbal": (13.0352, 77.5970),
        "Yelahanka": (13.1004, 77.5963),
        "Electronic City": (12.8399, 77.6770),
        "Sarjapur": (12.9010, 77.7148),
        "Bellandur": (12.9256, 77.6760),
        "Bannerghatta": (12.8635, 77.5790),
        "Brigade Road": (12.9719, 77.6085),
        "Cunningham Road": (12.9933, 77.5940),
        "Richmond Town": (12.9637, 77.5987),
        "Sadashivanagar": (13.0082, 77.5780),
        "Dollars Colony": (12.9918, 77.5860),
        "Benson Town": (13.0012, 77.5990),
        "UB City": (12.9716, 77.5963),
    },
    "Mumbai": {
        "Colaba": (18.9067, 72.8147),
        "Bandra West": (19.0596, 72.8295),
        "Andheri West": (19.1364, 72.8296),
        "Powai": (19.1176, 72.9060),
        "Juhu": (19.1075, 72.8263),
    },
    "North Goa": {
        "Calangute": (15.5449, 73.7553),
        "Baga": (15.5558, 73.7515),
        "Anjuna": (15.5833, 73.7410),
        "Vagator": (15.6010, 73.7340),
        "Candolim": (15.5189, 73.7622),
    },
    "Coorg": {
        "Madikeri": (12.4244, 75.7382),
        "Kushalnagar": (12.4602, 75.9688),
        "Virajpet": (12.1964, 75.8051),
        "Gonikoppal": (12.1833, 75.9333),
    },
    "Nandi Hills": {
        "Nandi Hills": (13.3702, 77.6835),
        "Skandagiri": (13.4200, 77.6800),
    },
}

PHOTOS: dict[str, list[dict[str, Any]]] = {
    "Single": [
        {
            "url": "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
            "public_id": "seed-single-1",
            "is_primary": True,
        },
        {
            "url": "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800",
            "public_id": "seed-single-2",
            "is_primary": False,
        },
        {
            "url": "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800",
            "public_id": "seed-single-3",
            "is_primary": False,
        },
    ],
    "Double": [
        {
            "url": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
            "public_id": "seed-double-1",
            "is_primary": True,
        },
        {
            "url": "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
            "public_id": "seed-double-2",
            "is_primary": False,
        },
        {
            "url": "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800",
            "public_id": "seed-double-3",
            "is_primary": False,
        },
    ],
    "Triple": [
        {
            "url": "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800",
            "public_id": "seed-triple-1",
            "is_primary": True,
        },
        {
            "url": "https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=800",
            "public_id": "seed-triple-2",
            "is_primary": False,
        },
        {
            "url": "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
            "public_id": "seed-triple-3",
            "is_primary": False,
        },
    ],
    "Suite": [
        {
            "url": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800",
            "public_id": "seed-suite-1",
            "is_primary": True,
        },
        {
            "url": "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
            "public_id": "seed-suite-2",
            "is_primary": False,
        },
        {
            "url": "https://images.unsplash.com/photo-1609766857196-bc8eda90d9c8?w=800",
            "public_id": "seed-suite-3",
            "is_primary": False,
        },
    ],
    "Villa": [
        {
            "url": "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800",
            "public_id": "seed-villa-1",
            "is_primary": True,
        },
        {
            "url": "https://images.unsplash.com/photo-1615880484746-a134be9a6ecf?w=800",
            "public_id": "seed-villa-2",
            "is_primary": False,
        },
        {
            "url": "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800",
            "public_id": "seed-villa-3",
            "is_primary": False,
        },
    ],
    "Homestay": [
        {
            "url": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
            "public_id": "seed-homestay-1",
            "is_primary": True,
        },
        {
            "url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
            "public_id": "seed-homestay-2",
            "is_primary": False,
        },
        {
            "url": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
            "public_id": "seed-homestay-3",
            "is_primary": False,
        },
    ],
    "Dormitory": [
        {
            "url": "https://images.unsplash.com/photo-1555854877-0b3465818bcf?w=800",
            "public_id": "seed-dorm-1",
            "is_primary": True,
        },
        {
            "url": "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800",
            "public_id": "seed-dorm-2",
            "is_primary": False,
        },
        {
            "url": "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
            "public_id": "seed-dorm-3",
            "is_primary": False,
        },
    ],
}

AMENITIES: dict[str, list[str]] = {
    "Single": ["WiFi", "Hot Water", "TV"],
    "Single_mid": ["WiFi", "AC", "TV", "Hot Water", "CCTV"],
    "Single_premium": ["WiFi", "AC", "TV", "Parking", "Laundry"],
    "Double": ["WiFi", "AC", "Hot Water", "TV"],
    "Double_mid": ["WiFi", "AC", "TV", "Parking", "Iron"],
    "Double_premium": [
        "WiFi",
        "AC",
        "TV",
        "Parking",
        "Room Service",
        "Breakfast Included",
        "Hair Dryer",
        "Laundry",
    ],
    "Triple": [
        "WiFi",
        "AC",
        "TV",
        "Parking",
        "Kitchen",
        "Hot Water",
        "Iron",
        "Laundry",
    ],
    "Suite": [
        "WiFi",
        "AC",
        "TV",
        "Parking",
        "Minibar",
        "Room Service",
        "Breakfast Included",
        "Jacuzzi",
        "Hair Dryer",
        "Laundry",
        "CCTV",
        "Security Guard",
    ],
    "Villa": [
        "WiFi",
        "AC",
        "TV",
        "Parking",
        "Kitchen",
        "Pool",
        "Gym",
        "Jacuzzi",
        "Minibar",
        "Garden View",
        "Room Service",
        "Breakfast Included",
        "Airport Shuttle",
        "EV Charging",
        "CCTV",
        "Security Guard",
        "Laundry",
        "Hair Dryer",
    ],
    "Homestay": [
        "WiFi",
        "Kitchen",
        "Hot Water",
        "Parking",
        "TV",
        "Laundry",
        "Breakfast Included",
    ],
    "Dormitory": ["WiFi", "Hot Water", "Lockers", "Laundry", "CCTV", "Common Kitchen"],
}

VIEW_TYPES = ["city_view", "garden_view", "sea_view", "hill_view", "none"]
FOOD_PREFS = ["veg", "nonveg", "both"]
SMOKING_POLICIES = ["smoking", "non_smoking"]
ALCOHOL_POLICIES = ["alcohol", "non_alcohol"]
BALCONY_OPTS = [True, False]
FACING_SIDES = ["east", "west", "north", "south", "north_east", "south_west", "none"]

BED_CONFIG = {
    "Single": "single_bed",
    "Double": "double_bed",
    "Triple": "triple_bed",
    "Suite": "king",
    "Villa": "king",
    "Homestay": "queen",
    "Dormitory": "bunk_bed",
}

MAX_GUESTS = {
    "Single": 1,
    "Double": 2,
    "Triple": 3,
    "Suite": 4,
    "Villa": 8,
    "Homestay": 4,
    "Dormitory": 1,
}

HOST_ROOM_SPECS: dict[str, list[dict[str, str]]] = {
    "rajesh": [
        {
            "title": "Grand Single, MG Road Central",
            "area": "MG Road",
            "category": "Single",
        },
        {
            "title": "Executive Double, Indiranagar",
            "area": "Indiranagar",
            "category": "Double",
        },
        {
            "title": "Business Suite, Whitefield Tech Park",
            "area": "Whitefield",
            "category": "Suite",
        },
        {
            "title": "Premier Double with City View, Brigade Road",
            "area": "Brigade Road",
            "category": "Double",
        },
        {
            "title": "Deluxe Triple, Cunningham Road",
            "area": "Cunningham Road",
            "category": "Triple",
        },
        {
            "title": "Heritage Suite, Richmond Town",
            "area": "Richmond Town",
            "category": "Suite",
        },
        {
            "title": "Luxury Double, Sadashivanagar",
            "area": "Sadashivanagar",
            "category": "Double",
        },
        {
            "title": "Corporate Single, Dollars Colony",
            "area": "Dollars Colony",
            "category": "Single",
        },
        {
            "title": "Classic Double, Benson Town",
            "area": "Benson Town",
            "category": "Double",
        },
        {
            "title": "Panoramic Suite, Koramangala",
            "area": "Koramangala",
            "category": "Suite",
        },
        {"title": "Garden Double, Hebbal", "area": "Hebbal", "category": "Double"},
        {
            "title": "Premium Single, Malleshwaram",
            "area": "Malleshwaram",
            "category": "Single",
        },
    ],
    "sunshine": [
        {"title": "Cozy Double, Jayanagar", "area": "Jayanagar", "category": "Double"},
        {"title": "Family Triple, JP Nagar", "area": "JP Nagar", "category": "Triple"},
        {
            "title": "Studio Single, Bannerghatta Road",
            "area": "Bannerghatta",
            "category": "Single",
        },
        {
            "title": "Peaceful Double, Bellandur",
            "area": "Bellandur",
            "category": "Double",
        },
        {
            "title": "Modern Single, HSR Layout",
            "area": "HSR Layout",
            "category": "Single",
        },
        {
            "title": "Comfortable Double, Rajajinagar",
            "area": "Rajajinagar",
            "category": "Double",
        },
        {"title": "Economy Triple, Sarjapur", "area": "Sarjapur", "category": "Triple"},
        {
            "title": "Budget Double, Electronic City",
            "area": "Electronic City",
            "category": "Double",
        },
        {
            "title": "Heritage Homestay, Jayanagar",
            "area": "Jayanagar",
            "category": "Homestay",
        },
        {
            "title": "Family Homestay with Garden, HSR Layout",
            "area": "HSR Layout",
            "category": "Homestay",
        },
    ],
    "prestige": [
        {
            "title": "Presidential Suite, Koramangala",
            "area": "Koramangala",
            "category": "Suite",
        },
        {
            "title": "Penthouse Suite, Indiranagar",
            "area": "Indiranagar",
            "category": "Suite",
        },
        {
            "title": "Ultra Luxury Villa, UB City",
            "area": "UB City",
            "category": "Villa",
        },
        {
            "title": "Royal Suite, Sadashivanagar",
            "area": "Sadashivanagar",
            "category": "Suite",
        },
        {"title": "Ambassador Suite, MG Road", "area": "MG Road", "category": "Suite"},
        {
            "title": "Heritage Villa, Richmond Town",
            "area": "Richmond Town",
            "category": "Villa",
        },
        {"title": "Sky Suite, Whitefield", "area": "Whitefield", "category": "Suite"},
        {"title": "Grand Villa, Hebbal", "area": "Hebbal", "category": "Villa"},
    ],
    "budgethost": [
        {
            "title": "Economy Single, Electronic City",
            "area": "Electronic City",
            "category": "Single",
        },
        {
            "title": "Budget Double, Marathahalli",
            "area": "Marathahalli",
            "category": "Double",
        },
        {
            "title": "Affordable Single, Sarjapur",
            "area": "Sarjapur",
            "category": "Single",
        },
        {"title": "Value Double, Bellandur", "area": "Bellandur", "category": "Double"},
        {
            "title": "Starter Single, Yelahanka",
            "area": "Yelahanka",
            "category": "Single",
        },
        {"title": "Basic Double, Hebbal", "area": "Hebbal", "category": "Double"},
        {
            "title": "No-frills Single, HSR Layout",
            "area": "HSR Layout",
            "category": "Single",
        },
        {"title": "Simple Double, JP Nagar", "area": "JP Nagar", "category": "Double"},
        {
            "title": "Backpacker Dorm Bed, Electronic City",
            "area": "Electronic City",
            "category": "Dormitory",
        },
        {
            "title": "Shared Dorm, Marathahalli",
            "area": "Marathahalli",
            "category": "Dormitory",
        },
        {
            "title": "Budget Dorm Bed, Yelahanka",
            "area": "Yelahanka",
            "category": "Dormitory",
        },
    ],
    "villahost": [
        {
            "title": "Nandi Hills Villa with Pool",
            "area": "Nandi Hills",
            "city": "Nandi Hills",
            "category": "Villa",
        },
        {
            "title": "Sunrise Suite, Skandagiri",
            "area": "Skandagiri",
            "city": "Nandi Hills",
            "category": "Suite",
        },
        {
            "title": "Hilltop Homestay, Nandi Hills",
            "area": "Nandi Hills",
            "city": "Nandi Hills",
            "category": "Homestay",
        },
        {
            "title": "Misty View Double, Nandi Hills",
            "area": "Nandi Hills",
            "city": "Nandi Hills",
            "category": "Double",
        },
        {
            "title": "Sadashivanagar Heritage Villa",
            "area": "Sadashivanagar",
            "category": "Villa",
        },
        {
            "title": "Luxury Pool Villa, Dollars Colony",
            "area": "Dollars Colony",
            "category": "Villa",
        },
        {
            "title": "Garden Villa with Jacuzzi, Malleshwaram",
            "area": "Malleshwaram",
            "category": "Villa",
        },
        {
            "title": "Executive Villa Suite, Cunningham Road",
            "area": "Cunningham Road",
            "category": "Villa",
        },
        {
            "title": "Forest View Villa, Benson Town",
            "area": "Benson Town",
            "category": "Villa",
        },
    ],
    "goahost": [
        {
            "title": "Beachside Homestay, Calangute",
            "area": "Calangute",
            "city": "North Goa",
            "category": "Homestay",
        },
        {
            "title": "Portuguese Villa Homestay, Anjuna",
            "area": "Anjuna",
            "city": "North Goa",
            "category": "Homestay",
        },
        {
            "title": "Cozy Double near Baga Beach",
            "area": "Baga",
            "city": "North Goa",
            "category": "Double",
        },
        {
            "title": "Sea View Suite, Vagator",
            "area": "Vagator",
            "city": "North Goa",
            "category": "Suite",
        },
        {
            "title": "Pool Villa, Candolim",
            "area": "Candolim",
            "city": "North Goa",
            "category": "Villa",
        },
        {
            "title": "Backpacker Dorm, Calangute",
            "area": "Calangute",
            "city": "North Goa",
            "category": "Dormitory",
        },
    ],
    "mumbaihost": [
        {
            "title": "Colaba Heritage Homestay",
            "area": "Colaba",
            "city": "Mumbai",
            "category": "Homestay",
        },
        {
            "title": "Bandra West Studio Single",
            "area": "Bandra West",
            "city": "Mumbai",
            "category": "Single",
        },
        {
            "title": "Andheri Business Double",
            "area": "Andheri West",
            "city": "Mumbai",
            "category": "Double",
        },
        {
            "title": "Powai Lake View Suite",
            "area": "Powai",
            "city": "Mumbai",
            "category": "Suite",
        },
        {
            "title": "Juhu Beach Backpacker Dorm",
            "area": "Juhu",
            "city": "Mumbai",
            "category": "Dormitory",
        },
        {
            "title": "Marine Drive Dorm Bed",
            "area": "Colaba",
            "city": "Mumbai",
            "category": "Dormitory",
        },
    ],
    "coorghost": [
        {
            "title": "Coffee Estate Homestay, Madikeri",
            "area": "Madikeri",
            "city": "Coorg",
            "category": "Homestay",
        },
        {
            "title": "Misty Hills Homestay, Kushalnagar",
            "area": "Kushalnagar",
            "city": "Coorg",
            "category": "Homestay",
        },
        {
            "title": "Plantation Villa, Virajpet",
            "area": "Virajpet",
            "city": "Coorg",
            "category": "Villa",
        },
        {
            "title": "Forest View Cottage, Gonikoppal",
            "area": "Gonikoppal",
            "city": "Coorg",
            "category": "Homestay",
        },
        {
            "title": "Hilltop Homestay, Madikeri",
            "area": "Madikeri",
            "city": "Coorg",
            "category": "Homestay",
        },
    ],
}

HOST_PRICE_RANGES: dict[str, tuple[float, float]] = {
    "budgethost": (800, 1800),
    "sunshine": (1800, 3500),
    "rajesh": (2500, 7500),
    "prestige": (6500, 15000),
    "villahost": (8000, 18000),
    "goahost": (1500, 4500),
    "mumbaihost": (900, 3500),
    "coorghost": (2000, 5500),
}

REVIEW_TEXTS: dict[str, list[str]] = {
    "nandeesh": [
        "Excellent property! The room was spacious and very clean. AC worked perfectly and the bed was super comfortable. Location is ideal — 5 min walk to metro. Definitely coming back!",
        "Great experience overall. Host was responsive and check-in was smooth. The balcony view of the city at night was beautiful. WiFi speed was impressive for work calls.",
        "Premium feel at a reasonable price. The jacuzzi was a nice touch. Breakfast was hot and fresh. Only minor issue was parking was slightly tight.",
    ],
    "priya": [
        "Loved it! Clean room, helpful host. Will return.",
        "Amazing stay yaar! Location is perfect.",
        "So peaceful and cozy. Exactly what I needed.",
        "Great value for money. Highly recommend!",
    ],
    "arjun": [
        "Good for business stay. Fast WiFi, quiet environment, professional service. Would book again for work trips.",
        "Decent property. Room service was prompt. Could improve breakfast options.",
        "Excellent for corporate stays. Meeting room access would have been a bonus.",
    ],
    "meera": [
        "4/5 — Room was clean and location excellent. Minus one star for slightly slow room service.",
        "Perfect for a weekend getaway. The garden view room was absolutely worth the price.",
        "Host responded to every query within minutes. That kind of hospitality is rare. Impressed!",
    ],
    "rahul": [
        "Good budget option. Got what I paid for.",
        "Value for money. Clean and basic. No complaints.",
        "Surprisingly good for the price. AC was cold. Hot water worked. What else do you need?",
    ],
}

HOST_RESPONSES: dict[str, str] = {
    "rajesh": "Thank you for choosing Rajesh Hotels! Your kind words mean a lot to us. We look forward to hosting you again.",
    "sunshine": "So glad you enjoyed your stay! Come back soon to Sunshine Stays!",
    "prestige": "We at Prestige Hospitality are delighted to have exceeded your expectations. It would be our pleasure to host you again.",
    "budgethost": "Thank you for the review! We always strive to provide the best value. Hope to see you again!",
    "villahost": "Thank you for staying at Villa Escapes! Your satisfaction is our priority. The villa awaits your return!",
    "goahost": "Obrigado! We're thrilled you enjoyed your Goa stay. See you again on the beach!",
    "mumbaihost": "Thank you for staying with Mumbai Metro Stays! Safe travels and see you soon.",
    "coorghost": "Thank you for visiting Coorg! The misty hills welcome you back anytime.",
}

RATING_POOL = [5] * 13 + [4] * 11 + [3] * 5 + [2] * 2 + [1] * 1

NOTIFICATION_TEMPLATES = [
    ("booking_confirmed", "Booking confirmed", "Your booking at {room} is confirmed!"),
    (
        "booking_reminder",
        "Check-in reminder",
        "Check-in reminder: 3 days to go for your stay at {room}!",
    ),
    (
        "offer_alert",
        "Special offer",
        "Use code SUMMER20 for 20% off your next booking.",
    ),
    (
        "review_request",
        "Leave a review",
        "How was your stay at {room}? Leave a review.",
    ),
    (
        "waitlist_notify",
        "Waitlist update",
        "Room {room} is now available for your dates!",
    ),
    ("referral_credit", "Referral reward", "You earned 200 referral credits!"),
    (
        "cancellation_alert",
        "Booking cancelled",
        "Your booking at {room} was cancelled successfully.",
    ),
]

UNAVAILABLE_INDICES = {2, 9, 16, 24, 33}


def _print_header() -> None:
    print("━" * 34)
    print("StayEase Database Seeder")
    print("━" * 34)


def _step(ok: bool, message: str) -> None:
    print(f"{'✓' if ok else '✗'} {message}")


def _cancellation_policy(price: float) -> str:
    if price < 2000:
        return "flexible"
    if price <= 6000:
        return "moderate"
    return "strict"


def _amenities_for(host_key: str, category: str, index: int) -> list[str]:
    if category == "Homestay":
        return AMENITIES["Homestay"]
    if category == "Dormitory":
        return AMENITIES["Dormitory"]
    if category == "Villa":
        return AMENITIES["Villa"]
    if category == "Suite":
        return AMENITIES["Suite"]
    if category == "Triple":
        return AMENITIES["Triple"]
    if category == "Double":
        if host_key in ("rajesh", "prestige"):
            return AMENITIES["Double_premium"]
        if host_key == "sunshine":
            return AMENITIES["Double_mid"]
        return AMENITIES["Double"]
    if host_key in ("rajesh", "prestige"):
        return AMENITIES["Single_premium"]
    if host_key == "sunshine":
        return AMENITIES["Single_mid"]
    return AMENITIES["Single"]


def _price_for(host_key: str, category: str, index: int) -> float:
    low, high = HOST_PRICE_RANGES[host_key]
    span = high - low
    category_offset = {
        "Single": 0.0,
        "Double": 0.25,
        "Triple": 0.45,
        "Suite": 0.65,
        "Villa": 0.85,
        "Homestay": 0.35,
        "Dormitory": 0.1,
    }
    base = low + span * category_offset.get(category, 0.3)
    jitter = (index % 5) * (span * 0.04)
    return round(min(high, base + jitter), 0)


def _combo(index: int) -> dict[str, Any]:
    return {
        "view_type": VIEW_TYPES[index % len(VIEW_TYPES)],
        "food_preference": FOOD_PREFS[(index // 2) % len(FOOD_PREFS)],
        "smoking_policy": SMOKING_POLICIES[(index // 3) % len(SMOKING_POLICIES)],
        "alcohol_policy": ALCOHOL_POLICIES[(index // 4) % len(ALCOHOL_POLICIES)],
        "has_balcony": BALCONY_OPTS[(index // 5) % len(BALCONY_OPTS)],
        "facing_side": FACING_SIDES[index % len(FACING_SIDES)],
    }


def _location(area: str, city: str = "Bangalore") -> dict[str, Any]:
    areas = CITY_AREAS.get(city, CITY_AREAS["Bangalore"])
    lat, lng = areas.get(area, next(iter(areas.values())))
    meta = CITY_META.get(city, CITY_META["Bangalore"])
    return {
        "city": city,
        "area": area,
        "lat": lat,
        "lng": lng,
        "address": f"{area}, {city}, {meta['state']}",
        "state": meta["state"],
        "pincode": meta["pincode"],
    }


def _build_users(pw_hash: str) -> list[dict[str, Any]]:
    return [
        {
            "email": "nandeesh@stayease.com",
            "name": "Nandeesh Kumar",
            "phone": "9876543210",
            "role": "tourist",
            "referral_code": "NAND200",
            "referral_credits": 600.0,
            "about_me": "Software engineer who loves exploring Bangalore",
            "notification_prefs": {"email": True, "whatsapp": True},
            "wishlist": [],
        },
        {
            "email": "priya@stayease.com",
            "name": "Priya Sharma",
            "phone": "9876543211",
            "role": "tourist",
            "referral_code": "PRIY100",
            "referral_credits": 200.0,
            "referred_by": None,
            "about_me": "Travel blogger and food enthusiast",
            "notification_prefs": {"email": True, "whatsapp": False},
        },
        {
            "email": "arjun@stayease.com",
            "name": "Arjun Mehta",
            "phone": "9845098450",
            "role": "tourist",
            "referral_code": "ARJN150",
            "referral_credits": 0.0,
            "about_me": "Business consultant, frequent traveller",
            "notification_prefs": {"email": True, "whatsapp": True},
        },
        {
            "email": "meera@stayease.com",
            "name": "Meera Nair",
            "phone": "9731234567",
            "role": "tourist",
            "referral_code": "MEER50",
            "referral_credits": 400.0,
            "about_me": "Doctor based in Koramangala. Weekend explorer.",
            "notification_prefs": {"email": False, "whatsapp": True},
        },
        {
            "email": "rahul@stayease.com",
            "name": "Rahul Verma",
            "phone": "9900112233",
            "role": "tourist",
            "referral_code": "RAHL75",
            "referral_credits": 0.0,
            "about_me": "Startup founder. Budget stays only.",
            "notification_prefs": {"email": True, "whatsapp": False},
        },
        {
            "email": "rajesh@stayease.com",
            "name": "Rajesh Hotels Pvt Ltd",
            "phone": "9845012345",
            "role": "host",
            "referral_code": "HOST500",
            "about_me": "Running premium hotels in Bangalore for 12 years",
            "identity_proof": {
                "type": "pan",
                "number": "ABCDE1234F",
                "document_url": DOCUMENT_URL,
                "verified": True,
            },
        },
        {
            "email": "sunshine@stayease.com",
            "name": "Sunshine Stays",
            "phone": "9845012346",
            "role": "host",
            "referral_code": "SUNSH300",
            "about_me": "Cozy stays in South Bangalore",
            "identity_proof": {
                "type": "aadhar",
                "number": "123412341234",
                "document_url": DOCUMENT_URL,
                "verified": True,
            },
        },
        {
            "email": "prestige@stayease.com",
            "name": "Prestige Hospitality",
            "phone": "9900998877",
            "role": "host",
            "referral_code": "PRST200",
            "about_me": "Luxury suites and villas across premium areas",
            "identity_proof": {
                "type": "pan",
                "number": "FGHIJ5678K",
                "document_url": DOCUMENT_URL,
                "verified": True,
            },
        },
        {
            "email": "budgethost@stayease.com",
            "name": "Budget Comfort Stays",
            "phone": "9988776655",
            "role": "host",
            "referral_code": "BUDG100",
            "about_me": "Affordable rooms for working professionals",
            "identity_proof": {
                "type": "aadhar",
                "number": "567856785678",
                "document_url": DOCUMENT_URL,
                "verified": False,
            },
        },
        {
            "email": "villahost@stayease.com",
            "name": "Villa Escapes Bangalore",
            "phone": "9123456789",
            "role": "host",
            "referral_code": "VILL400",
            "about_me": "Exclusive villas and suites near Nandi Hills",
            "identity_proof": {
                "type": "passport",
                "number": "P1234567",
                "document_url": DOCUMENT_URL,
                "verified": True,
            },
        },
        {
            "email": "goahost@stayease.com",
            "name": "Goa Beach Homestays",
            "phone": "9822012345",
            "role": "host",
            "referral_code": "GOAH300",
            "about_me": "Beach homestays and villas across North Goa",
            "identity_proof": {
                "type": "aadhar",
                "number": "901290129012",
                "document_url": DOCUMENT_URL,
                "verified": True,
            },
        },
        {
            "email": "mumbaihost@stayease.com",
            "name": "Mumbai Metro Stays",
            "phone": "9820098200",
            "role": "host",
            "referral_code": "MUMB250",
            "about_me": "City stays and backpacker dorms across Mumbai",
            "identity_proof": {
                "type": "pan",
                "number": "LMNOP9012Q",
                "document_url": DOCUMENT_URL,
                "verified": True,
            },
        },
        {
            "email": "coorghost@stayease.com",
            "name": "Coorg Estate Homestays",
            "phone": "9448012345",
            "role": "host",
            "referral_code": "COOR200",
            "about_me": "Coffee estate homestays and cottages in Coorg",
            "identity_proof": {
                "type": "aadhar",
                "number": "345634563456",
                "document_url": DOCUMENT_URL,
                "verified": True,
            },
        },
        {
            "email": "admin@stayease.com",
            "name": "StayEase Admin",
            "phone": "9000000000",
            "role": "admin",
            "referral_code": "ADMN999",
        },
    ]


def _build_offers(host_ids: dict[str, str]) -> list[dict[str, Any]]:
    return [
        {
            "host_id": None,
            "code": "WELCOME10",
            "type": "percentage",
            "value": 10.0,
            "min_booking_amount": 500.0,
            "max_discount": None,
            "valid_from": "2026-01-01",
            "valid_until": "2026-12-31",
            "usage_limit": 1000,
            "used_count": 234,
            "applicable_rooms": [],
            "is_active": True,
        },
        {
            "host_id": None,
            "code": "NEWUSER",
            "type": "flat",
            "value": 200.0,
            "min_booking_amount": 800.0,
            "max_discount": None,
            "valid_from": "2026-01-01",
            "valid_until": "2026-12-31",
            "usage_limit": 2000,
            "used_count": 567,
            "applicable_rooms": [],
            "is_active": True,
        },
        {
            "host_id": None,
            "code": "EXPIRED50",
            "type": "percentage",
            "value": 50.0,
            "min_booking_amount": 0.0,
            "max_discount": None,
            "valid_from": "2026-01-01",
            "valid_until": "2026-03-31",
            "usage_limit": 100,
            "used_count": 10,
            "applicable_rooms": [],
            "is_active": False,
        },
        {
            "host_id": host_ids["rajesh"],
            "code": "SUMMER20",
            "type": "percentage",
            "value": 20.0,
            "min_booking_amount": 1000.0,
            "max_discount": None,
            "valid_from": "2026-04-01",
            "valid_until": "2026-08-31",
            "usage_limit": 500,
            "used_count": 89,
            "applicable_rooms": [],
            "is_active": True,
        },
        {
            "host_id": host_ids["rajesh"],
            "code": "FLAT500",
            "type": "flat",
            "value": 500.0,
            "min_booking_amount": 3000.0,
            "max_discount": None,
            "valid_from": "2026-01-01",
            "valid_until": "2026-12-31",
            "usage_limit": 200,
            "used_count": 45,
            "applicable_rooms": [],
            "is_active": True,
        },
        {
            "host_id": host_ids["prestige"],
            "code": "SUITE15",
            "type": "percentage",
            "value": 15.0,
            "min_booking_amount": 5000.0,
            "max_discount": None,
            "valid_from": "2026-01-01",
            "valid_until": "2026-12-31",
            "usage_limit": 100,
            "used_count": 12,
            "applicable_rooms": [],
            "is_active": True,
        },
        {
            "host_id": host_ids["villahost"],
            "code": "VILLA25",
            "type": "percentage",
            "value": 25.0,
            "min_booking_amount": 8000.0,
            "max_discount": None,
            "valid_from": "2026-06-01",
            "valid_until": "2026-12-31",
            "usage_limit": 50,
            "used_count": 3,
            "applicable_rooms": [],
            "is_active": True,
        },
        {
            "host_id": host_ids["budgethost"],
            "code": "BUDGET5",
            "type": "flat",
            "value": 100.0,
            "min_booking_amount": 800.0,
            "max_discount": None,
            "valid_from": "2026-01-01",
            "valid_until": "2026-12-31",
            "usage_limit": 500,
            "used_count": 78,
            "applicable_rooms": [],
            "is_active": True,
        },
    ]


def _build_attractions() -> list[dict[str, Any]]:
    by_city: dict[str, list[tuple[str, str, float, str, str]]] = {
        "Bangalore": [
            (
                "Food",
                "MTR Restaurant, Lalbagh Road",
                0.5,
                "Famous for authentic South Indian breakfast",
                "6:30 AM - 9:00 PM",
            ),
            (
                "Food",
                "Koshy's, St Marks Road",
                1.2,
                "Iconic Bangalore cafe since 1940",
                "9:00 AM - 11:00 PM",
            ),
            (
                "Food",
                "Truffles, Koramangala",
                2.1,
                "Best burgers in Bangalore",
                "11:00 AM - 11:30 PM",
            ),
            (
                "Food",
                "Vidyarthi Bhavan, Gandhi Bazaar",
                3.4,
                "Legendary masala dosa since 1943",
                "6:30 AM - 11:30 AM",
            ),
            (
                "Food",
                "Corner House Ice Cream",
                0.8,
                "Bangalore most loved ice cream",
                "11:00 AM - 11:00 PM",
            ),
            (
                "Food",
                "Empire Restaurant, Church Street",
                1.5,
                "Famous for biryani and kebabs",
                "12:00 PM - 12:00 AM",
            ),
            (
                "Food",
                "Brahmin's Coffee Bar, Basavanagudi",
                2.8,
                "Classic filter coffee and idli-vada",
                "7:00 AM - 11:30 AM",
            ),
            (
                "Food",
                "The Only Place, Museum Road",
                1.1,
                "Oldest continental restaurant in Bangalore",
                "12:00 PM - 11:00 PM",
            ),
            (
                "Temples",
                "ISKCON Temple, Rajajinagar",
                4.2,
                "Magnificent Krishna temple",
                "4:15 AM - 8:30 PM",
            ),
            (
                "Temples",
                "Bull Temple, Basavanagudi",
                3.1,
                "400-year-old Nandi temple",
                "6:00 AM - 8:30 PM",
            ),
            (
                "Temples",
                "Dodda Ganesha Temple",
                3.2,
                "Huge Ganesha idol",
                "6:00 AM - 8:00 PM",
            ),
            (
                "Temples",
                "Gavi Gangadhareshwara",
                3.8,
                "Cave temple, unique light phenomenon",
                "6:00 AM - 8:00 PM",
            ),
            (
                "Parks",
                "Cubbon Park, CBD",
                1.8,
                "300-acre green lung of Bangalore",
                "6:00 AM - 6:00 PM",
            ),
            (
                "Parks",
                "Lalbagh Botanical Garden",
                2.5,
                "Oldest botanical garden 250+ acres",
                "6:00 AM - 7:00 PM",
            ),
            (
                "Parks",
                "Ulsoor Lake",
                2.2,
                "Serene lake for morning walks",
                "5:00 AM - 8:00 PM",
            ),
            (
                "Parks",
                "Bannerghatta National Park",
                22.0,
                "Wildlife safari with tigers and lions",
                "9:30 AM - 5:00 PM",
            ),
            (
                "Parks",
                "Sankey Tank, Malleshwaram",
                3.5,
                "Peaceful lake garden",
                "5:00 AM - 8:00 PM",
            ),
            (
                "Shopping",
                "UB City Mall",
                1.5,
                "Luxury brands and fine dining",
                "10:00 AM - 11:00 PM",
            ),
            (
                "Shopping",
                "Phoenix MarketCity, Whitefield",
                12.0,
                "Largest mall in Bangalore",
                "10:00 AM - 11:00 PM",
            ),
            (
                "Shopping",
                "Commercial Street",
                2.1,
                "Best street shopping in Bangalore",
                "10:00 AM - 9:00 PM",
            ),
            (
                "Shopping",
                "Brigade Road",
                1.8,
                "Popular shopping and cafes",
                "10:00 AM - 10:00 PM",
            ),
            (
                "Shopping",
                "Chickpet",
                4.5,
                "Wholesale fabrics and jewellery",
                "9:00 AM - 8:00 PM",
            ),
            (
                "Transport",
                "Kempegowda Airport",
                34.0,
                "International airport serving Bangalore",
                "24 hours",
            ),
            (
                "Transport",
                "MG Road Metro",
                0.3,
                "Namma Metro purple line station",
                "5:00 AM - 11:00 PM",
            ),
            (
                "Transport",
                "KSR Railway Station",
                5.2,
                "Main railway terminal for Bangalore",
                "24 hours",
            ),
            (
                "Transport",
                "Majestic Bus Stand",
                5.5,
                "Central interstate bus terminal",
                "24 hours",
            ),
            (
                "Hospital",
                "Manipal Hospital",
                3.2,
                "Multi-speciality hospital",
                "24 hours",
            ),
            (
                "Hospital",
                "Apollo Hospital",
                8.5,
                "Leading private hospital chain",
                "24 hours",
            ),
            (
                "Hospital",
                "Fortis Hospital",
                2.1,
                "Emergency and speciality care",
                "24 hours",
            ),
        ],
        "Mumbai": [
            (
                "Landmarks",
                "Gateway of India",
                1.2,
                "Iconic arch monument on the waterfront",
                "24 hours",
            ),
            (
                "Landmarks",
                "Marine Drive",
                2.5,
                "Scenic 3 km promenade along the Arabian Sea",
                "24 hours",
            ),
            (
                "Food",
                "Leopold Cafe, Colaba",
                0.8,
                "Historic cafe famous since 1871",
                "7:30 AM - 12:00 AM",
            ),
            (
                "Food",
                "Bademiya, Colaba",
                1.0,
                "Legendary late-night kebabs and rolls",
                "7:00 PM - 4:00 AM",
            ),
            (
                "Food",
                "Britannia & Co., Fort",
                3.5,
                "Parsi berry pulao and dhansak since 1923",
                "11:00 AM - 4:00 PM",
            ),
            (
                "Shopping",
                "Colaba Causeway",
                1.5,
                "Street shopping for clothes and souvenirs",
                "10:00 AM - 9:00 PM",
            ),
            (
                "Shopping",
                "Crawford Market",
                4.0,
                "Historic wholesale market for spices and produce",
                "10:00 AM - 8:00 PM",
            ),
            (
                "Parks",
                "Hanging Gardens",
                5.0,
                "Terraced gardens with city skyline views",
                "5:00 AM - 9:00 PM",
            ),
            (
                "Temples",
                "Siddhivinayak Temple",
                12.0,
                "Famous Ganesha temple in Prabhadevi",
                "5:30 AM - 10:00 PM",
            ),
            (
                "Transport",
                "Chhatrapati Shivaji Terminus",
                4.5,
                "UNESCO World Heritage railway station",
                "24 hours",
            ),
            (
                "Transport",
                "Mumbai Airport",
                8.0,
                "Chhatrapati Shivaji International Airport",
                "24 hours",
            ),
            (
                "Hospital",
                "Tata Memorial Hospital",
                6.0,
                "Leading cancer care centre",
                "24 hours",
            ),
        ],
        "North Goa": [
            (
                "Beaches",
                "Calangute Beach",
                0.5,
                "Queen of Beaches — popular water sports hub",
                "24 hours",
            ),
            (
                "Beaches",
                "Baga Beach",
                1.2,
                "Lively beach with shacks and nightlife",
                "24 hours",
            ),
            (
                "Beaches",
                "Anjuna Beach",
                2.0,
                "Famous flea market and cliff views",
                "24 hours",
            ),
            (
                "Beaches",
                "Vagator Beach",
                2.5,
                "Red cliffs and Chapora Fort views",
                "24 hours",
            ),
            (
                "Food",
                "Britto's, Baga",
                1.5,
                "Beach shack serving Goan seafood",
                "11:00 AM - 11:00 PM",
            ),
            (
                "Food",
                "Fisherman's Wharf, Candolim",
                3.0,
                "Goan and coastal cuisine by the water",
                "12:00 PM - 11:00 PM",
            ),
            (
                "Landmarks",
                "Chapora Fort",
                3.5,
                "Historic fort with panoramic sea views",
                "9:30 AM - 5:30 PM",
            ),
            (
                "Landmarks",
                "Basilica of Bom Jesus, Old Goa",
                18.0,
                "UNESCO World Heritage church",
                "9:00 AM - 6:30 PM",
            ),
            (
                "Shopping",
                "Anjuna Flea Market",
                2.5,
                "Wednesday hippie market for crafts and clothes",
                "Wed 9:00 AM - 6:00 PM",
            ),
            (
                "Parks",
                "Salim Ali Bird Sanctuary",
                8.0,
                "Mangrove bird sanctuary on Chorao Island",
                "6:00 AM - 6:00 PM",
            ),
            (
                "Transport",
                "Goa Airport (Dabolim)",
                40.0,
                "Nearest international airport",
                "24 hours",
            ),
            (
                "Hospital",
                "Goa Medical College",
                15.0,
                "Government multi-speciality hospital",
                "24 hours",
            ),
        ],
        "Coorg": [
            (
                "Nature",
                "Abbey Falls",
                8.0,
                "Picturesque waterfall amid coffee plantations",
                "9:00 AM - 5:00 PM",
            ),
            (
                "Nature",
                "Raja's Seat",
                2.0,
                "Sunset viewpoint with misty valley panoramas",
                "5:30 AM - 8:00 PM",
            ),
            (
                "Nature",
                "Dubare Elephant Camp",
                15.0,
                "Elephant interaction and river rafting",
                "9:00 AM - 5:00 PM",
            ),
            (
                "Nature",
                "Talacauvery",
                45.0,
                "Origin of the Cauvery river at Brahmagiri hills",
                "6:00 AM - 6:00 PM",
            ),
            (
                "Food",
                "Coorg Cuisine, Madikeri",
                1.5,
                "Authentic pandi curry and kadumbuttu",
                "11:00 AM - 10:00 PM",
            ),
            (
                "Food",
                "Taste of Coorg, Kushalnagar",
                5.0,
                "Traditional Kodava meals",
                "12:00 PM - 9:00 PM",
            ),
            (
                "Temples",
                "Omkareshwara Temple",
                1.0,
                "Historic Shiva temple in Madikeri town",
                "6:30 AM - 8:00 PM",
            ),
            (
                "Temples",
                "Golden Temple (Namdroling)",
                6.0,
                "Tibetan Buddhist monastery in Bylakuppe",
                "7:00 AM - 6:00 PM",
            ),
            (
                "Shopping",
                "Madikeri Market",
                1.2,
                "Local spices, coffee, and honey",
                "8:00 AM - 8:00 PM",
            ),
            (
                "Parks",
                "Nagarhole National Park",
                35.0,
                "Tiger reserve and wildlife safari",
                "6:00 AM - 6:00 PM",
            ),
            (
                "Hospital",
                "Victoria Hospital, Madikeri",
                2.0,
                "District government hospital",
                "24 hours",
            ),
        ],
        "Nandi Hills": [
            (
                "Nature",
                "Nandi Hills Summit",
                1.0,
                "Sunrise viewpoint at 1,478 m elevation",
                "6:00 AM - 6:00 PM",
            ),
            (
                "Nature",
                "Tipu's Drop",
                1.5,
                "Historic cliff with valley views",
                "6:00 AM - 6:00 PM",
            ),
            (
                "Nature",
                "Amrita Sarovar Lake",
                0.8,
                "Serene perennial lake at the hilltop",
                "6:00 AM - 6:00 PM",
            ),
            (
                "Temples",
                "Bhoga Nandeeshwara Temple",
                3.0,
                "Ancient Shiva temple at the foothills",
                "6:00 AM - 8:00 PM",
            ),
            (
                "Nature",
                "Skandagiri Trek",
                5.0,
                "Popular night trek with sunrise views",
                "Guided treks",
            ),
            (
                "Food",
                "Mayura Pine Top, Nandi Hills",
                0.5,
                "KSTDC restaurant with hill views",
                "8:00 AM - 6:00 PM",
            ),
            (
                "Parks",
                "Nandi Hills Forest Trail",
                2.0,
                "Scenic walking trail through eucalyptus groves",
                "6:00 AM - 6:00 PM",
            ),
            (
                "Hospital",
                "Nandi Hills PHC",
                8.0,
                "Primary health centre at foothills",
                "9:00 AM - 5:00 PM",
            ),
        ],
    }
    docs: list[dict[str, Any]] = []
    for city, rows in by_city.items():
        for category, name, distance, description, hours in rows:
            docs.append(
                {
                    "city": city,
                    "name": name,
                    "category": category,
                    "distance_km": distance,
                    "description": description,
                    "open_hours": hours,
                }
            )
    return docs


class RoomSchedule:
    def __init__(self) -> None:
        self._ranges: dict[str, list[tuple[date, date]]] = defaultdict(list)

    def has_overlap(self, room_id: str, check_in: date, check_out: date) -> bool:
        for start, end in self._ranges[room_id]:
            if check_in < end and check_out > start:
                return True
        return False

    def reserve(self, room_id: str, check_in: date, check_out: date) -> None:
        self._ranges[room_id].append((check_in, check_out))

    def allocate(
        self,
        room_id: str,
        window_start: date,
        window_end: date,
        nights: int,
        rng: random.Random,
        attempts: int = 200,
    ) -> tuple[date, date]:
        for _ in range(attempts):
            max_offset = (window_end - window_start).days - nights
            if max_offset < 0:
                break
            offset = rng.randint(0, max_offset)
            check_in = window_start + timedelta(days=offset)
            check_out = check_in + timedelta(days=nights)
            if not self.has_overlap(room_id, check_in, check_out):
                self.reserve(room_id, check_in, check_out)
                return check_in, check_out
        raise RuntimeError(f"Could not allocate dates for room {room_id}")


def _pricing_for_booking(
    room: dict[str, Any],
    check_in: date,
    check_out: date,
    offer: dict[str, Any] | None,
    referral_credits: float = 0.0,
) -> dict[str, Any]:
    return calculate_dynamic_pricing(
        base_price=room["price_per_night"],
        check_in=check_in,
        check_out=check_out,
        offer=offer,
        referral_credits=referral_credits,
        view_type=room.get("view_type"),
        facing_side=room.get("facing_side"),
        room_category=room.get("room_category"),
    )


def _booking_doc(
    room: dict[str, Any],
    guest: dict[str, Any],
    check_in: date,
    check_out: date,
    *,
    status: str,
    payment_status: str,
    offer_code: str | None,
    offers_by_code: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    offer = offers_by_code.get(offer_code) if offer_code else None
    pricing = _pricing_for_booking(
        room,
        check_in,
        check_out,
        offer,
        referral_credits=float(guest.get("referral_credits", 0)) if offer_code else 0.0,
    )
    gst = pricing["gst_breakdown"]
    max_guests = room["max_guests"]
    num_guests = min(max_guests, max(1, (hash(room["_id"]) % max_guests) + 1))
    return {
        "room_id": room["_id"],
        "guest_id": guest["_id"],
        "host_id": room["host_id"],
        "guest_name": guest["name"],
        "booker_name": guest["name"],
        "guest_phone": guest["phone"],
        "guest_email": guest["email"],
        "check_in_date": check_in.isoformat(),
        "check_out_date": check_out.isoformat(),
        "total_nights": pricing["total_nights"],
        "num_guests": num_guests,
        "base_price": pricing["base_price"],
        "final_price_per_night": pricing["final_price_per_night"],
        "price_breakdown": pricing["price_breakdown"],
        "subtotal": pricing["subtotal"],
        "guest_platform_fee": pricing["guest_platform_fee"],
        "host_platform_fee": pricing["host_platform_fee"],
        "host_payout": pricing["host_payout"],
        "gst_rate": pricing["gst_rate"],
        "gst_amount": pricing["gst_amount"],
        "cgst_amount": gst["cgst_amount"],
        "sgst_amount": gst["sgst_amount"],
        "total_gst": gst["total_gst"],
        "total_price": pricing["total_price"],
        "offer_code": offer_code,
        "discount_amount": pricing["discount_amount"],
        "referral_credit_used": pricing.get("referral_credit_used", 0.0),
        "payment_status": payment_status,
        "status": status,
        "cancellation_policy": room["policies"]["cancellation"],
        "invoice_url": None,
        "booking_for": "self",
        "created_at": utc_now(),
    }


def _guest_key(email: str) -> str:
    return email.split("@")[0]


def _build_bookings(
    rooms: list[dict[str, Any]],
    guests: dict[str, dict[str, Any]],
    offers_by_code: dict[str, dict[str, Any]],
    rng: random.Random,
) -> list[dict[str, Any]]:
    schedule = RoomSchedule()
    bookings: list[dict[str, Any]] = []
    all_guest_emails = list(guests.keys())
    summer_guests = [
        "nandeesh@stayease.com",
        "arjun@stayease.com",
        "meera@stayease.com",
    ]
    pending_guests = [
        "priya@stayease.com",
        "rahul@stayease.com",
        "nandeesh@stayease.com",
    ]
    offer_codes = ["WELCOME10", "SUMMER20", "FLAT500"]
    offer_slots = set(rng.sample(range(80), 24))

    def pick_room(offset: int) -> dict[str, Any]:
        return rooms[(len(bookings) + offset) % len(rooms)]

    def maybe_offer() -> str | None:
        if len(bookings) in offer_slots:
            return rng.choice(offer_codes)
        return None

    def add_booking(
        room: dict[str, Any],
        guest_email: str,
        check_in: date,
        check_out: date,
        *,
        status: str,
        payment_status: str,
    ) -> None:
        bookings.append(
            _booking_doc(
                room,
                guests[guest_email],
                check_in,
                check_out,
                status=status,
                payment_status=payment_status,
                offer_code=maybe_offer(),
                offers_by_code=offers_by_code,
            )
        )

    for i in range(25):
        room = pick_room(i)
        nights = rng.randint(2, 4)
        ci, co = schedule.allocate(
            room["_id"], date(2026, 1, 1), date(2026, 4, 30), nights, rng
        )
        add_booking(
            room,
            all_guest_emails[i % len(all_guest_emails)],
            ci,
            co,
            status="completed",
            payment_status="paid",
        )

    for i in range(20):
        room = pick_room(i + 3)
        nights = rng.randint(2, 5)
        ci, co = schedule.allocate(
            room["_id"], date(2026, 5, 1), date(2026, 5, 31), nights, rng
        )
        add_booking(
            room,
            all_guest_emails[(i + 2) % len(all_guest_emails)],
            ci,
            co,
            status="completed",
            payment_status="paid",
        )

    for i in range(15):
        room = pick_room(i + 7)
        nights = rng.randint(2, 4)
        ci, co = schedule.allocate(
            room["_id"], date(2026, 6, 19), date(2026, 7, 31), nights, rng
        )
        add_booking(
            room,
            summer_guests[i % len(summer_guests)],
            ci,
            co,
            status="confirmed",
            payment_status="paid",
        )

    for i in range(10):
        room = pick_room(i + 11)
        nights = rng.randint(1, 3)
        ci, co = schedule.allocate(
            room["_id"],
            TODAY + timedelta(days=1),
            TODAY + timedelta(days=14),
            nights,
            rng,
        )
        add_booking(
            room,
            pending_guests[i % len(pending_guests)],
            ci,
            co,
            status="confirmed",
            payment_status="pending",
        )

    for i in range(7):
        room = pick_room(i + 17)
        nights = rng.randint(2, 4)
        month = rng.randint(1, 6)
        day = rng.randint(1, 28)
        check_in = date(2026, month, day)
        check_out = check_in + timedelta(days=nights)
        add_booking(
            room,
            all_guest_emails[i % len(all_guest_emails)],
            check_in,
            check_out,
            status="cancelled",
            payment_status="refunded" if i % 2 else "paid",
        )

    for i, guest_email in enumerate(summer_guests):
        room = pick_room(i + 21)
        nights = rng.randint(1, 3)
        check_in = TODAY
        check_out = check_in + timedelta(days=nights)
        attempts = 0
        while schedule.has_overlap(room["_id"], check_in, check_out):
            attempts += 1
            room = pick_room(i + 21 + attempts)
            if attempts > len(rooms):
                raise RuntimeError("Could not allocate today's demo bookings")
        schedule.reserve(room["_id"], check_in, check_out)
        add_booking(
            room,
            guest_email,
            check_in,
            check_out,
            status="confirmed",
            payment_status="paid",
        )

    return bookings


def _build_reviews(
    completed_bookings: list[dict[str, Any]],
    rooms_by_id: dict[str, dict[str, Any]],
    host_key_by_id: dict[str, str],
    rng: random.Random,
) -> list[dict[str, Any]]:
    pool = list(completed_bookings)
    rng.shuffle(pool)
    review_count = round(len(pool) * 0.7)
    selected = pool[:review_count]
    ratings = list(RATING_POOL[:review_count])
    rng.shuffle(ratings)
    reviews: list[dict[str, Any]] = []
    for booking, rating in zip(selected, ratings):
        guest_key = _guest_key(booking["guest_email"])
        texts = REVIEW_TEXTS.get(guest_key, REVIEW_TEXTS["nandeesh"])
        body = texts[len(reviews) % len(texts)]
        room = rooms_by_id[booking["room_id"]]
        host_key = host_key_by_id.get(room["host_id"], "rajesh")
        host_response = HOST_RESPONSES[host_key] if rng.random() < 0.4 else None
        reviews.append(
            {
                "booking_id": booking["booking_id"],
                "room_id": booking["room_id"],
                "guest_id": booking["guest_id"],
                "guest_name": booking["guest_name"],
                "rating": rating,
                "title": body[:60].split(".")[0] or "Great stay",
                "body": body,
                "would_recommend": rating >= 4,
                "photos": [],
                "host_response": host_response,
                "created_at": utc_now(),
            }
        )
    return reviews


def _build_notifications(
    users: list[dict[str, Any]], rooms: list[dict[str, Any]], rng: random.Random
) -> list[dict[str, Any]]:
    notifications: list[dict[str, Any]] = []
    channels = ["email", "whatsapp", "in-app"]
    sample_room = rooms[0]["title"] if rooms else "your room"
    for user in users:
        for i in range(10):
            ntype, title, body_tpl = NOTIFICATION_TEMPLATES[
                i % len(NOTIFICATION_TEMPLATES)
            ]
            days_ago = rng.randint(1, 180)
            sent_at = datetime.now(timezone.utc) - timedelta(days=days_ago)
            notifications.append(
                {
                    "user_id": user["_id"],
                    "type": ntype,
                    "title": title,
                    "body": body_tpl.format(room=sample_room),
                    "channel": channels[i % len(channels)],
                    "sent_at": sent_at,
                    "read": i < 5,
                }
            )
    return notifications


async def seed() -> None:
    random.seed(42)
    rng = random.Random(42)
    _print_header()

    counts: dict[str, int] = {}
    try:
        print(f"Connecting to MongoDB ({settings.MONGO_DB_NAME})...")
        await connect_db()
        db = get_database()

        for name in COLLECTIONS:
            await db[name].drop()
        _step(True, "Cleared existing data")

        pw_hash = hash_password(PASSWORD)
        user_docs = _build_users(pw_hash)
        users_coll = db["users"]
        inserted_users: list[dict[str, Any]] = []
        for spec in user_docs:
            doc = {
                **{k: v for k, v in spec.items() if k != "email"},
                "email": spec["email"],
                "password_hash": pw_hash,
                "avatar_url": None,
                "email_verified": True,
                "wishlist": spec.get("wishlist", []),
                "notification_prefs": spec.get(
                    "notification_prefs", {"email": True, "whatsapp": False}
                ),
                "onboarding_completed": True,
                "created_at": utc_now(),
            }
            if "referral_credits" not in doc:
                doc["referral_credits"] = 0.0
            if "about_me" not in doc:
                doc["about_me"] = None
            if "identity_proof" not in doc:
                doc["identity_proof"] = None
            result = await users_coll.insert_one(doc)
            doc["_id"] = str(result.inserted_id)
            inserted_users.append(doc)

        users_by_email = {u["email"]: u for u in inserted_users}
        nandeesh_id = users_by_email["nandeesh@stayease.com"]["_id"]
        await users_coll.update_one(
            {"_id": ObjectId(users_by_email["priya@stayease.com"]["_id"])},
            {"$set": {"referred_by": nandeesh_id}},
        )
        users_by_email["priya@stayease.com"]["referred_by"] = nandeesh_id

        host_ids = {
            "rajesh": users_by_email["rajesh@stayease.com"]["_id"],
            "sunshine": users_by_email["sunshine@stayease.com"]["_id"],
            "prestige": users_by_email["prestige@stayease.com"]["_id"],
            "budgethost": users_by_email["budgethost@stayease.com"]["_id"],
            "villahost": users_by_email["villahost@stayease.com"]["_id"],
            "goahost": users_by_email["goahost@stayease.com"]["_id"],
            "mumbaihost": users_by_email["mumbaihost@stayease.com"]["_id"],
            "coorghost": users_by_email["coorghost@stayease.com"]["_id"],
        }
        host_key_by_id = {v: k for k, v in host_ids.items()}
        counts["users"] = len(inserted_users)
        _step(True, f"Users:        {counts['users']} inserted")

        rooms_coll = db["rooms"]
        room_docs: list[dict[str, Any]] = []
        global_index = 0
        for host_key, specs in HOST_ROOM_SPECS.items():
            host_id = host_ids[host_key]
            for local_i, spec in enumerate(specs):
                category = spec["category"]
                city = spec.get("city", "Bangalore")
                combo = _combo(global_index)
                price = _price_for(host_key, category, local_i)
                policies = {
                    "check_in_time": "2:00 PM",
                    "check_out_time": "11:00 AM",
                    "cancellation": _cancellation_policy(price),
                    "pet_allowed": category in ("Villa", "Homestay"),
                    "smoking_allowed": combo["smoking_policy"] == "smoking",
                    "alcohol_allowed": combo["alcohol_policy"] == "alcohol",
                }
                description = (
                    f"A welcoming {category.lower()} stay in {spec['area']}, {city} with modern comforts, "
                    f"excellent connectivity, and thoughtful amenities for travellers."
                )
                doc = {
                    "host_id": host_id,
                    "room_number": f"{host_key[:3].upper()}{local_i + 1:02d}",
                    "title": spec["title"],
                    "description": description,
                    "room_category": category,
                    "bed_configuration": BED_CONFIG[category],
                    "price_per_night": price,
                    "amenities": _amenities_for(host_key, category, local_i),
                    "is_available": global_index not in UNAVAILABLE_INDICES,
                    "max_guests": MAX_GUESTS[category],
                    "location": _location(spec["area"], city),
                    "photos": PHOTOS.get(category, PHOTOS["Double"]),
                    "videos": [],
                    "avg_rating": round(3.8 + (global_index % 12) * 0.1, 1),
                    "total_reviews": 5 + (global_index * 7) % 145,
                    "food_preference": combo["food_preference"],
                    "smoking_policy": combo["smoking_policy"],
                    "alcohol_policy": combo["alcohol_policy"],
                    "view_type": combo["view_type"],
                    "has_balcony": combo["has_balcony"],
                    "facing_side": combo["facing_side"],
                    "view_description": f"Enjoy a {combo['view_type'].replace('_', ' ')} from this room.",
                    "policies": policies,
                    "arrival_guide": {},
                    "blocked_dates": [],
                    "created_at": utc_now(),
                }
                result = await rooms_coll.insert_one(doc)
                doc["_id"] = str(result.inserted_id)
                room_docs.append(doc)
                global_index += 1

        wishlist_ids = [room_docs[i]["_id"] for i in (0, 8, 16, 28)]
        await users_coll.update_one(
            {"_id": ObjectId(nandeesh_id)},
            {"$set": {"wishlist": wishlist_ids}},
        )
        counts["rooms"] = len(room_docs)
        _step(True, f"Rooms:        {counts['rooms']} inserted")

        offers_coll = db["offers"]
        offer_docs = _build_offers(host_ids)
        for offer in offer_docs:
            offer["created_at"] = utc_now()
            await offers_coll.insert_one(offer)
        offers_by_code = {o["code"]: o for o in offer_docs}
        counts["offers"] = len(offer_docs)
        _step(True, f"Offers:       {counts['offers']} inserted")

        bookings_coll = db["bookings"]
        guest_users = {
            email: users_by_email[email]
            for email in [
                "nandeesh@stayease.com",
                "priya@stayease.com",
                "arjun@stayease.com",
                "meera@stayease.com",
                "rahul@stayease.com",
            ]
        }
        booking_docs = _build_bookings(room_docs, guest_users, offers_by_code, rng)
        cancelled_bookings = [b for b in booking_docs if b["status"] == "cancelled"]
        for booking in booking_docs:
            result = await bookings_coll.insert_one(booking)
            booking["booking_id"] = str(result.inserted_id)
        counts["bookings"] = len(booking_docs)
        _step(True, f"Bookings:     {counts['bookings']} inserted")

        rooms_by_id = {r["_id"]: r for r in room_docs}
        completed_bookings = [b for b in booking_docs if b["status"] == "completed"]
        review_docs = _build_reviews(
            completed_bookings, rooms_by_id, host_key_by_id, rng
        )
        reviews_coll = db["reviews"]
        for review in review_docs:
            await reviews_coll.insert_one(review)
        counts["reviews"] = len(review_docs)
        _step(True, f"Reviews:      {counts['reviews']} inserted")

        attractions_coll = db["attractions"]
        attraction_docs = _build_attractions()
        for attraction in attraction_docs:
            await attractions_coll.insert_one(attraction)
        counts["attractions"] = len(attraction_docs)
        _step(True, f"Attractions:  {counts['attractions']} inserted")

        waitlist_coll = db["waitlist"]
        waitlist_guests = [
            users_by_email["nandeesh@stayease.com"],
            users_by_email["priya@stayease.com"],
            users_by_email["rahul@stayease.com"],
            users_by_email["nandeesh@stayease.com"],
            users_by_email["priya@stayease.com"],
        ]
        waitlist_statuses = ["notify", "notify", "notify", "waiting", "waiting"]
        waitlist_docs: list[dict[str, Any]] = []
        for i, cancelled in enumerate(cancelled_bookings[:5]):
            guest = waitlist_guests[i]
            waitlist_docs.append(
                {
                    "room_id": cancelled["room_id"],
                    "guest_id": guest["_id"],
                    "guest_name": guest["name"],
                    "guest_phone": guest["phone"],
                    "check_in_date": cancelled["check_in_date"],
                    "check_out_date": cancelled["check_out_date"],
                    "status": waitlist_statuses[i],
                    "created_at": utc_now(),
                }
            )
        for entry in waitlist_docs:
            await waitlist_coll.insert_one(entry)
        counts["waitlist"] = len(waitlist_docs)
        _step(True, f"Waitlist:     {counts['waitlist']} inserted")

        notification_docs = _build_notifications(inserted_users, room_docs, rng)
        notifications_coll = db["notifications"]
        for notification in notification_docs:
            await notifications_coll.insert_one(notification)
        counts["notifications"] = len(notification_docs)
        _step(True, f"Notifications:{counts['notifications']} inserted")

        referrals_coll = db["referrals"]
        referral_docs = [
            {
                "referrer_id": users_by_email["nandeesh@stayease.com"]["_id"],
                "referee_id": users_by_email["priya@stayease.com"]["_id"],
                "referrer_credit": 200.0,
                "referee_credit": 100.0,
                "status": "credited",
                "created_at": utc_now(),
            },
            {
                "referrer_id": users_by_email["meera@stayease.com"]["_id"],
                "referee_id": users_by_email["arjun@stayease.com"]["_id"],
                "referrer_credit": 200.0,
                "referee_credit": 100.0,
                "status": "credited",
                "created_at": utc_now(),
            },
            {
                "referrer_id": users_by_email["rajesh@stayease.com"]["_id"],
                "referee_id": users_by_email["sunshine@stayease.com"]["_id"],
                "referrer_credit": 500.0,
                "referee_credit": 200.0,
                "status": "credited",
                "created_at": utc_now(),
            },
        ]
        for referral in referral_docs:
            await referrals_coll.insert_one(referral)
        counts["referrals"] = len(referral_docs)
        _step(True, f"Referrals:    {counts['referrals']} inserted")

        total_docs = sum(counts.values())
        print("━" * 34)
        print(f"Total documents: {total_docs}")
        print()
        print("Demo logins:")
        print(f"Guest:  nandeesh@stayease.com / {PASSWORD}")
        print(f"Host:   rajesh@stayease.com / {PASSWORD}")
        print(f"Admin:  admin@stayease.com / {PASSWORD}")
        print()
        print(f"App:     {settings.FRONTEND_URL}")
        print(f"API:     http://localhost:{settings.APP_PORT}/docs")
        print("━" * 34)

    except Exception as exc:
        _step(False, f"Seed failed: {exc}")
        raise
    finally:
        await disconnect_db()


if __name__ == "__main__":
    asyncio.run(seed())
