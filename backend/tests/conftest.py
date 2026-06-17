from __future__ import annotations

import os
from datetime import date, timedelta

import pytest
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

os.environ.setdefault("APP_NAME", "StayEase")
os.environ.setdefault("APP_HOST", "0.0.0.0")
os.environ.setdefault("APP_PORT", "8000")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")
os.environ.setdefault("MONGO_URI", "mongodb://localhost:27017")
os.environ.setdefault("MONGO_DB_NAME", "stayease_test")
os.environ.setdefault("JWT_SECRET", "test-secret-key-for-pytest-only")
os.environ.setdefault("JWT_EXPIRE_MINUTES", "10080")
os.environ.setdefault("MAIL_USERNAME", "")
os.environ.setdefault("MAIL_PASSWORD", "")
os.environ.setdefault("MAIL_FROM", "test@stayease.com")
os.environ.setdefault("MAIL_SERVER", "smtp.gmail.com")
os.environ.setdefault("MAIL_PORT", "587")
os.environ.setdefault("MAIL_USE_TLS", "True")
os.environ.setdefault("TWILIO_ACCOUNT_SID", "")
os.environ.setdefault("TWILIO_AUTH_TOKEN", "")
os.environ.setdefault("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")
os.environ.setdefault("CLOUDINARY_CLOUD_NAME", "")
os.environ.setdefault("CLOUDINARY_API_KEY", "")
os.environ.setdefault("CLOUDINARY_API_SECRET", "")
os.environ.setdefault("OPEN_METEO_BASE_URL", "https://api.open-meteo.com")
os.environ.setdefault("GST_RATE", "0.18")
os.environ.setdefault("GST_NUMBER", "TEST_GST")
os.environ.setdefault("FRONTEND_URL", "http://localhost:5173")

from database import database  # noqa: E402
from main import create_app  # noqa: E402
from services.auth import hash_password  # noqa: E402
from models.common import utc_now  # noqa: E402


@pytest.fixture
async def mock_db():
    client = AsyncMongoMockClient()
    db = client["stayease_test"]
    database._client = client
    database._db = db
    yield db
    database._client = None
    database._db = None


@pytest.fixture
async def client(mock_db):
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def seed_data(mock_db):
    users = mock_db["users"]
    rooms = mock_db["rooms"]
    bookings = mock_db["bookings"]

    host = await users.insert_one(
        {
            "name": "Test Host",
            "email": "host@test.com",
            "phone": "9876543210",
            "password_hash": hash_password("Host@1234"),
            "role": "host",
            "referral_code": "HOSTCODE",
            "referral_credits": 0.0,
            "wishlist": [],
            "notification_prefs": {"email": True, "whatsapp": False},
            "email_verified": True,
            "created_at": utc_now(),
        }
    )
    guest = await users.insert_one(
        {
            "name": "Test Guest",
            "email": "guest@test.com",
            "phone": "9123456789",
            "password_hash": hash_password("Guest@1234"),
            "role": "tourist",
            "referral_code": "GUESTCOD",
            "referral_credits": 0.0,
            "wishlist": [],
            "notification_prefs": {"email": True, "whatsapp": False},
            "email_verified": True,
            "identity_proof": {
                "type": "aadhar",
                "number": "123456789012",
                "document_url": "https://res.cloudinary.com/demo/image/upload/sample.jpg",
                "verified": True,
            },
            "created_at": utc_now(),
        }
    )
    host_id = str(host.inserted_id)
    guest_id = str(guest.inserted_id)

    room1 = await rooms.insert_one(
        {
            "host_id": host_id,
            "room_number": "101",
            "title": "Veg Hill Room",
            "description": "A vegetarian hill view room for testing purposes with all amenities included.",
            "room_category": "Single",
            "bed_configuration": "single_bed",
            "price_per_night": 1200.0,
            "amenities": ["WiFi", "AC"],
            "is_available": True,
            "max_guests": 2,
            "location": {"city": "Bangalore", "area": "Koramangala", "lat": 12.9, "lng": 77.6, "address": "Test"},
            "photos": [],
            "videos": [],
            "avg_rating": 0.0,
            "total_reviews": 0,
            "food_preference": "veg",
            "smoking_policy": "non_smoking",
            "alcohol_policy": "non_alcohol",
            "view_type": "hill_view",
            "has_balcony": True,
            "policies": {
                "check_in_time": "14:00",
                "check_out_time": "11:00",
                "cancellation": "moderate",
                "pet_allowed": False,
                "smoking_allowed": False,
                "alcohol_allowed": False,
            },
            "created_at": utc_now(),
        }
    )
    room2 = await rooms.insert_one(
        {
            "host_id": host_id,
            "room_number": "202",
            "title": "Beach Nonveg Room",
            "description": "A beach view non-vegetarian room for testing with smoking allowed on balcony.",
            "room_category": "Double",
            "bed_configuration": "queen",
            "price_per_night": 3500.0,
            "amenities": ["WiFi"],
            "is_available": True,
            "max_guests": 2,
            "location": {"city": "Bangalore", "area": "Indiranagar", "lat": 12.9, "lng": 77.6, "address": "Test"},
            "photos": [],
            "videos": [],
            "avg_rating": 0.0,
            "total_reviews": 0,
            "food_preference": "nonveg",
            "smoking_policy": "smoking",
            "alcohol_policy": "alcohol",
            "view_type": "beach_view",
            "has_balcony": False,
            "policies": {
                "check_in_time": "14:00",
                "check_out_time": "11:00",
                "cancellation": "flexible",
                "pet_allowed": False,
                "smoking_allowed": True,
                "alcohol_allowed": True,
            },
            "created_at": utc_now(),
        }
    )
    room3 = await rooms.insert_one(
        {
            "host_id": host_id,
            "room_number": "303",
            "title": "Budget Garden Room",
            "description": "An affordable garden view room under 1000 per night for GST testing purposes.",
            "room_category": "Double",
            "bed_configuration": "double_bed",
            "price_per_night": 950.0,
            "amenities": ["WiFi"],
            "is_available": True,
            "max_guests": 2,
            "location": {"city": "Bangalore", "area": "HSR", "lat": 12.9, "lng": 77.6, "address": "Test"},
            "photos": [],
            "videos": [],
            "avg_rating": 0.0,
            "total_reviews": 0,
            "food_preference": "both",
            "smoking_policy": "non_smoking",
            "alcohol_policy": "non_alcohol",
            "view_type": "garden_view",
            "has_balcony": False,
            "policies": {
                "check_in_time": "14:00",
                "check_out_time": "11:00",
                "cancellation": "strict",
                "pet_allowed": False,
                "smoking_allowed": False,
                "alcohol_allowed": False,
            },
            "created_at": utc_now(),
        }
    )

    check_in = date.today() + timedelta(days=10)
    check_out = check_in + timedelta(days=2)
    booking = await bookings.insert_one(
        {
            "room_id": str(room1.inserted_id),
            "guest_id": guest_id,
            "host_id": host_id,
            "guest_name": "Test Guest",
            "guest_phone": "9123456789",
            "guest_email": "guest@test.com",
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_out.isoformat(),
            "total_nights": 2,
            "num_guests": 1,
            "base_price": 1200.0,
            "final_price_per_night": 1200.0,
            "price_breakdown": [],
            "subtotal": 2400.0,
            "gst_rate": 0.12,
            "gst_amount": 288.0,
            "total_price": 2688.0,
            "offer_code": None,
            "discount_amount": 0.0,
            "payment_status": "pending",
            "status": "confirmed",
            "invoice_url": None,
            "cancellation_policy": "moderate",
            "created_at": utc_now(),
        }
    )

    return {
        "host_id": host_id,
        "guest_id": guest_id,
        "room1_id": str(room1.inserted_id),
        "room2_id": str(room2.inserted_id),
        "room3_id": str(room3.inserted_id),
        "booking_id": str(booking.inserted_id),
        "host_email": "host@test.com",
        "guest_email": "guest@test.com",
        "host_password": "Host@1234",
        "guest_password": "Guest@1234",
    }


async def _login(client, email, password):
    res = await client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.fixture
async def host_token(client, seed_data):
    return await _login(client, seed_data["host_email"], seed_data["host_password"])


@pytest.fixture
async def guest_token(client, seed_data):
    return await _login(client, seed_data["guest_email"], seed_data["guest_password"])
