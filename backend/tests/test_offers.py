from datetime import date, timedelta

from models.common import utc_now


OFFER_PAYLOAD = {
    "code": "NEWCODE10",
    "type": "percentage",
    "value": 10.0,
    "min_booking_amount": 1000.0,
    "max_discount": 500.0,
    "valid_from": (date.today() - timedelta(days=1)).isoformat(),
    "valid_until": (date.today() + timedelta(days=90)).isoformat(),
    "usage_limit": 100,
    "applicable_rooms": [],
    "is_active": True,
}


async def test_create_offer_as_host(client, host_token):
    res = await client.post(
        "/api/offers",
        headers={"Authorization": f"Bearer {host_token}"},
        json=OFFER_PAYLOAD,
    )
    assert res.status_code == 201


async def test_validate_valid_offer_code(client, host_token, mock_db):
    await mock_db["offers"].insert_one(
        {
            **OFFER_PAYLOAD,
            "code": "VALID10",
            "host_id": None,
            "used_count": 0,
            "valid_from": (date.today() - timedelta(days=1)).isoformat(),
            "valid_until": (date.today() + timedelta(days=30)).isoformat(),
            "created_at": utc_now(),
        }
    )
    res = await client.post(
        "/api/offers/validate",
        json={"code": "VALID10", "room_id": "abc", "amount": 5000.0},
    )
    assert res.status_code == 200
    assert res.json()["valid"] is True


async def test_validate_expired_offer_fails(client, mock_db):
    await mock_db["offers"].insert_one(
        {
            "code": "OLDOFFER",
            "type": "flat",
            "value": 100,
            "min_booking_amount": 0,
            "max_discount": 100,
            "valid_from": "2020-01-01",
            "valid_until": "2020-12-31",
            "usage_limit": 10,
            "used_count": 0,
            "is_active": True,
            "applicable_rooms": [],
            "created_at": utc_now(),
        }
    )
    res = await client.post(
        "/api/offers/validate",
        json={"code": "OLDOFFER", "room_id": "abc", "amount": 5000.0},
    )
    assert res.status_code == 422


async def test_validate_over_limit_offer_fails(client, mock_db):
    await mock_db["offers"].insert_one(
        {
            "code": "MAXED",
            "type": "flat",
            "value": 100,
            "min_booking_amount": 0,
            "max_discount": 100,
            "valid_from": (date.today() - timedelta(days=1)).isoformat(),
            "valid_until": (date.today() + timedelta(days=30)).isoformat(),
            "usage_limit": 1,
            "used_count": 1,
            "is_active": True,
            "applicable_rooms": [],
            "created_at": utc_now(),
        }
    )
    res = await client.post(
        "/api/offers/validate",
        json={"code": "MAXED", "room_id": "abc", "amount": 5000.0},
    )
    assert res.status_code == 422


async def test_referral_credit_on_register(client, mock_db):
    await mock_db["users"].insert_one(
        {
            "name": "Referrer",
            "email": "referrer@test.com",
            "phone": "9111111111",
            "password_hash": "x",
            "role": "tourist",
            "referral_code": "REFCODE1",
            "referral_credits": 0.0,
            "wishlist": [],
            "notification_prefs": {"email": True, "whatsapp": False},
            "email_verified": True,
            "created_at": utc_now(),
        }
    )
    res = await client.post(
        "/api/auth/register",
        json={
            "name": "Referred",
            "email": "referred@test.com",
            "phone": "9222222222",
            "password": "Test@1234",
            "role": "tourist",
            "referred_by": "REFCODE1",
        },
    )
    assert res.status_code == 201
    referrer = await mock_db["users"].find_one({"referral_code": "REFCODE1"})
    assert referrer["referral_credits"] == 200.0


async def test_referral_code_uniqueness(client):
    codes = set()
    for i in range(3):
        res = await client.post(
            "/api/auth/register",
            json={
                "name": f"User {i}",
                "email": f"user{i}@unique.com",
                "phone": f"900000000{i}",
                "password": "Test@1234",
                "role": "tourist",
            },
        )
        codes.add(res.json()["user"]["referral_code"])
    assert len(codes) == 3
