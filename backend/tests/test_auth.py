from datetime import date, timedelta


async def test_register_success(client):
    res = await client.post(
        "/api/auth/register",
        json={
            "name": "New User",
            "email": "newuser@test.com",
            "phone": "9988776655",
            "password": "Test@1234",
            "role": "tourist",
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@test.com"


async def test_register_duplicate_email_fails(client, seed_data):
    res = await client.post(
        "/api/auth/register",
        json={
            "name": "Dup",
            "email": seed_data["guest_email"],
            "phone": "9988776654",
            "password": "Test@1234",
            "role": "tourist",
        },
    )
    assert res.status_code == 422


async def test_register_invalid_email_format(client):
    res = await client.post(
        "/api/auth/register",
        json={
            "name": "Bad Email",
            "email": "not-an-email",
            "phone": "9988776655",
            "password": "Test@1234",
            "role": "tourist",
        },
    )
    assert res.status_code == 422


async def test_register_weak_password_fails(client):
    res = await client.post(
        "/api/auth/register",
        json={
            "name": "Weak",
            "email": "weak@test.com",
            "phone": "9988776655",
            "password": "weak",
            "role": "tourist",
        },
    )
    assert res.status_code == 422


async def test_login_success_returns_token(client, seed_data):
    res = await client.post(
        "/api/auth/login",
        json={"email": seed_data["guest_email"], "password": seed_data["guest_password"]},
    )
    assert res.status_code == 200
    assert "access_token" in res.json()


async def test_login_wrong_password_fails(client, seed_data):
    res = await client.post(
        "/api/auth/login",
        json={"email": seed_data["guest_email"], "password": "Wrong@1234"},
    )
    assert res.status_code == 401


async def test_get_me_without_token_fails(client):
    res = await client.get("/api/auth/me")
    assert res.status_code == 401


async def test_identity_validation_aadhar_format(client, guest_token):
    res = await client.post(
        "/api/auth/verify-identity",
        headers={"Authorization": f"Bearer {guest_token}"},
        data={"id_type": "aadhar", "id_number": "123"},
    )
    assert res.status_code == 422


async def test_identity_validation_pan_format(client, guest_token):
    res = await client.post(
        "/api/auth/verify-identity",
        headers={"Authorization": f"Bearer {guest_token}"},
        data={"id_type": "pan", "id_number": "INVALID"},
    )
    assert res.status_code == 422
