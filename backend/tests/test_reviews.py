from datetime import date, timedelta

from bson import ObjectId

from models.common import utc_now


async def test_property_reviews_aggregate(client, guest_token, seed_data, mock_db):
    check_in = date.today() - timedelta(days=10)
    check_out = check_in + timedelta(days=2)
    booking = await mock_db["bookings"].insert_one(
        {
            "room_id": seed_data["room2_id"],
            "guest_id": seed_data["guest_id"],
            "host_id": seed_data["host_id"],
            "guest_name": "Test Guest",
            "guest_phone": "9123456789",
            "guest_email": "guest@test.com",
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_out.isoformat(),
            "total_nights": 2,
            "num_guests": 1,
            "base_price": 3500.0,
            "final_price_per_night": 3500.0,
            "price_breakdown": [],
            "subtotal": 7000.0,
            "gst_rate": 0.05,
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
    await client.post(
        "/api/reviews",
        headers={"Authorization": f"Bearer {guest_token}"},
        json={
            "booking_id": str(booking.inserted_id),
            "rating": 5,
            "title": "Great hotel",
            "body": "Loved the property overall",
            "would_recommend": True,
            "photos": [],
        },
    )

    res = await client.get(f"/api/reviews/property/{seed_data['room1_id']}")
    assert res.status_code == 200
    body = res.json()
    assert body["total_reviews"] >= 1
    assert any(r.get("room_number") for r in body["reviews"])


async def test_eligible_review_for_room(client, guest_token, seed_data, mock_db):
    check_in = date.today() - timedelta(days=10)
    check_out = check_in + timedelta(days=2)
    res = await mock_db["bookings"].insert_one(
        {
            "room_id": seed_data["room2_id"],
            "guest_id": seed_data["guest_id"],
            "host_id": seed_data["host_id"],
            "guest_name": "Test Guest",
            "guest_phone": "9123456789",
            "guest_email": "guest@test.com",
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_out.isoformat(),
            "total_nights": 2,
            "num_guests": 1,
            "base_price": 3500.0,
            "final_price_per_night": 3500.0,
            "price_breakdown": [],
            "subtotal": 7000.0,
            "gst_rate": 0.05,
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
    booking_id = str(res.inserted_id)

    eligible = await client.get(
        f"/api/reviews/eligible/room/{seed_data['room2_id']}",
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert eligible.status_code == 200
    body = eligible.json()
    assert body["can_review"] is True
    assert body["booking"]["_id"] == booking_id

    await client.post(
        "/api/reviews",
        headers={"Authorization": f"Bearer {guest_token}"},
        json={
            "booking_id": booking_id,
            "rating": 5,
            "title": "Great",
            "body": "Loved it very much",
            "would_recommend": True,
            "photos": [],
        },
    )

    after = await client.get(
        f"/api/reviews/eligible/room/{seed_data['room2_id']}",
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert after.status_code == 200
    assert after.json()["can_review"] is False
    assert after.json()["has_review"] is True


async def test_review_after_completed_booking(client, guest_token, seed_data, mock_db):
    check_in = date.today() - timedelta(days=10)
    check_out = check_in + timedelta(days=2)
    res = await mock_db["bookings"].insert_one(
        {
            "room_id": seed_data["room2_id"],
            "guest_id": seed_data["guest_id"],
            "host_id": seed_data["host_id"],
            "guest_name": "Test Guest",
            "guest_phone": "9123456789",
            "guest_email": "guest@test.com",
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_out.isoformat(),
            "total_nights": 2,
            "num_guests": 1,
            "base_price": 3500.0,
            "final_price_per_night": 3500.0,
            "price_breakdown": [],
            "subtotal": 7000.0,
            "gst_rate": 0.05,
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
    booking_id = str(res.inserted_id)
    review_res = await client.post(
        "/api/reviews",
        headers={"Authorization": f"Bearer {guest_token}"},
        json={
            "booking_id": booking_id,
            "rating": 5,
            "title": "Great",
            "body": "Loved it very much",
            "would_recommend": True,
            "photos": [],
        },
    )
    assert review_res.status_code == 201


async def test_review_before_checkout_fails(client, guest_token, seed_data):
    res = await client.post(
        "/api/reviews",
        headers={"Authorization": f"Bearer {guest_token}"},
        json={
            "booking_id": seed_data["booking_id"],
            "rating": 5,
            "title": "Too early",
            "body": "Cannot review yet",
            "would_recommend": True,
            "photos": [],
        },
    )
    assert res.status_code == 422


async def test_duplicate_review_fails(client, guest_token, seed_data, mock_db):
    check_in = date.today() - timedelta(days=20)
    check_out = check_in + timedelta(days=2)
    res = await mock_db["bookings"].insert_one(
        {
            "room_id": seed_data["room2_id"],
            "guest_id": seed_data["guest_id"],
            "host_id": seed_data["host_id"],
            "guest_name": "Test Guest",
            "guest_phone": "9123456789",
            "guest_email": "guest@test.com",
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_out.isoformat(),
            "total_nights": 2,
            "num_guests": 1,
            "base_price": 3500.0,
            "final_price_per_night": 3500.0,
            "price_breakdown": [],
            "subtotal": 7000.0,
            "gst_rate": 0.05,
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
    booking_id = str(res.inserted_id)
    payload = {
        "booking_id": booking_id,
        "rating": 4,
        "title": "Good",
        "body": "Nice room overall",
        "would_recommend": True,
        "photos": [],
    }
    await client.post(
        "/api/reviews", headers={"Authorization": f"Bearer {guest_token}"}, json=payload
    )
    dup = await client.post(
        "/api/reviews", headers={"Authorization": f"Bearer {guest_token}"}, json=payload
    )
    assert dup.status_code == 409


async def test_host_can_respond_to_review(
    client, host_token, guest_token, seed_data, mock_db
):
    check_in = date.today() - timedelta(days=25)
    check_out = check_in + timedelta(days=2)
    booking = await mock_db["bookings"].insert_one(
        {
            "room_id": seed_data["room2_id"],
            "guest_id": seed_data["guest_id"],
            "host_id": seed_data["host_id"],
            "guest_name": "Test Guest",
            "guest_phone": "9123456789",
            "guest_email": "guest@test.com",
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_out.isoformat(),
            "total_nights": 2,
            "num_guests": 1,
            "base_price": 3500.0,
            "final_price_per_night": 3500.0,
            "price_breakdown": [],
            "subtotal": 7000.0,
            "gst_rate": 0.05,
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
    booking_id = str(booking.inserted_id)
    review = await client.post(
        "/api/reviews",
        headers={"Authorization": f"Bearer {guest_token}"},
        json={
            "booking_id": booking_id,
            "rating": 5,
            "title": "Super",
            "body": "Excellent stay here",
            "would_recommend": True,
            "photos": [],
        },
    )
    review_id = review.json()["_id"]
    res = await client.patch(
        f"/api/reviews/{review_id}/host-response",
        headers={"Authorization": f"Bearer {host_token}"},
        json={"response": "Thank you for staying with us!"},
    )
    assert res.status_code == 200
    assert res.json()["host_response"] == "Thank you for staying with us!"


async def test_rating_average_updates_on_review(
    client, guest_token, seed_data, mock_db
):
    check_in = date.today() - timedelta(days=15)
    check_out = check_in + timedelta(days=2)
    booking = await mock_db["bookings"].insert_one(
        {
            "room_id": seed_data["room3_id"],
            "guest_id": seed_data["guest_id"],
            "host_id": seed_data["host_id"],
            "guest_name": "Test Guest",
            "guest_phone": "9123456789",
            "guest_email": "guest@test.com",
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_out.isoformat(),
            "total_nights": 2,
            "num_guests": 1,
            "base_price": 950.0,
            "final_price_per_night": 950.0,
            "price_breakdown": [],
            "subtotal": 1900.0,
            "gst_rate": 0.0,
            "gst_amount": 0.0,
            "total_price": 1900.0,
            "offer_code": None,
            "discount_amount": 0.0,
            "payment_status": "paid",
            "status": "completed",
            "invoice_url": None,
            "created_at": utc_now(),
        }
    )
    await client.post(
        "/api/reviews",
        headers={"Authorization": f"Bearer {guest_token}"},
        json={
            "booking_id": str(booking.inserted_id),
            "rating": 4,
            "title": "Good stay",
            "body": "Decent enough room",
            "would_recommend": True,
            "photos": [],
        },
    )
    room = await mock_db["rooms"].find_one({"_id": ObjectId(seed_data["room3_id"])})
    assert room["avg_rating"] == 4.0
    assert room["total_reviews"] == 1
