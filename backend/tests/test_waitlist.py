from datetime import date, timedelta


async def test_join_waitlist_on_conflict(client, guest_token, seed_data):
    check_in = date.today() + timedelta(days=10)
    check_out = check_in + timedelta(days=2)
    res = await client.post(
        "/api/waitlist",
        headers={"Authorization": f"Bearer {guest_token}"},
        json={
            "room_id": seed_data["room1_id"],
            "guest_name": "Wait Guest",
            "guest_phone": "9000000099",
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_out.isoformat(),
        },
    )
    assert res.status_code == 201
    assert res.json()["status"] == "waiting"


async def test_waitlist_promoted_on_cancel(client, guest_token, seed_data):
    check_in = date.today() + timedelta(days=10)
    check_out = check_in + timedelta(days=2)
    await client.post(
        "/api/waitlist",
        headers={"Authorization": f"Bearer {guest_token}"},
        json={
            "room_id": seed_data["room1_id"],
            "guest_name": "Promote Guest",
            "guest_phone": "9000000088",
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_out.isoformat(),
        },
    )
    await client.delete(
        f"/api/bookings/{seed_data['booking_id']}",
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    res = await client.get("/api/waitlist/9000000088")
    assert any(e["status"] == "notify" for e in res.json())


async def test_check_waitlist_by_phone(client, guest_token, seed_data):
    check_in = date.today() + timedelta(days=20)
    check_out = check_in + timedelta(days=2)
    phone = "9000000077"
    await client.post(
        "/api/waitlist",
        headers={"Authorization": f"Bearer {guest_token}"},
        json={
            "room_id": seed_data["room2_id"],
            "guest_name": "Phone Guest",
            "guest_phone": phone,
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_out.isoformat(),
        },
    )
    res = await client.get(f"/api/waitlist/{phone}")
    assert res.status_code == 200
    assert len(res.json()) >= 1
