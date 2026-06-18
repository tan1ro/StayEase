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


async def test_list_sent_inquiries(client, guest_token, seed_data):
    await client.post(
        f"/api/rooms/{seed_data['room1_id']}/inquiries",
        headers={"Authorization": f"Bearer {guest_token}"},
        json={"message": "Another question about parking availability."},
    )
    res = await client.get(
        "/api/inquiries?scope=sent",
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert data[0]["message"]
    assert data[0]["guest_name"]


async def test_list_received_inquiries(client, guest_token, host_token, seed_data):
    await client.post(
        f"/api/rooms/{seed_data['room1_id']}/inquiries",
        headers={"Authorization": f"Bearer {guest_token}"},
        json={"message": "Can we get a late checkout on Sunday please?"},
    )
    res = await client.get(
        "/api/inquiries?scope=received",
        headers={"Authorization": f"Bearer {host_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert any(item["message"].startswith("Can we get a late checkout") for item in data)
    assert any(item.get("room_title") for item in data)


async def test_guest_cannot_list_received_inquiries(client, guest_token):
    res = await client.get(
        "/api/inquiries?scope=received",
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert res.status_code == 403


async def test_host_can_reply_to_inquiry(client, guest_token, host_token, seed_data):
    send = await client.post(
        f"/api/rooms/{seed_data['room1_id']}/inquiries",
        headers={"Authorization": f"Bearer {guest_token}"},
        json={"message": "Is early check-in available this weekend?"},
    )
    assert send.status_code == 201
    inquiry_id = send.json()["_id"]

    reply = await client.post(
        f"/api/inquiries/{inquiry_id}/replies",
        headers={"Authorization": f"Bearer {host_token}"},
        json={"message": "Yes, early check-in from 12 PM is available."},
    )
    assert reply.status_code == 201
    body = reply.json()
    assert len(body["replies"]) == 1
    assert body["replies"][0]["message"].startswith("Yes, early check-in")

    guest_view = await client.get(
        "/api/inquiries?scope=sent",
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert guest_view.status_code == 200
    item = next(row for row in guest_view.json() if row["_id"] == inquiry_id)
    assert item["replies"][0]["sender_role"] == "host"


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
