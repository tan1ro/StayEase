from datetime import datetime, timedelta

from bson import ObjectId

from models.common import utc_now


async def test_host_profile_returns_public_data(client, seed_data):
    res = await client.get(f"/api/hosts/{seed_data['host_id']}/profile")
    assert res.status_code == 200
    body = res.json()
    assert body["name"]
    assert body["stats"]["listing_count"] >= 1
    assert isinstance(body["listings"], list)
    assert isinstance(body["reviews"], list)
    assert isinstance(body["interests"], list)
    assert "places" not in body
    assert "email" not in body
    assert "phone" not in body


async def test_host_profile_not_found(client):
    res = await client.get("/api/hosts/000000000000000000000000/profile")
    assert res.status_code == 404


async def test_host_profile_guest_not_found(client, seed_data, mock_db):
    res = await client.get(f"/api/hosts/{seed_data['guest_id']}/profile")
    assert res.status_code == 404


async def test_host_profile_includes_reviews(client, guest_token, seed_data, mock_db):
    room_id = seed_data["room2_id"]
    booking_id = str(
        (
            await mock_db["bookings"].insert_one(
                {
                    "room_id": room_id,
                    "guest_id": seed_data["guest_id"],
                    "host_id": seed_data["host_id"],
                    "guest_name": "Test Guest",
                    "guest_phone": "9123456789",
                    "guest_email": "guest@test.com",
                    "check_in_date": (datetime.utcnow().date() - timedelta(days=10)).isoformat(),
                    "check_out_date": (datetime.utcnow().date() - timedelta(days=8)).isoformat(),
                    "total_nights": 2,
                    "num_guests": 1,
                    "base_price": 3500.0,
                    "final_price_per_night": 3500.0,
                    "price_breakdown": [],
                    "subtotal": 7000.0,
                    "gst_rate": 0.12,
                    "gst_amount": 840.0,
                    "total_price": 7840.0,
                    "offer_code": None,
                    "discount_amount": 0.0,
                    "payment_status": "paid",
                    "status": "completed",
                    "invoice_url": None,
                    "created_at": utc_now(),
                }
            )
        ).inserted_id
    )
    await client.post(
        "/api/reviews",
        headers={"Authorization": f"Bearer {guest_token}"},
        json={
            "booking_id": booking_id,
            "rating": 5,
            "title": "Great host",
            "body": "Wonderful hospitality and clean rooms.",
            "would_recommend": True,
            "photos": [],
        },
    )

    profile = await client.get(f"/api/hosts/{seed_data['host_id']}/profile")
    assert profile.status_code == 200
    body = profile.json()
    assert body["stats"]["total_reviews"] >= 1
    assert any(item["room_id"] == room_id for item in body["reviews_by_listing"])
    listing = next(item for item in body["listings"] if item["_id"] == room_id)
    grouped = next(item for item in body["reviews_by_listing"] if item["room_id"] == room_id)
    assert listing["total_reviews"] == grouped["total_reviews"]
    assert listing["avg_rating"] == grouped["avg_rating"]
