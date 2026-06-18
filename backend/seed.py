"""Idempotent seed script — inserts demo data into MongoDB Atlas via Motor."""

from __future__ import annotations

import asyncio
from datetime import date, timedelta

from config import settings
from database import connect_db, disconnect_db, get_database
from models.common import utc_now
from services.auth import hash_password

HOST_EMAIL = "host@stayease.com"
GUEST_EMAIL = "guest@stayease.com"

HILL_RESORT = {
    "city": "Bangalore",
    "area": "StayEase Hill Resort, Koramangala",
    "lat": 12.93,
    "lng": 77.62,
    "address": "12 MG Road, Koramangala",
}

BEACH_RESORT = {
    "city": "Goa",
    "area": "StayEase Beachside, Calangute",
    "lat": 15.543,
    "lng": 73.755,
    "address": "Beach Road, Calangute",
}

ROOMS = [
    {
        "room_number": "101",
        "title": "Mountain View Single — Sunrise",
        "description": "East-facing single with mountain views and morning golden light.",
        "room_category": "Single",
        "bed_configuration": "single_bed",
        "price_per_night": 850.0,
        "amenities": ["WiFi", "AC", "TV"],
        "max_guests": 2,
        "location": {**HILL_RESORT},
        "food_preference": "veg",
        "smoking_policy": "non_smoking",
        "alcohol_policy": "non_alcohol",
        "view_type": "hill_view",
        "facing_side": "east",
        "has_balcony": True,
    },
    {
        "room_number": "102",
        "title": "Garden Double — Soft Light",
        "description": "North-facing garden room with cooler afternoon shade.",
        "room_category": "Double",
        "bed_configuration": "double_bed",
        "price_per_night": 750.0,
        "amenities": ["WiFi", "TV"],
        "max_guests": 2,
        "location": {**HILL_RESORT},
        "food_preference": "veg",
        "smoking_policy": "non_smoking",
        "alcohol_policy": "non_alcohol",
        "view_type": "garden_view",
        "facing_side": "north",
        "has_balcony": False,
    },
    {
        "room_number": "201",
        "title": "Premium Mountain Suite",
        "description": "South-facing suite with panoramic mountain views.",
        "room_category": "Suite",
        "bed_configuration": "king",
        "price_per_night": 1200.0,
        "amenities": ["WiFi", "AC", "Mini Bar", "Room Service"],
        "max_guests": 3,
        "location": {**HILL_RESORT},
        "food_preference": "both",
        "smoking_policy": "non_smoking",
        "alcohol_policy": "alcohol",
        "view_type": "hill_view",
        "facing_side": "south",
        "has_balcony": True,
    },
    {
        "room_number": "202",
        "title": "City View Double — Sunset",
        "description": "West-facing double with skyline views and golden-hour sunsets.",
        "room_category": "Double",
        "bed_configuration": "queen",
        "price_per_night": 950.0,
        "amenities": ["WiFi", "AC", "Mini Bar", "Room Service"],
        "max_guests": 3,
        "location": {**HILL_RESORT},
        "food_preference": "both",
        "smoking_policy": "non_smoking",
        "alcohol_policy": "alcohol",
        "view_type": "city_view",
        "facing_side": "west",
        "has_balcony": True,
    },
    {
        "room_number": "401",
        "title": "Beach View Double — Sunset",
        "description": "West-facing beach-side double steps from the sand.",
        "room_category": "Double",
        "bed_configuration": "queen",
        "price_per_night": 1800.0,
        "amenities": ["WiFi", "AC", "Beach Access", "Mini Bar"],
        "max_guests": 3,
        "location": {**BEACH_RESORT},
        "food_preference": "both",
        "smoking_policy": "non_smoking",
        "alcohol_policy": "alcohol",
        "view_type": "beach_view",
        "facing_side": "west",
        "view_description": "Direct beach access with sunset over the Arabian Sea.",
        "has_balcony": True,
    },
]

OFFERS = [
    {
        "code": "WELCOME10",
        "type": "percentage",
        "value": 10.0,
        "min_booking_amount": 1000.0,
        "max_discount": 500.0,
        "usage_limit": 1000,
    },
    {
        "code": "SUMMER20",
        "type": "percentage",
        "value": 20.0,
        "min_booking_amount": 2000.0,
        "max_discount": 2000.0,
        "usage_limit": 500,
    },
]

DEFAULT_POLICIES = {
    "check_in_time": "14:00",
    "check_out_time": "11:00",
    "cancellation": "moderate",
    "pet_allowed": False,
    "smoking_allowed": False,
    "alcohol_allowed": False,
}


async def _ensure_user(users, *, email: str, doc: dict) -> tuple[dict, bool]:
    existing = await users.find_one({"email": email})
    if existing:
        if doc.get("password_hash"):
            await users.update_one(
                {"_id": existing["_id"]},
                {"$set": {"password_hash": doc["password_hash"]}},
            )
        print(f"SKIP user {email} (already exists, password synced)")
        return existing, False
    result = await users.insert_one(doc)
    created = await users.find_one({"_id": result.inserted_id})
    print(f"INSERT user {email}")
    return created, True


async def _ensure_room(rooms, *, host_id: str, spec: dict) -> tuple[str, bool]:
    existing = await rooms.find_one({"host_id": host_id, "room_number": spec["room_number"]})
    if existing:
        print(f"SKIP room {spec['room_number']} — {spec['title']} (already exists)")
        return str(existing["_id"]), False
    doc = {
        **spec,
        "host_id": host_id,
        "is_available": True,
        "photos": [],
        "videos": [],
        "avg_rating": 0.0,
        "total_reviews": 0,
        "policies": DEFAULT_POLICIES,
        "facing_side": spec.get("facing_side", "none"),
        "created_at": utc_now(),
    }
    result = await rooms.insert_one(doc)
    print(f"INSERT room {spec['room_number']} — {spec['title']}")
    return str(result.inserted_id), True


async def _ensure_offer(offers, *, host_id: str, spec: dict) -> bool:
    existing = await offers.find_one({"code": spec["code"]})
    if existing:
        print(f"SKIP offer {spec['code']} (already exists)")
        return False
    today = date.today()
    doc = {
        "host_id": host_id,
        "code": spec["code"],
        "type": spec["type"],
        "value": spec["value"],
        "min_booking_amount": spec["min_booking_amount"],
        "max_discount": spec["max_discount"],
        "valid_from": (today - timedelta(days=30)).isoformat(),
        "valid_until": (today + timedelta(days=365)).isoformat(),
        "usage_limit": spec["usage_limit"],
        "used_count": 0,
        "applicable_rooms": [],
        "is_active": True,
        "created_at": utc_now(),
    }
    await offers.insert_one(doc)
    print(f"INSERT offer {spec['code']}")
    return True


async def _ensure_booking(bookings, *, key: dict, doc: dict) -> bool:
    existing = await bookings.find_one(key)
    if existing:
        label = key.get("status", "booking")
        print(f"SKIP booking ({label}) (already exists)")
        return False
    await bookings.insert_one(doc)
    print(f"INSERT booking ({doc['status']}) for {doc['guest_email']}")
    return True


async def seed() -> None:
    print(f"Connecting to MongoDB ({settings.MONGO_DB_NAME})...")
    await connect_db()
    db = get_database()

    users = db["users"]
    rooms = db["rooms"]
    bookings = db["bookings"]
    offers = db["offers"]

    host, _ = await _ensure_user(
        users,
        email=HOST_EMAIL,
        doc={
            "name": "Priya Sharma",
            "email": HOST_EMAIL,
            "phone": "9876543210",
            "password_hash": hash_password("demo123"),
            "role": "host",
            "avatar_url": None,
            "about_me": "StayEase host in Bangalore with GST-ready listings.",
            "identity_proof": None,
            "email_verified": True,
            "referral_code": "HOSTREF1",
            "referred_by": None,
            "referral_credits": 0.0,
            "wishlist": [],
            "notification_prefs": {"email": True, "whatsapp": False},
            "onboarding_completed": True,
            "created_at": utc_now(),
        },
    )
    host_id = str(host["_id"])

    guest, _ = await _ensure_user(
        users,
        email=GUEST_EMAIL,
        doc={
            "name": "StayEase Guest",
            "email": GUEST_EMAIL,
            "phone": "9123456789",
            "password_hash": hash_password("demo123"),
            "role": "tourist",
            "avatar_url": None,
            "about_me": "Frequent traveller",
            "identity_proof": None,
            "email_verified": True,
            "referral_code": "GUESTREF",
            "referred_by": host_id,
            "referral_credits": 100.0,
            "wishlist": [],
            "notification_prefs": {"email": True, "whatsapp": False},
            "onboarding_completed": True,
            "created_at": utc_now(),
        },
    )
    guest_id = str(guest["_id"])

    room_ids: list[str] = []
    for spec in ROOMS:
        room_id, _ = await _ensure_room(rooms, host_id=host_id, spec=spec)
        room_ids.append(room_id)

    for spec in OFFERS:
        await _ensure_offer(offers, host_id=host_id, spec=spec)

    if room_ids:
        check_in_upcoming = date.today() + timedelta(days=14)
        check_out_upcoming = check_in_upcoming + timedelta(days=3)
        await _ensure_booking(
            bookings,
            key={"guest_id": guest_id, "status": "confirmed", "room_id": room_ids[0]},
            doc={
                "room_id": room_ids[0],
                "guest_id": guest_id,
                "host_id": host_id,
                "guest_name": guest["name"],
                "guest_phone": guest["phone"],
                "guest_email": guest["email"],
                "check_in_date": check_in_upcoming.isoformat(),
                "check_out_date": check_out_upcoming.isoformat(),
                "total_nights": 3,
                "num_guests": 1,
                "base_price": 850.0,
                "final_price_per_night": 850.0,
                "price_breakdown": [{"label": "Base price", "amount": 2550.0, "type": "base"}],
                "subtotal": 2550.0,
                "gst_rate": 0.12,
                "gst_amount": 306.0,
                "total_price": 2856.0,
                "offer_code": None,
                "discount_amount": 0.0,
                "payment_status": "pending",
                "status": "confirmed",
                "cancellation_policy": "moderate",
                "invoice_url": None,
                "created_at": utc_now(),
            },
        )

    if len(room_ids) > 1:
        check_in_past = date.today() - timedelta(days=30)
        check_out_past = check_in_past + timedelta(days=2)
        await _ensure_booking(
            bookings,
            key={"guest_id": guest_id, "status": "completed"},
            doc={
                "room_id": room_ids[1],
                "guest_id": guest_id,
                "host_id": host_id,
                "guest_name": guest["name"],
                "guest_phone": guest["phone"],
                "guest_email": guest["email"],
                "check_in_date": check_in_past.isoformat(),
                "check_out_date": check_out_past.isoformat(),
                "total_nights": 2,
                "num_guests": 2,
                "base_price": 750.0,
                "final_price_per_night": 750.0,
                "price_breakdown": [{"label": "Base price", "amount": 1500.0, "type": "base"}],
                "subtotal": 1500.0,
                "gst_rate": 0.12,
                "gst_amount": 180.0,
                "total_price": 1680.0,
                "offer_code": None,
                "discount_amount": 0.0,
                "payment_status": "paid",
                "status": "completed",
                "cancellation_policy": "moderate",
                "invoice_url": None,
                "created_at": utc_now(),
            },
        )

    total_rooms = await rooms.count_documents({"host_id": host_id})
    total_users = await users.count_documents({})
    total_bookings = await bookings.count_documents({})
    total_offers = await offers.count_documents({})

    print("—" * 40)
    print(f"Seed complete on database '{settings.MONGO_DB_NAME}'")
    print(f"  Users:    {total_users}")
    print(f"  Rooms:    {total_rooms}")
    print(f"  Bookings: {total_bookings}")
    print(f"  Offers:   {total_offers}")
    print(f"Host:  {HOST_EMAIL} / demo123")
    print(f"Guest: {GUEST_EMAIL} / demo123")

    await disconnect_db()


if __name__ == "__main__":
    asyncio.run(seed())
