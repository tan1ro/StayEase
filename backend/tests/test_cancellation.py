from datetime import date, timedelta

from services.cancellation import calculate_cancellation


def test_flexible_full_refund():
    result = calculate_cancellation(
        total_price=5000.0,
        check_in_date=date.today() + timedelta(days=3),
        cancellation_policy="flexible",
        payment_status="paid",
    )
    assert result["refund_amount"] == 5000.0
    assert result["cancellation_charge"] == 0.0


def test_flexible_half_refund_within_24h():
    result = calculate_cancellation(
        total_price=5000.0,
        check_in_date=date.today(),
        cancellation_policy="flexible",
        payment_status="paid",
    )
    assert result["refund_amount"] == 2500.0
    assert result["cancellation_charge"] == 2500.0


def test_moderate_full_refund_5_days():
    result = calculate_cancellation(
        total_price=3000.0,
        check_in_date=date.today() + timedelta(days=6),
        cancellation_policy="moderate",
        payment_status="paid",
    )
    assert result["refund_amount"] == 3000.0
    assert result["cancellation_charge"] == 0.0


def test_moderate_half_refund_2_days():
    result = calculate_cancellation(
        total_price=3000.0,
        check_in_date=date.today() + timedelta(days=2),
        cancellation_policy="moderate",
        payment_status="paid",
    )
    assert result["refund_amount"] == 1500.0
    assert result["cancellation_charge"] == 1500.0


def test_moderate_no_refund_same_day():
    result = calculate_cancellation(
        total_price=3000.0,
        check_in_date=date.today(),
        cancellation_policy="moderate",
        payment_status="paid",
    )
    assert result["refund_amount"] == 0.0
    assert result["cancellation_charge"] == 3000.0


def test_strict_half_refund_7_days():
    result = calculate_cancellation(
        total_price=8000.0,
        check_in_date=date.today() + timedelta(days=10),
        cancellation_policy="strict",
        payment_status="paid",
    )
    assert result["refund_amount"] == 4000.0
    assert result["cancellation_charge"] == 4000.0


def test_strict_no_refund_within_7_days():
    result = calculate_cancellation(
        total_price=8000.0,
        check_in_date=date.today() + timedelta(days=3),
        cancellation_policy="strict",
        payment_status="paid",
    )
    assert result["refund_amount"] == 0.0
    assert result["cancellation_charge"] == 8000.0


def test_pending_payment_no_charge():
    result = calculate_cancellation(
        total_price=2000.0,
        check_in_date=date.today() + timedelta(days=1),
        cancellation_policy="strict",
        payment_status="pending",
    )
    assert result["refund_amount"] == 0.0
    assert result["cancellation_charge"] == 0.0
    assert "no charge" in result["reason"].lower()


async def test_cancellation_preview_endpoint(client, guest_token, seed_data):
    res = await client.get(
        f"/api/bookings/{seed_data['booking_id']}/cancellation-preview",
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["cancellation_charge"] == 0.0
    assert "no charge" in data["reason"].lower()


async def test_cancel_stores_refund_fields(client, guest_token, seed_data):
    res = await client.delete(
        f"/api/bookings/{seed_data['booking_id']}",
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["cancellation"]["cancellation_charge"] == 0.0
    assert body["booking"]["status"] == "cancelled"
    assert body["booking"]["refund_status"] == "not_charged"


async def test_cancel_paid_booking_partial_refund(client, guest_token, seed_data):
    from database import database

    check_in = date.today() + timedelta(days=2)
    booking = await database.collection("bookings").insert_one(
        {
            "room_id": seed_data["room1_id"],
            "guest_id": seed_data["guest_id"],
            "host_id": seed_data["host_id"],
            "guest_name": "Test Guest",
            "guest_phone": "9123456789",
            "guest_email": "guest@test.com",
            "check_in_date": check_in.isoformat(),
            "check_out_date": (check_in + timedelta(days=2)).isoformat(),
            "total_nights": 2,
            "num_guests": 1,
            "base_price": 1200.0,
            "final_price_per_night": 1200.0,
            "price_breakdown": [],
            "subtotal": 2400.0,
            "gst_rate": 0.12,
            "gst_amount": 288.0,
            "total_price": 2688.0,
            "payment_status": "paid",
            "status": "confirmed",
            "cancellation_policy": "moderate",
            "invoice_url": None,
        }
    )
    booking_id = str(booking.inserted_id)

    preview = await client.get(
        f"/api/bookings/{booking_id}/cancellation-preview",
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert preview.status_code == 200
    assert preview.json()["refund_amount"] == 1344.0

    res = await client.delete(
        f"/api/bookings/{booking_id}",
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert res.status_code == 200
    assert res.json()["booking"]["payment_status"] == "partial_refund"
    assert res.json()["booking"]["cancellation_charge"] == 1344.0
