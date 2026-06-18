from datetime import date, timedelta


async def test_create_booking_success(client, guest_token, seed_data):
    check_in = date.today() + timedelta(days=30)
    check_out = check_in + timedelta(days=2)
    res = await client.post(
        "/api/bookings",
        headers={"Authorization": f"Bearer {guest_token}"},
        json={
            "room_id": seed_data["room2_id"],
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_out.isoformat(),
            "num_guests": 2,
            "booking_for": "self",
        },
    )
    assert res.status_code == 201
    assert res.json()["status"] == "confirmed"


async def test_create_booking_past_date_fails(client, guest_token, seed_data):
    check_in = date.today() - timedelta(days=1)
    check_out = date.today() + timedelta(days=1)
    res = await client.post(
        "/api/bookings",
        headers={"Authorization": f"Bearer {guest_token}"},
        json={
            "room_id": seed_data["room2_id"],
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_out.isoformat(),
            "num_guests": 1,
        },
    )
    assert res.status_code == 422


async def test_create_booking_checkout_before_checkin(client, guest_token, seed_data):
    check_in = date.today() + timedelta(days=5)
    res = await client.post(
        "/api/bookings",
        headers={"Authorization": f"Bearer {guest_token}"},
        json={
            "room_id": seed_data["room2_id"],
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_in.isoformat(),
            "num_guests": 1,
        },
    )
    assert res.status_code == 422


async def test_double_booking_prevention(client, guest_token, seed_data):
    check_in = date.today() + timedelta(days=10)
    check_out = check_in + timedelta(days=2)
    res = await client.post(
        "/api/bookings",
        headers={"Authorization": f"Bearer {guest_token}"},
        json={
            "room_id": seed_data["room1_id"],
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_out.isoformat(),
            "num_guests": 1,
        },
    )
    assert res.status_code == 409


async def test_cancel_booking_success(client, guest_token, seed_data):
    res = await client.delete(
        f"/api/bookings/{seed_data['booking_id']}",
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert res.status_code == 200


async def test_cancel_already_cancelled_fails(client, guest_token, seed_data):
    await client.delete(
        f"/api/bookings/{seed_data['booking_id']}",
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    res = await client.delete(
        f"/api/bookings/{seed_data['booking_id']}",
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert res.status_code == 409


async def test_booking_gst_calculation_correct(client, guest_token, seed_data):
    check_in = date.today() + timedelta(days=40)
    check_out = check_in + timedelta(days=2)
    res = await client.post(
        "/api/bookings",
        headers={"Authorization": f"Bearer {guest_token}"},
        json={
            "room_id": seed_data["room1_id"],
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_out.isoformat(),
            "num_guests": 1,
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["gst_rate"] == 0.12


async def test_booking_total_price_correct(client, guest_token, seed_data):
    # Use a weekday far enough ahead to get early-bird discount without weekend/peak surcharges
    check_in = date.today() + timedelta(days=50)
    while check_in.weekday() in (4, 5) or check_in.month in (12, 1, 3):
        check_in += timedelta(days=1)
    check_out = check_in + timedelta(days=1)
    res = await client.post(
        "/api/bookings",
        headers={"Authorization": f"Bearer {guest_token}"},
        json={
            "room_id": seed_data["room3_id"],
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_out.isoformat(),
            "num_guests": 1,
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["gst_rate"] == 0.0
    assert data["guest_platform_fee"] == round(data["subtotal"] * 0.10, 2)
    assert data["host_platform_fee"] == round(data["subtotal"] * 0.03, 2)
    assert data["host_payout"] == round(data["subtotal"] - data["host_platform_fee"], 2)
    assert data["total_price"] == round(data["subtotal"] + data["guest_platform_fee"], 2)


async def test_waitlist_promoted_on_cancel(client, guest_token, seed_data):
    check_in = date.today() + timedelta(days=10)
    check_out = check_in + timedelta(days=2)
    await client.post(
        "/api/waitlist",
        headers={"Authorization": f"Bearer {guest_token}"},
        json={
            "room_id": seed_data["room1_id"],
            "guest_name": "Wait Guest",
            "guest_phone": "9000000001",
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_out.isoformat(),
        },
    )
    await client.delete(
        f"/api/bookings/{seed_data['booking_id']}",
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    items = await client.get("/api/waitlist/9000000001")
    assert items.status_code == 200
    assert any(i["status"] == "notify" for i in items.json())
