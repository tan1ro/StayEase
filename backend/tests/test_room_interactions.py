async def test_send_room_inquiry(client, guest_token, seed_data):
    res = await client.post(
        f"/api/rooms/{seed_data['room1_id']}/inquiries",
        headers={"Authorization": f"Bearer {guest_token}"},
        json={
            "message": "Hi, is early check-in possible for next weekend?",
            "check_in": None,
            "check_out": None,
        },
    )
    assert res.status_code == 201
    assert res.json()["message"].startswith("Hi")


async def test_report_room(client, guest_token, seed_data):
    res = await client.post(
        f"/api/rooms/{seed_data['room1_id']}/reports",
        headers={"Authorization": f"Bearer {guest_token}"},
        json={
            "reason": "inaccurate",
            "details": "The photos do not match the actual room condition.",
        },
    )
    assert res.status_code == 201
    assert res.json()["status"] == "open"


async def test_duplicate_report_fails(client, guest_token, seed_data):
    payload = {
        "reason": "other",
        "details": "Listing description mentions amenities that are not available.",
    }
    await client.post(
        f"/api/rooms/{seed_data['room1_id']}/reports",
        headers={"Authorization": f"Bearer {guest_token}"},
        json=payload,
    )
    dup = await client.post(
        f"/api/rooms/{seed_data['room1_id']}/reports",
        headers={"Authorization": f"Bearer {guest_token}"},
        json=payload,
    )
    assert dup.status_code == 409
