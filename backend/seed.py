"""Idempotent seed script for StayEase development data."""

from __future__ import annotations

import argparse
import asyncio
from datetime import date, timedelta
from urllib.parse import quote

from bson import ObjectId

from database import database
from models.common import utc_now
from services.auth import hash_password


def _photo(url: str, primary: bool = False) -> dict:
    return {"url": url, "public_id": url.split("/")[-1], "is_primary": primary}


HOSTS = [
    {
        "name": "Priya Sharma",
        "email": "host@stayease.com",
        "phone": "9876543210",
        "password": "Host@1234",
        "referral_code": "HOSTREF1",
        "about_me": "General Manager at StayEase Grand Bangalore — boutique city hotel with 120 rooms across Koramangala and Whitefield.",
    },
    {
        "name": "Rahul Mehta",
        "email": "rahul@stayease.com",
        "phone": "9876543211",
        "password": "Host@1234",
        "referral_code": "RAHULM01",
        "about_me": "Owner of StayEase Beach Resort Goa — beachfront hotel with pool villas and sea-view rooms in North Goa.",
    },
    {
        "name": "Ananya Reddy",
        "email": "ananya@stayease.com",
        "phone": "9876543212",
        "password": "Host@1234",
        "referral_code": "ANANYA01",
        "about_me": "Host at StayEase Hill Resort Nandi — hillside hotel with valley views and nature walks near Nandi Hills.",
    },
    {
        "name": "Vikram Singh",
        "email": "vikram@stayease.com",
        "phone": "9876543213",
        "password": "Host@1234",
        "referral_code": "VIKRAM01",
        "about_me": "Director at StayEase Urban Hotel Mumbai — premium city hotel near Bandra, Colaba, and Juhu.",
    },
    {
        "name": "Lakshmi Iyer",
        "email": "lakshmi@stayease.com",
        "phone": "9876543214",
        "password": "Host@1234",
        "referral_code": "LAKSHMI1",
        "about_me": "Innkeeper at StayEase Plantation Hotel Coorg — coffee-estate hotel with plantation views and estate dining.",
    },
]

HOTEL_AMENITIES = {
    "standard": ["WiFi", "AC", "TV", "Housekeeping", "Room Service", "Hot Water", "Parking"],
    "deluxe": ["WiFi", "AC", "TV", "Housekeeping", "Room Service", "Mini Bar", "Work Desk", "Parking", "Breakfast"],
    "suite": ["WiFi", "AC", "Smart TV", "Housekeeping", "Room Service", "Mini Bar", "Lounge Access", "Bathtub", "Parking", "Breakfast"],
    "resort": ["WiFi", "AC", "TV", "Housekeeping", "Room Service", "Pool", "Spa", "Restaurant", "Parking", "Breakfast"],
    "business": ["WiFi", "AC", "Smart TV", "Work Desk", "Business Centre", "Gym", "Meeting rooms", "Express check-in", "Parking", "Breakfast"],
    "wellness": ["WiFi", "AC", "Spa", "Sauna", "Yoga studio", "Massage services", "Pool", "Hot tub", "Restaurant", "Breakfast"],
    "family": ["WiFi", "AC", "TV", "Family rooms", "Crib", "Kids club", "Children's playground", "Restaurant", "Pool", "Parking"],
    "accessible": ["WiFi", "AC", "TV", "Wheelchair accessible", "Elevator/lift", "Roll-in shower", "Grab bars", "Housekeeping", "Parking", "Breakfast"],
    "luxury": ["WiFi", "AC", "Smart TV", "Butler Service", "Lounge Access", "Mini Bar", "Bathtub", "Concierge", "Valet parking", "Breakfast"],
    "eco": ["WiFi", "AC", "Solar power", "Recycling program", "Electric vehicle charging", "Restaurant", "Garden", "Nature Trails", "Parking", "Breakfast"],
    "entertainment": ["WiFi", "AC", "Smart TV", "Netflix", "Game room", "Pool table", "Sound system", "Bar", "Room Service", "Parking"],
    "backpacker": ["WiFi", "Lockers", "Shared Bath", "Café", "Laundry facilities", "Parking", "Self check-in", "Hot Water"],
}


def _room_photos(*urls: str) -> list[dict]:
    return [_photo(url, i == 0) for i, url in enumerate(urls)]


# Verified working Unsplash hotel/stay images.
WORKING_HOTEL_IMAGES = [
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop",
]


def _photos(seed: str, count: int = 5) -> list[dict]:
    start = sum(ord(c) for c in seed) % len(WORKING_HOTEL_IMAGES)
    urls = [WORKING_HOTEL_IMAGES[(start + i) % len(WORKING_HOTEL_IMAGES)] for i in range(count)]
    return _room_photos(*urls)


SAMPLE_REVIEWS = [
    ("Excellent stay", "Clean room, comfortable bed, and friendly front-desk staff. Would book again."),
    ("Great value", "Good location and smooth check-in. Room was exactly as described."),
    ("Lovely hotel", "Housekeeping was prompt and the room was spotless throughout our stay."),
    ("Comfortable room", "Quiet at night and AC worked well. Perfect for a short business trip."),
    ("Highly recommend", "Spacious bathroom and fast WiFi. Host was very responsive."),
    ("Nice experience", "Breakfast was tasty and the staff went out of their way to help."),
    ("Good location", "Easy to reach from the airport. Parking was convenient."),
    ("Would return", "Everything matched the listing photos. Check-out was hassle-free."),
]

SAMPLE_GUEST_NAMES = [
    "Arjun K.",
    "Meera S.",
    "Rahul P.",
    "Ananya D.",
    "Vikram M.",
    "Lakshmi R.",
    "Karthik B.",
    "Divya N.",
]


async def _reset_all_rooms(rooms, reviews, bookings, users, offers) -> int:
    """Delete every room and related reviews, bookings, and wishlist entries."""
    room_ids = [str(doc["_id"]) for doc in await rooms.find({}, {"_id": 1}).to_list(1000)]
    if not room_ids:
        return 0

    await reviews.delete_many({"room_id": {"$in": room_ids}})
    await bookings.delete_many({"room_id": {"$in": room_ids}})
    await users.update_many({}, {"$set": {"wishlist": []}})
    await offers.update_many({"applicable_rooms": {"$ne": []}}, {"$set": {"applicable_rooms": []}})
    result = await rooms.delete_many({})
    return result.deleted_count


async def _repair_corrupt_rooms(rooms) -> int:
    """Re-insert draft rooms saved with a null _id (legacy bug)."""
    corrupt = await rooms.find({"_id": None}).to_list(100)
    if not corrupt:
        return 0
    for doc in corrupt:
        payload = {k: v for k, v in doc.items() if k != "_id"}
        await rooms.insert_one(payload)
    await rooms.delete_many({"_id": None})
    return len(corrupt)


async def _seed_sample_reviews(rooms, reviews) -> None:
    from services.review_stats import sync_room_review_stats

    all_rooms = await rooms.find({}).to_list(500)
    for room in all_rooms:
        room_id = str(room["_id"])
        if await reviews.count_documents({"room_id": room_id}) == 0:
            target_avg = float(room.get("avg_rating") or 4.5)
            count = min(8, max(5, int(room.get("total_reviews", 5) // 5)))
            ratings = []
            for i in range(count):
                offset = (i % 3) - 1
                ratings.append(max(3, min(5, round(target_avg + offset * 0.2))))

            for i in range(count):
                title, body = SAMPLE_REVIEWS[i % len(SAMPLE_REVIEWS)]
                await reviews.insert_one(
                    {
                        "booking_id": f"seed-{room_id}-{i}",
                        "room_id": room_id,
                        "guest_id": f"seed-guest-{i}",
                        "guest_name": SAMPLE_GUEST_NAMES[i % len(SAMPLE_GUEST_NAMES)],
                        "rating": ratings[i],
                        "title": title,
                        "body": body,
                        "would_recommend": ratings[i] >= 4,
                        "photos": [],
                        "host_response": "Thank you for staying with us!" if i == 0 else None,
                        "created_at": utc_now() - timedelta(days=14 + i * 12),
                    }
                )

        await sync_room_review_stats(room_id)


def _rooms_for_host(host_key: str) -> list[dict]:
    catalog = {
        "host@stayease.com": [
            {
                "room_number": "101",
                "title": "StayEase Grand · Standard Single Room",
                "description": "Compact hotel single room on the first floor at StayEase Grand Bangalore, Koramangala. Includes daily housekeeping, room service until 11 PM, and complimentary WiFi. Ideal for solo business travellers.",
                "room_category": "Single",
                "bed_configuration": "single_bed",
                "price_per_night": 1200.0,
                "food_preference": "veg",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "non_alcohol",
                "view_type": "city_view",
                "has_balcony": False,
                "max_guests": 1,
                "avg_rating": 4.72,
                "total_reviews": 48,
                "amenities": HOTEL_AMENITIES["standard"],
                "location": {"city": "Bangalore", "area": "Koramangala", "lat": 12.9352, "lng": 77.6245, "address": "StayEase Grand, 12th Main, Koramangala"},
                "photos": _photos("hotel-blr-101"),
                "policies": {"check_in_time": "14:00", "check_out_time": "11:00", "cancellation": "moderate", "pet_allowed": False, "smoking_allowed": False, "alcohol_allowed": False},
            },
            {
                "room_number": "202",
                "title": "StayEase Grand · Deluxe Double Room",
                "description": "Spacious deluxe double room at StayEase Grand Bangalore, Indiranagar wing. Queen bed, work desk, in-room dining, and 24-hour front desk. Non-veg restaurant on the ground floor.",
                "room_category": "Double",
                "bed_configuration": "queen",
                "price_per_night": 3500.0,
                "food_preference": "nonveg",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "alcohol",
                "view_type": "city_view",
                "has_balcony": False,
                "max_guests": 2,
                "avg_rating": 4.81,
                "total_reviews": 112,
                "amenities": HOTEL_AMENITIES["deluxe"],
                "location": {"city": "Bangalore", "area": "Indiranagar", "lat": 12.9784, "lng": 77.6408, "address": "StayEase Grand, 100 Feet Road, Indiranagar"},
                "photos": _photos("hotel-blr-202", 4),
                "policies": {"check_in_time": "14:00", "check_out_time": "11:00", "cancellation": "moderate", "pet_allowed": False, "smoking_allowed": False, "alcohol_allowed": True},
            },
            {
                "room_number": "401",
                "title": "StayEase Grand · Executive Suite",
                "description": "Top-floor executive suite at StayEase Grand Whitefield with king bed, separate living area, balcony, and complimentary breakfast. Perfect for extended business stays near ITPL.",
                "room_category": "Suite",
                "bed_configuration": "king",
                "price_per_night": 8500.0,
                "food_preference": "veg",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "non_alcohol",
                "view_type": "city_view",
                "has_balcony": True,
                "max_guests": 4,
                "avg_rating": 4.95,
                "total_reviews": 67,
                "amenities": HOTEL_AMENITIES["suite"],
                "location": {"city": "Bangalore", "area": "Whitefield", "lat": 12.9698, "lng": 77.7500, "address": "StayEase Grand, ITPL Road, Whitefield"},
                "photos": _photos("hotel-blr-401", 5),
                "policies": {"check_in_time": "15:00", "check_out_time": "12:00", "cancellation": "flexible", "pet_allowed": False, "smoking_allowed": False, "alcohol_allowed": False},
            },
            {
                "room_number": "105",
                "title": "StayEase Grand · Economy Double Room",
                "description": "Budget-friendly double room at StayEase Grand HSR Layout. Clean, air-conditioned hotel room with garden view, daily housekeeping, and free parking for guests.",
                "room_category": "Double",
                "bed_configuration": "double_bed",
                "price_per_night": 950.0,
                "food_preference": "nonveg",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "non_alcohol",
                "view_type": "garden_view",
                "has_balcony": False,
                "max_guests": 2,
                "avg_rating": 4.65,
                "total_reviews": 34,
                "amenities": HOTEL_AMENITIES["standard"],
                "location": {"city": "Bangalore", "area": "HSR Layout", "lat": 12.9116, "lng": 77.6389, "address": "StayEase Grand, Sector 2, HSR Layout"},
                "photos": _photos("hotel-blr-105", 3),
                "policies": {"check_in_time": "14:00", "check_out_time": "11:00", "cancellation": "moderate", "pet_allowed": False, "smoking_allowed": False, "alcohol_allowed": False},
            },
            {
                "room_number": "303",
                "title": "StayEase Grand · Triple Family Room",
                "description": "Family triple room at StayEase Grand Bangalore with twin beds and a rollaway. Connecting rooms available on request. Kids' menu and laundry service at the hotel front desk.",
                "room_category": "Triple",
                "bed_configuration": "twin_beds",
                "price_per_night": 4200.0,
                "food_preference": "both",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "non_alcohol",
                "view_type": "city_view",
                "has_balcony": False,
                "max_guests": 3,
                "avg_rating": 4.78,
                "total_reviews": 41,
                "amenities": HOTEL_AMENITIES["deluxe"],
                "location": {"city": "Bangalore", "area": "Koramangala", "lat": 12.9360, "lng": 77.6250, "address": "StayEase Grand, 5th Block, Koramangala"},
                "photos": _photos("hotel-blr-303", 4),
                "policies": {"check_in_time": "14:00", "check_out_time": "11:00", "cancellation": "moderate", "pet_allowed": False, "smoking_allowed": False, "alcohol_allowed": False},
            },
            {
                "room_number": "501",
                "title": "StayEase Grand · Business Executive Room",
                "description": "Corporate-ready executive room at StayEase Grand MG Road with dedicated workspace, meeting room access, gym, and express check-in for business travellers.",
                "room_category": "Double",
                "bed_configuration": "queen",
                "price_per_night": 5200.0,
                "food_preference": "both",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "alcohol",
                "view_type": "city_view",
                "has_balcony": False,
                "max_guests": 2,
                "avg_rating": 4.82,
                "total_reviews": 58,
                "amenities": HOTEL_AMENITIES["business"],
                "location": {"city": "Bangalore", "area": "MG Road", "lat": 12.9750, "lng": 77.6060, "address": "StayEase Grand, MG Road, Bangalore"},
                "photos": _photos("hotel-blr-501", 4),
                "policies": {"check_in_time": "14:00", "check_out_time": "11:00", "cancellation": "moderate", "pet_allowed": False, "smoking_allowed": False, "alcohol_allowed": True},
            },
        ],
        "rahul@stayease.com": [
            {
                "room_number": "G01",
                "title": "StayEase Beach Resort · Pool Villa",
                "description": "Private pool villa at StayEase Beach Resort Goa, Anjuna. Two-bedroom hotel villa with butler service, beach shuttle, and in-villa dining. Best for groups and celebrations.",
                "room_category": "Villa",
                "bed_configuration": "king",
                "price_per_night": 6200.0,
                "food_preference": "both",
                "smoking_policy": "smoking",
                "alcohol_policy": "alcohol",
                "view_type": "beach_view",
                "has_balcony": True,
                "max_guests": 6,
                "avg_rating": 4.88,
                "total_reviews": 89,
                "amenities": HOTEL_AMENITIES["resort"] + ["Private Pool", "Butler Service"],
                "location": {"city": "North Goa", "area": "Anjuna", "lat": 15.5833, "lng": 73.7410, "address": "StayEase Beach Resort, Anjuna Beach Road"},
                "photos": _photos("hotel-goa-g01", 5),
                "policies": {"check_in_time": "15:00", "check_out_time": "11:00", "cancellation": "moderate", "pet_allowed": False, "smoking_allowed": True, "alcohol_allowed": True},
            },
            {
                "room_number": "G02",
                "title": "StayEase Beach Resort · Deluxe Sea View Room",
                "description": "Hotel deluxe room with private balcony overlooking Calangute beach. Includes resort pool access, beach towels, and complimentary breakfast buffet at the hotel restaurant.",
                "room_category": "Double",
                "bed_configuration": "queen",
                "price_per_night": 4200.0,
                "food_preference": "nonveg",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "alcohol",
                "view_type": "sea_view",
                "has_balcony": True,
                "max_guests": 2,
                "avg_rating": 4.76,
                "total_reviews": 54,
                "amenities": HOTEL_AMENITIES["resort"],
                "location": {"city": "North Goa", "area": "Calangute", "lat": 15.5439, "lng": 73.7553, "address": "StayEase Beach Resort, Calangute Beach Road"},
                "photos": _photos("hotel-goa-g02", 4),
                "policies": {"check_in_time": "14:00", "check_out_time": "11:00", "cancellation": "moderate", "pet_allowed": False, "smoking_allowed": False, "alcohol_allowed": True},
            },
            {
                "room_number": "G03",
                "title": "StayEase Beach Resort · Cliffside Suite",
                "description": "Premium cliffside hotel suite at Vagator with panoramic sunset views. King bed, jacuzzi bath, and access to the resort's rooftop bar and infinity pool.",
                "room_category": "Suite",
                "bed_configuration": "king",
                "price_per_night": 7800.0,
                "food_preference": "both",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "alcohol",
                "view_type": "sea_view",
                "has_balcony": True,
                "max_guests": 4,
                "avg_rating": 4.91,
                "total_reviews": 41,
                "amenities": HOTEL_AMENITIES["suite"] + ["Pool", "Spa"],
                "location": {"city": "North Goa", "area": "Vagator", "lat": 15.6014, "lng": 73.7340, "address": "StayEase Beach Resort, Ozran Beach Road, Vagator"},
                "photos": _photos("hotel-goa-g03", 5),
                "policies": {"check_in_time": "15:00", "check_out_time": "11:00", "cancellation": "strict", "pet_allowed": False, "smoking_allowed": False, "alcohol_allowed": True},
            },
            {
                "room_number": "G04",
                "title": "StayEase Beach Resort · Standard Single Room",
                "description": "Affordable single hotel room at StayEase Beach Resort for solo travellers. Steps from the beach, with AC, WiFi, and access to the resort pool and restaurant.",
                "room_category": "Single",
                "bed_configuration": "single_bed",
                "price_per_night": 2800.0,
                "food_preference": "both",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "alcohol",
                "view_type": "garden_view",
                "has_balcony": False,
                "max_guests": 1,
                "avg_rating": 4.69,
                "total_reviews": 28,
                "amenities": HOTEL_AMENITIES["standard"] + ["Pool"],
                "location": {"city": "North Goa", "area": "Calangute", "lat": 15.5445, "lng": 73.7560, "address": "StayEase Beach Resort, Calangute"},
                "photos": _photos("hotel-goa-g04", 3),
                "policies": {"check_in_time": "14:00", "check_out_time": "11:00", "cancellation": "moderate", "pet_allowed": False, "smoking_allowed": False, "alcohol_allowed": True},
            },
            {
                "room_number": "G05",
                "title": "StayEase Beach Resort · Wellness Spa Suite",
                "description": "Holistic wellness suite at StayEase Beach Resort with in-room spa access, sauna, yoga studio, and infinity pool. Includes daily massage credit and healthy breakfast.",
                "room_category": "Suite",
                "bed_configuration": "king",
                "price_per_night": 8900.0,
                "food_preference": "veg",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "non_alcohol",
                "view_type": "garden_view",
                "has_balcony": True,
                "max_guests": 2,
                "avg_rating": 4.92,
                "total_reviews": 36,
                "amenities": HOTEL_AMENITIES["wellness"],
                "location": {"city": "North Goa", "area": "Morjim", "lat": 15.6330, "lng": 73.7150, "address": "StayEase Beach Resort, Morjim Beach Road"},
                "photos": _photos("hotel-goa-g05", 5),
                "policies": {"check_in_time": "15:00", "check_out_time": "11:00", "cancellation": "strict", "pet_allowed": False, "smoking_allowed": False, "alcohol_allowed": False},
            },
        ],
        "ananya@stayease.com": [
            {
                "room_number": "N01",
                "title": "StayEase Hill Resort · Standard Hill View Room",
                "description": "Cozy hotel room at StayEase Hill Resort Nandi with valley views from your window. Vegetarian hotel restaurant, morning tea service, and guided nature walks included.",
                "room_category": "Single",
                "bed_configuration": "single_bed",
                "price_per_night": 2800.0,
                "food_preference": "veg",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "non_alcohol",
                "view_type": "hill_view",
                "has_balcony": True,
                "max_guests": 2,
                "avg_rating": 4.93,
                "total_reviews": 72,
                "amenities": HOTEL_AMENITIES["standard"] + ["Restaurant", "Nature Trails"],
                "location": {"city": "Nandi Hills", "area": "Chikkaballapur", "lat": 13.3702, "lng": 77.6835, "address": "StayEase Hill Resort, Nandi Hills Road"},
                "photos": _photos("hotel-nandi-n01", 5),
                "policies": {"check_in_time": "14:00", "check_out_time": "11:00", "cancellation": "flexible", "pet_allowed": False, "smoking_allowed": False, "alcohol_allowed": False},
            },
            {
                "room_number": "N02",
                "title": "StayEase Hill Resort · Deluxe Triple Room",
                "description": "Spacious triple hotel room surrounded by eucalyptus groves at StayEase Hill Resort. Ideal for families with three guests, includes balcony seating and hotel dining.",
                "room_category": "Triple",
                "bed_configuration": "twin_beds",
                "price_per_night": 3400.0,
                "food_preference": "both",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "non_alcohol",
                "view_type": "hill_view",
                "has_balcony": True,
                "max_guests": 3,
                "avg_rating": 4.84,
                "total_reviews": 38,
                "amenities": HOTEL_AMENITIES["deluxe"] + ["Restaurant"],
                "location": {"city": "Nandi Hills", "area": "Skandagiri", "lat": 13.3800, "lng": 77.6900, "address": "StayEase Hill Resort, Skandagiri Trail"},
                "photos": _photos("hotel-nandi-n02", 4),
                "policies": {"check_in_time": "14:00", "check_out_time": "11:00", "cancellation": "moderate", "pet_allowed": False, "smoking_allowed": False, "alcohol_allowed": False},
            },
            {
                "room_number": "N03",
                "title": "StayEase Hill Resort · Premium Villa Suite",
                "description": "Private villa suite at StayEase Hill Resort with garden terrace, living room, and panoramic Deccan plateau views. Hotel concierge arranges sunrise treks and bonfire dinners.",
                "room_category": "Villa",
                "bed_configuration": "king",
                "price_per_night": 9200.0,
                "food_preference": "veg",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "non_alcohol",
                "view_type": "garden_view",
                "has_balcony": True,
                "max_guests": 5,
                "avg_rating": 4.97,
                "total_reviews": 29,
                "amenities": HOTEL_AMENITIES["suite"] + ["Restaurant", "Bonfire"],
                "location": {"city": "Nandi Hills", "area": "Nandi Village", "lat": 13.3650, "lng": 77.6800, "address": "StayEase Hill Resort, Nandi Village Road"},
                "photos": _photos("hotel-nandi-n03", 5),
                "policies": {"check_in_time": "15:00", "check_out_time": "11:00", "cancellation": "moderate", "pet_allowed": True, "smoking_allowed": False, "alcohol_allowed": False},
            },
            {
                "room_number": "N04",
                "title": "StayEase Hill Resort · Dormitory Bed",
                "description": "Shared dormitory at StayEase Hill Resort for backpackers and groups. Bunk beds, lockers, shared bath, and access to the hotel café. Budget-friendly hill stay.",
                "room_category": "Dormitory",
                "bed_configuration": "bunk_bed",
                "price_per_night": 650.0,
                "food_preference": "veg",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "non_alcohol",
                "view_type": "hill_view",
                "has_balcony": False,
                "max_guests": 1,
                "avg_rating": 4.55,
                "total_reviews": 19,
                "amenities": HOTEL_AMENITIES["backpacker"],
                "location": {"city": "Nandi Hills", "area": "Chikkaballapur", "lat": 13.3710, "lng": 77.6840, "address": "StayEase Hill Resort, Backpackers Wing"},
                "photos": _photos("hotel-nandi-n04", 3),
                "policies": {"check_in_time": "13:00", "check_out_time": "10:00", "cancellation": "flexible", "pet_allowed": False, "smoking_allowed": False, "alcohol_allowed": False},
            },
        ],
        "vikram@stayease.com": [
            {
                "room_number": "M01",
                "title": "StayEase Urban · Deluxe Sea View Room",
                "description": "Deluxe hotel room at StayEase Urban Hotel Mumbai, Bandra West. Sea-facing windows, queen bed, marble bathroom, and 24-hour room service. Walking distance to Linking Road.",
                "room_category": "Double",
                "bed_configuration": "queen",
                "price_per_night": 5500.0,
                "food_preference": "nonveg",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "alcohol",
                "view_type": "sea_view",
                "has_balcony": True,
                "max_guests": 2,
                "avg_rating": 4.79,
                "total_reviews": 95,
                "amenities": HOTEL_AMENITIES["deluxe"],
                "location": {"city": "Mumbai", "area": "Bandra West", "lat": 19.0596, "lng": 72.8295, "address": "StayEase Urban Hotel, Linking Road, Bandra"},
                "photos": _photos("hotel-mum-m01", 4),
                "policies": {"check_in_time": "14:00", "check_out_time": "11:00", "cancellation": "moderate", "pet_allowed": False, "smoking_allowed": False, "alcohol_allowed": True},
            },
            {
                "room_number": "M02",
                "title": "StayEase Urban · Heritage Executive Suite",
                "description": "Colonial-style executive suite at StayEase Urban Hotel near Gateway of India. High ceilings, heritage décor, king bed, and complimentary airport transfer for suite guests.",
                "room_category": "Suite",
                "bed_configuration": "king",
                "price_per_night": 9800.0,
                "food_preference": "both",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "alcohol",
                "view_type": "city_view",
                "has_balcony": False,
                "max_guests": 3,
                "avg_rating": 4.86,
                "total_reviews": 61,
                "amenities": HOTEL_AMENITIES["suite"] + ["Airport Transfer"],
                "location": {"city": "Mumbai", "area": "Colaba", "lat": 18.9067, "lng": 72.8147, "address": "StayEase Urban Hotel, Colaba Causeway"},
                "photos": _photos("hotel-mum-m02", 5),
                "policies": {"check_in_time": "15:00", "check_out_time": "12:00", "cancellation": "strict", "pet_allowed": False, "smoking_allowed": False, "alcohol_allowed": True},
            },
            {
                "room_number": "M03",
                "title": "StayEase Urban · Standard Single Room",
                "description": "Compact single hotel room at StayEase Urban Juhu wing near Juhu Beach. Perfect for short Mumbai stays with AC, WiFi, and hotel laundry service.",
                "room_category": "Single",
                "bed_configuration": "single_bed",
                "price_per_night": 3200.0,
                "food_preference": "nonveg",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "non_alcohol",
                "view_type": "beach_view",
                "has_balcony": False,
                "max_guests": 2,
                "avg_rating": 4.72,
                "total_reviews": 44,
                "amenities": HOTEL_AMENITIES["standard"],
                "location": {"city": "Mumbai", "area": "Juhu", "lat": 19.1070, "lng": 72.8263, "address": "StayEase Urban Hotel, Juhu Tara Road"},
                "photos": _photos("hotel-mum-m03", 3),
                "policies": {"check_in_time": "14:00", "check_out_time": "11:00", "cancellation": "moderate", "pet_allowed": False, "smoking_allowed": False, "alcohol_allowed": False},
            },
            {
                "room_number": "M04",
                "title": "StayEase Urban · Premium Double Room",
                "description": "Premium double hotel room at StayEase Urban Mumbai Andheri with city skyline view. Gym access, business centre, and express check-in for corporate guests.",
                "room_category": "Double",
                "bed_configuration": "king",
                "price_per_night": 4800.0,
                "food_preference": "both",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "alcohol",
                "view_type": "city_view",
                "has_balcony": False,
                "max_guests": 2,
                "avg_rating": 4.74,
                "total_reviews": 52,
                "amenities": HOTEL_AMENITIES["deluxe"] + ["Gym", "Business Centre"],
                "location": {"city": "Mumbai", "area": "Andheri West", "lat": 19.1364, "lng": 72.8296, "address": "StayEase Urban Hotel, Andheri West"},
                "photos": _photos("hotel-mum-m04", 4),
                "policies": {"check_in_time": "14:00", "check_out_time": "11:00", "cancellation": "moderate", "pet_allowed": False, "smoking_allowed": False, "alcohol_allowed": True},
            },
            {
                "room_number": "M05",
                "title": "StayEase Urban · Accessible Premium Room",
                "description": "Fully accessible premium hotel room at StayEase Urban Mumbai with wheelchair access, roll-in shower, grab bars, and lift access on every floor.",
                "room_category": "Double",
                "bed_configuration": "queen",
                "price_per_night": 4600.0,
                "food_preference": "both",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "non_alcohol",
                "view_type": "city_view",
                "has_balcony": False,
                "max_guests": 2,
                "avg_rating": 4.88,
                "total_reviews": 27,
                "amenities": HOTEL_AMENITIES["accessible"],
                "location": {"city": "Mumbai", "area": "Lower Parel", "lat": 19.0050, "lng": 72.8300, "address": "StayEase Urban Hotel, Lower Parel"},
                "photos": _photos("hotel-mum-m05", 4),
                "policies": {"check_in_time": "14:00", "check_out_time": "11:00", "cancellation": "flexible", "pet_allowed": False, "smoking_allowed": False, "alcohol_allowed": False},
            },
        ],
        "lakshmi@stayease.com": [
            {
                "room_number": "C01",
                "title": "StayEase Plantation · Homestay Room",
                "description": "Estate homestay room at StayEase Plantation Hotel Coorg inside a working coffee plantation. Veg estate meals, morning mist views, and guided plantation walks from the hotel.",
                "room_category": "Homestay",
                "bed_configuration": "queen",
                "price_per_night": 3800.0,
                "food_preference": "veg",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "non_alcohol",
                "view_type": "garden_view",
                "has_balcony": True,
                "max_guests": 2,
                "avg_rating": 4.90,
                "total_reviews": 56,
                "amenities": HOTEL_AMENITIES["resort"] + ["Plantation Walk", "Estate Dining"],
                "location": {"city": "Coorg", "area": "Madikeri", "lat": 12.4244, "lng": 75.7382, "address": "StayEase Plantation Hotel, Madikeri Estate Road"},
                "photos": _photos("hotel-coorg-c01", 4),
                "policies": {"check_in_time": "14:00", "check_out_time": "11:00", "cancellation": "flexible", "pet_allowed": False, "smoking_allowed": False, "alcohol_allowed": False},
            },
            {
                "room_number": "C02",
                "title": "StayEase Plantation · Deluxe Cottage Suite",
                "description": "Wooden cottage suite at StayEase Plantation Hotel nestled in spice gardens. King bed, private deck, hill views, and in-room coffee tasting arranged by the hotel staff.",
                "room_category": "Villa",
                "bed_configuration": "king",
                "price_per_night": 7200.0,
                "food_preference": "both",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "non_alcohol",
                "view_type": "hill_view",
                "has_balcony": True,
                "max_guests": 4,
                "avg_rating": 4.94,
                "total_reviews": 33,
                "amenities": HOTEL_AMENITIES["suite"] + ["Coffee Tasting", "Restaurant"],
                "location": {"city": "Coorg", "area": "Virajpet", "lat": 12.1964, "lng": 75.8011, "address": "StayEase Plantation Hotel, Virajpet Hills"},
                "photos": _photos("hotel-coorg-c02", 5),
                "policies": {"check_in_time": "15:00", "check_out_time": "11:00", "cancellation": "moderate", "pet_allowed": True, "smoking_allowed": False, "alcohol_allowed": False},
            },
            {
                "room_number": "C03",
                "title": "StayEase Plantation · Standard Estate Room",
                "description": "Budget hotel room at StayEase Plantation Coorg with estate garden views. Ideal for solo travellers exploring Madikeri. Hotel shuttle to Abbey Falls available.",
                "room_category": "Single",
                "bed_configuration": "single_bed",
                "price_per_night": 1800.0,
                "food_preference": "veg",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "non_alcohol",
                "view_type": "garden_view",
                "has_balcony": False,
                "max_guests": 1,
                "avg_rating": 4.68,
                "total_reviews": 22,
                "amenities": HOTEL_AMENITIES["standard"] + ["Restaurant", "Shuttle"],
                "location": {"city": "Coorg", "area": "Kushalnagar", "lat": 12.4600, "lng": 75.9700, "address": "StayEase Plantation Hotel, Kushalnagar Main Road"},
                "photos": _photos("hotel-coorg-c03", 3),
                "policies": {"check_in_time": "14:00", "check_out_time": "11:00", "cancellation": "flexible", "pet_allowed": False, "smoking_allowed": False, "alcohol_allowed": False},
            },
            {
                "room_number": "C04",
                "title": "StayEase Plantation · Double Valley Room",
                "description": "Double hotel room at StayEase Plantation Hotel with valley-facing balcony. Complimentary estate breakfast, WiFi, and evening campfire at the hotel grounds.",
                "room_category": "Double",
                "bed_configuration": "queen",
                "price_per_night": 4500.0,
                "food_preference": "veg",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "non_alcohol",
                "view_type": "hill_view",
                "has_balcony": True,
                "max_guests": 2,
                "avg_rating": 4.83,
                "total_reviews": 37,
                "amenities": HOTEL_AMENITIES["deluxe"] + ["Campfire", "Restaurant"],
                "location": {"city": "Coorg", "area": "Madikeri", "lat": 12.4250, "lng": 75.7390, "address": "StayEase Plantation Hotel, Valley Wing, Madikeri"},
                "photos": _photos("hotel-coorg-c04", 4),
                "policies": {"check_in_time": "14:00", "check_out_time": "11:00", "cancellation": "moderate", "pet_allowed": False, "smoking_allowed": False, "alcohol_allowed": False},
            },
            {
                "room_number": "C05",
                "title": "StayEase Plantation · Eco Family Suite",
                "description": "Sustainable family suite at StayEase Plantation Hotel with solar power, EV charging, kids club, and guided nature trails through the coffee estate.",
                "room_category": "Suite",
                "bed_configuration": "king",
                "price_per_night": 6800.0,
                "food_preference": "veg",
                "smoking_policy": "non_smoking",
                "alcohol_policy": "non_alcohol",
                "view_type": "garden_view",
                "has_balcony": True,
                "max_guests": 5,
                "avg_rating": 4.91,
                "total_reviews": 31,
                "amenities": HOTEL_AMENITIES["eco"] + ["Kids club", "Crib", "Family rooms"],
                "location": {"city": "Coorg", "area": "Madikeri", "lat": 12.4260, "lng": 75.7400, "address": "StayEase Plantation Hotel, Eco Wing, Madikeri"},
                "photos": _photos("hotel-coorg-c05", 5),
                "policies": {"check_in_time": "15:00", "check_out_time": "11:00", "cancellation": "flexible", "pet_allowed": True, "smoking_allowed": False, "alcohol_allowed": False},
            },
        ],
    }
    return catalog.get(host_key, [])


def _avatar_url(name: str) -> str:
    return f"https://ui-avatars.com/api/?name={quote(name)}&background=1A6BFF&color=fff&size=150&bold=true"


async def _ensure_host(users, spec: dict) -> dict:
    host = await users.find_one({"email": spec["email"]})
    if host:
        await users.update_one(
            {"_id": host["_id"]},
            {"$set": {
                "about_me": spec["about_me"],
                "name": spec["name"],
                "avatar_url": _avatar_url(spec["name"]),
                "password_hash": hash_password(spec["password"]),
                "role": "host",
            }},
        )
        return await users.find_one({"_id": host["_id"]})
    res = await users.insert_one(
        {
            "name": spec["name"],
            "email": spec["email"],
            "phone": spec["phone"],
            "password_hash": hash_password(spec["password"]),
            "role": "host",
            "avatar_url": _avatar_url(spec["name"]),
            "about_me": spec["about_me"],
            "identity_proof": None,
            "email_verified": True,
            "referral_code": spec["referral_code"],
            "referred_by": None,
            "referral_credits": 0.0,
            "wishlist": [],
            "notification_prefs": {"email": True, "whatsapp": True},
            "onboarding_completed": True,
            "created_at": utc_now(),
        }
    )
    return await users.find_one({"_id": res.inserted_id})


async def _ensure_rooms(rooms, host_id: str, host_email: str) -> list[str]:
    room_ids: list[str] = []
    sync_fields = (
        "title", "description", "room_category", "bed_configuration", "price_per_night",
        "food_preference", "smoking_policy", "alcohol_policy", "view_type", "has_balcony",
        "max_guests", "location", "photos", "avg_rating", "total_reviews", "amenities", "policies",
    )
    for spec in _rooms_for_host(host_email):
        existing = await rooms.find_one({"host_id": host_id, "room_number": spec["room_number"]})
        policies = spec.get("policies") or {
            "check_in_time": "14:00",
            "check_out_time": "11:00",
            "cancellation": "moderate",
            "pet_allowed": False,
            "smoking_allowed": spec["smoking_policy"] == "smoking",
            "alcohol_allowed": spec["alcohol_policy"] == "alcohol",
        }
        if existing:
            await rooms.update_one(
                {"_id": existing["_id"]},
                {"$set": {k: spec[k] for k in sync_fields if k in spec} | {"policies": policies, "is_available": True}},
            )
            room_ids.append(str(existing["_id"]))
            continue

        doc = {
            **{k: v for k, v in spec.items() if k not in ("photos", "avg_rating", "total_reviews", "amenities", "policies")},
            "host_id": host_id,
            "amenities": spec.get("amenities", HOTEL_AMENITIES["standard"]),
            "is_available": True,
            "photos": spec.get("photos", []),
            "videos": [],
            "avg_rating": spec.get("avg_rating", 0.0),
            "total_reviews": spec.get("total_reviews", 0),
            "policies": policies,
            "created_at": utc_now(),
        }
        res = await rooms.insert_one(doc)
        room_ids.append(str(res.inserted_id))
    return room_ids


async def seed(*, reset_rooms: bool = False) -> None:
    await database.connect()
    users = database.collection("users")
    rooms = database.collection("rooms")
    bookings = database.collection("bookings")
    offers = database.collection("offers")
    attractions = database.collection("attractions")
    reviews = database.collection("reviews")

    host_records = []
    for spec in HOSTS:
        host_records.append(await _ensure_host(users, spec))

    if reset_rooms:
        deleted = await _reset_all_rooms(rooms, reviews, bookings, users, offers)
        print(f"Deleted {deleted} existing room(s) and related data")

    primary_host = host_records[0]
    host_id = str(primary_host["_id"])

    tourist = await users.find_one({"email": {"$in": ["tourist@stayease.com", "guest@stayease.com"]}})
    if not tourist:
        tourist_res = await users.insert_one(
            {
                "name": "StayEase Tourist",
                "email": "tourist@stayease.com",
                "phone": "9123456789",
                "password_hash": hash_password("Guest@1234"),
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
            }
        )
        tourist = await users.find_one({"_id": tourist_res.inserted_id})
        await users.update_one({"_id": primary_host["_id"]}, {"$inc": {"referral_credits": 200.0}})
    else:
        await users.update_one(
            {"_id": tourist["_id"]},
            {"$set": {
                "password_hash": hash_password("Guest@1234"),
                "role": "tourist",
                "name": "StayEase Tourist",
                "email": "tourist@stayease.com",
            }},
        )
        tourist = await users.find_one({"_id": tourist["_id"]})

    tourist_id = str(tourist["_id"])
    all_room_ids: list[str] = []
    for host in host_records:
        ids = await _ensure_rooms(rooms, str(host["_id"]), host["email"])
        all_room_ids.extend(ids)

    cities_attractions = {
        "Bangalore": [
            ("Lalbagh Botanical Garden", "nature", 3.5, "Historic botanical garden with glass house"),
            ("Bangalore Palace", "heritage", 5.0, "Tudor-style palace built in 1878"),
            ("Cubbon Park", "nature", 4.0, "Large public park in the city centre"),
        ],
        "North Goa": [
            ("Anjuna Flea Market", "shopping", 1.0, "Famous Wednesday flea market"),
            ("Chapora Fort", "heritage", 2.5, "Iconic fort with panoramic sea views"),
            ("Baga Beach", "nature", 0.5, "Popular beach with water sports"),
        ],
        "Nandi Hills": [
            ("Nandi Temple", "spiritual", 0.5, "Ancient temple atop the hill"),
            ("Sunrise Point", "nature", 1.0, "Best sunrise viewpoint"),
        ],
        "Mumbai": [
            ("Gateway of India", "heritage", 2.0, "Iconic arch monument on the waterfront"),
            ("Marine Drive", "nature", 1.5, "Scenic coastal promenade"),
        ],
        "Coorg": [
            ("Abbey Falls", "nature", 5.0, "Picturesque waterfall in coffee country"),
            ("Raja's Seat", "nature", 3.0, "Sunset viewpoint in Madikeri"),
        ],
    }
    for city, items in cities_attractions.items():
        for name, category, dist, desc in items:
            if not await attractions.find_one({"city": city, "name": name}):
                await attractions.insert_one({
                    "city": city, "name": name, "category": category,
                    "distance_km": dist, "description": desc, "open_hours": "09:00 - 18:00",
                })

    if not await offers.find_one({"code": "WELCOME10"}):
        await offers.insert_one({
            "host_id": None, "code": "WELCOME10", "type": "percentage", "value": 10.0,
            "min_booking_amount": 1000.0, "max_discount": 500.0,
            "valid_from": (date.today() - timedelta(days=30)).isoformat(),
            "valid_until": (date.today() + timedelta(days=365)).isoformat(),
            "usage_limit": 1000, "used_count": 0, "applicable_rooms": [],
            "is_active": True, "created_at": utc_now(),
        })

    if not await offers.find_one({"code": "SUMMER20"}):
        await offers.insert_one({
            "host_id": host_id, "code": "SUMMER20", "type": "percentage", "value": 20.0,
            "min_booking_amount": 2000.0, "max_discount": 2000.0,
            "valid_from": (date.today() - timedelta(days=30)).isoformat(),
            "valid_until": (date.today() + timedelta(days=180)).isoformat(),
            "usage_limit": 500, "used_count": 0, "applicable_rooms": [],
            "is_active": True, "created_at": utc_now(),
        })

    if all_room_ids and not await bookings.find_one({"guest_id": tourist_id, "status": "confirmed"}):
        check_in = date.today() + timedelta(days=14)
        check_out = check_in + timedelta(days=3)
        await bookings.insert_one({
            "room_id": all_room_ids[0], "guest_id": tourist_id, "host_id": host_id,
            "guest_name": tourist["name"], "guest_phone": tourist["phone"], "guest_email": tourist["email"],
            "check_in_date": check_in.isoformat(), "check_out_date": check_out.isoformat(),
            "total_nights": 3, "num_guests": 1, "base_price": 1200.0,
            "final_price_per_night": 1200.0,
            "price_breakdown": [{"label": "Base price", "amount": 3600.0, "type": "base"}],
            "subtotal": 3600.0, "gst_rate": 0.12, "gst_amount": 432.0, "total_price": 4032.0,
            "offer_code": None, "discount_amount": 0.0, "payment_status": "pending",
            "status": "confirmed", "invoice_url": None, "created_at": utc_now(),
        })

    if len(all_room_ids) > 1 and not await bookings.find_one({"guest_id": tourist_id, "status": "completed"}):
        check_in = date.today() - timedelta(days=30)
        check_out = check_in + timedelta(days=2)
        res = await bookings.insert_one({
            "room_id": all_room_ids[1], "guest_id": tourist_id, "host_id": host_id,
            "guest_name": tourist["name"], "guest_phone": tourist["phone"], "guest_email": tourist["email"],
            "check_in_date": check_in.isoformat(), "check_out_date": check_out.isoformat(),
            "total_nights": 2, "num_guests": 2, "base_price": 3500.0,
            "final_price_per_night": 3500.0,
            "price_breakdown": [{"label": "Base price", "amount": 7000.0, "type": "base"}],
            "subtotal": 7000.0, "gst_rate": 0.12, "gst_amount": 840.0, "total_price": 7840.0,
            "offer_code": None, "discount_amount": 0.0, "payment_status": "paid",
            "status": "completed", "invoice_url": None, "created_at": utc_now(),
        })
        booking_id = str(res.inserted_id)
        if not await reviews.find_one({"booking_id": booking_id}):
            await reviews.insert_one({
                "booking_id": booking_id, "room_id": all_room_ids[1], "guest_id": tourist_id,
                "guest_name": tourist["name"], "rating": 5, "title": "Excellent stay",
                "body": "Great location and comfortable room.", "would_recommend": True,
                "photos": [], "host_response": None, "created_at": utc_now(),
            })

    await _repair_corrupt_rooms(rooms)
    await _seed_sample_reviews(rooms, reviews)

    from services.review_stats import sync_all_room_review_stats
    await sync_all_room_review_stats()

    total_rooms = await rooms.count_documents({})
    total_hosts = await users.count_documents({"role": "host"})
    print(f"Seed complete: {total_hosts} hosts, {total_rooms} hotel rooms")
    print("Tourist: tourist@stayease.com / Guest@1234")
    print("Hosts: host@stayease.com, rahul@stayease.com, ananya@stayease.com, vikram@stayease.com, lakshmi@stayease.com (all Host@1234)")
    await database.disconnect()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed StayEase development data")
    parser.add_argument(
        "--reset-rooms",
        action="store_true",
        help="Delete all rooms (and related reviews/bookings) before re-seeding",
    )
    args = parser.parse_args()
    asyncio.run(seed(reset_rooms=args.reset_rooms))
