from datetime import date, timedelta


ROOM_PAYLOAD = {
    "room_number": "999",
    "title": "New Test Room Title",
    "description": "A brand new test room with sufficient description length for validation rules.",
    "room_category": "Single",
    "bed_configuration": "single_bed",
    "price_per_night": 1500.0,
    "amenities": ["WiFi"],
    "is_available": True,
    "max_guests": 2,
    "location": {"city": "Bangalore", "area": "Test", "lat": 12.9, "lng": 77.6, "address": "Test Addr"},
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
}


async def test_create_room_as_host(client, host_token):
    res = await client.post(
        "/api/rooms",
        headers={"Authorization": f"Bearer {host_token}"},
        json=ROOM_PAYLOAD,
    )
    assert res.status_code == 201
    body = res.json()
    assert body["_id"]
    assert body["_id"] != "None"
    assert len(body["_id"]) == 24


async def test_create_room_as_guest_forbidden(client, guest_token):
    res = await client.post(
        "/api/rooms",
        headers={"Authorization": f"Bearer {guest_token}"},
        json=ROOM_PAYLOAD,
    )
    assert res.status_code == 403


async def test_get_all_rooms(client, seed_data):
    res = await client.get("/api/rooms")
    assert res.status_code == 200
    assert len(res.json()) >= 3


async def test_get_room_by_id(client, seed_data):
    res = await client.get(f"/api/rooms/{seed_data['room1_id']}")
    assert res.status_code == 200
    assert res.json()["title"] == "Veg Hill Room"


async def test_filter_rooms_by_type(client, seed_data):
    res = await client.get("/api/rooms", params={"type": "Single"})
    assert res.status_code == 200
    assert all(r["room_category"] == "Single" for r in res.json())


async def test_filter_rooms_by_food_preference_veg(client, seed_data):
    res = await client.get("/api/rooms", params={"food": "veg"})
    assert all(r["food_preference"] == "veg" for r in res.json())


async def test_filter_rooms_by_food_preference_nonveg(client, seed_data):
    res = await client.get("/api/rooms", params={"food": "nonveg"})
    assert all(r["food_preference"] == "nonveg" for r in res.json())


async def test_filter_rooms_by_smoking_policy(client, seed_data):
    res = await client.get("/api/rooms", params={"smoking": "non_smoking"})
    assert all(r["smoking_policy"] == "non_smoking" for r in res.json())


async def test_filter_rooms_by_alcohol_policy(client, seed_data):
    res = await client.get("/api/rooms", params={"alcohol": "non_alcohol"})
    assert all(r["alcohol_policy"] == "non_alcohol" for r in res.json())


async def test_filter_rooms_by_view_type(client, seed_data):
    res = await client.get("/api/rooms", params={"view": "hill_view"})
    assert all(r["view_type"] == "hill_view" for r in res.json())


async def test_filter_rooms_by_balcony(client, seed_data):
    res = await client.get("/api/rooms", params={"balcony": True})
    assert all(r["has_balcony"] is True for r in res.json())


async def test_filter_rooms_combined_food_and_view(client, seed_data):
    res = await client.get("/api/rooms", params={"food": "veg", "view": "hill_view"})
    data = res.json()
    assert all(r["food_preference"] == "veg" and r["view_type"] == "hill_view" for r in data)


async def test_filter_available_rooms(client, seed_data):
    res = await client.get("/api/rooms", params={"available": True})
    assert all(r["is_available"] is True for r in res.json())


async def test_update_room_by_owner(client, host_token, seed_data):
    res = await client.patch(
        f"/api/rooms/{seed_data['room1_id']}",
        headers={"Authorization": f"Bearer {host_token}"},
        json={"title": "Updated Veg Hill Room Title"},
    )
    assert res.status_code == 200
    assert res.json()["title"] == "Updated Veg Hill Room Title"


async def test_update_room_by_non_owner_forbidden(client, guest_token, seed_data):
    res = await client.patch(
        f"/api/rooms/{seed_data['room1_id']}",
        headers={"Authorization": f"Bearer {guest_token}"},
        json={"title": "Hacked Title Here"},
    )
    assert res.status_code == 403


async def test_delete_room_with_active_booking_fails(client, host_token, seed_data):
    res = await client.delete(
        f"/api/rooms/{seed_data['room1_id']}",
        headers={"Authorization": f"Bearer {host_token}"},
    )
    assert res.status_code == 409


async def test_upload_room_photo(client, host_token, seed_data, monkeypatch):
    async def mock_upload(file):
        return {"url": "https://example.com/photo.jpg", "public_id": "test/photo"}

    monkeypatch.setattr("routes.rooms.upload_image", mock_upload)
    files = {"file": ("test.jpg", b"fake-image", "image/jpeg")}
    res = await client.post(
        f"/api/rooms/{seed_data['room1_id']}/photos",
        headers={"Authorization": f"Bearer {host_token}"},
        files=files,
    )
    assert res.status_code == 200


async def test_delete_room_photo_with_folder_public_id(client, host_token, seed_data, monkeypatch):
    public_id = "stayease/images/sample-photo"

    async def mock_upload(file):
        return {"url": "https://example.com/photo.jpg", "public_id": public_id}

    monkeypatch.setattr("routes.rooms.upload_image", mock_upload)
    files = {"file": ("test.jpg", b"fake-image", "image/jpeg")}
    upload_res = await client.post(
        f"/api/rooms/{seed_data['room1_id']}/photos",
        headers={"Authorization": f"Bearer {host_token}"},
        files=files,
    )
    assert upload_res.status_code == 200

    deleted = []

    def mock_delete(pid, resource_type="image"):
        deleted.append((pid, resource_type))

    monkeypatch.setattr("routes.rooms.delete_asset", mock_delete)

    res = await client.delete(
        f"/api/rooms/{seed_data['room1_id']}/photos/{public_id}",
        headers={"Authorization": f"Bearer {host_token}"},
    )
    assert res.status_code == 200
    assert deleted == [(public_id, "image")]

    room = await client.get(f"/api/rooms/{seed_data['room1_id']}")
    assert room.json().get("photos") == []


async def test_filter_rooms_by_nearby_coordinates(client, seed_data):
    res = await client.get(
        "/api/rooms",
        params={"lat": 12.9352, "lng": 77.6245, "radius_km": 10},
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert all("distance_km" in room for room in data)
    assert data[0]["distance_km"] <= 10
