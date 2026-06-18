from datetime import date, timedelta

from services.gst import calculate_gst
from services.pricing import calculate_dynamic_pricing


def test_weekend_surcharge_applied():
    # 2025-06-13 is Friday, 2025-06-15 is Sunday -> includes Fri+Sat
    result = calculate_dynamic_pricing(
        base_price=1000.0,
        check_in=date(2025, 6, 13),
        check_out=date(2025, 6, 15),
    )
    labels = [i["label"] for i in result["price_breakdown"]]
    assert "Weekend surcharge" in labels


def test_peak_month_surcharge():
    result = calculate_dynamic_pricing(
        base_price=1000.0,
        check_in=date(2025, 12, 10),
        check_out=date(2025, 12, 12),
    )
    labels = [i["label"] for i in result["price_breakdown"]]
    assert "Peak season surcharge" in labels


def test_long_stay_discount():
    result = calculate_dynamic_pricing(
        base_price=1000.0,
        check_in=date(2025, 7, 1),
        check_out=date(2025, 7, 10),
    )
    labels = [i["label"] for i in result["price_breakdown"]]
    assert "Long stay discount" in labels


def test_last_minute_surcharge():
    today = date.today()
    result = calculate_dynamic_pricing(
        base_price=1000.0,
        check_in=today + timedelta(days=1),
        check_out=today + timedelta(days=3),
    )
    labels = [i["label"] for i in result["price_breakdown"]]
    assert "Last minute surcharge" in labels


def test_early_bird_discount():
    result = calculate_dynamic_pricing(
        base_price=1000.0,
        check_in=date.today() + timedelta(days=45),
        check_out=date.today() + timedelta(days=47),
    )
    labels = [i["label"] for i in result["price_breakdown"]]
    assert "Early bird discount" in labels


def test_gst_rate_below_1000():
    gst = calculate_gst(950.0, 2)
    assert gst["gst_rate"] == 0.0


def test_gst_rate_1000_to_7500():
    gst = calculate_gst(3500.0, 2)
    assert gst["gst_rate"] == 0.05


def test_gst_rate_above_7500():
    gst = calculate_gst(8500.0, 1)
    assert gst["gst_rate"] == 0.18
    assert gst["itc_allowed"] is True


def test_gst_rate_standard_itc_not_allowed():
    gst = calculate_gst(3500.0, 2)
    assert gst["itc_allowed"] is False
    assert gst["gst_slab"] == "standard"


def test_gst_long_term_dormitory_exempt():
    gst = calculate_gst(500.0, 90, room_category="Dormitory")
    assert gst["gst_rate"] == 0.0
    assert gst["gst_slab"] == "long_term_rental"


def test_gst_long_term_dormitory_not_exempt_below_90_nights():
    gst = calculate_gst(500.0, 89, room_category="Dormitory")
    assert gst["gst_rate"] == 0.0
    assert gst["gst_slab"] == "budget"


def test_gst_long_term_dormitory_not_exempt_above_monthly_cap():
    gst = calculate_gst(700.0, 90, room_category="Dormitory")
    assert gst["gst_rate"] == 0.0
    assert gst["gst_slab"] == "budget"


def test_offer_code_discount_applied():
    offer = {"code": "TEST10", "type": "percentage", "value": 10, "max_discount": 500}
    result = calculate_dynamic_pricing(
        base_price=2000.0,
        check_in=date(2025, 7, 1),
        check_out=date(2025, 7, 3),
        offer=offer,
    )
    assert result["discount_amount"] > 0


def test_platform_fees_applied():
    result = calculate_dynamic_pricing(
        base_price=2000.0,
        check_in=date(2025, 7, 1),
        check_out=date(2025, 7, 3),
    )
    assert result["guest_platform_fee"] == round(result["subtotal"] * 0.10, 2)
    assert result["host_platform_fee"] == round(result["subtotal"] * 0.03, 2)
    assert result["host_payout"] == round(
        result["subtotal"] - result["host_platform_fee"], 2
    )
    assert result["total_price"] == round(
        result["subtotal"] + result["gst_amount"] + result["guest_platform_fee"], 2
    )
    fee_labels = [i["label"] for i in result["price_breakdown"] if i["type"] == "fee"]
    assert "StayEase service fee" in fee_labels


def test_beach_view_and_sunset_premiums():
    result = calculate_dynamic_pricing(
        base_price=1800.0,
        check_in=date(2025, 7, 1),
        check_out=date(2025, 7, 3),
        view_type="beach_view",
        facing_side="west",
    )
    labels = [i["label"] for i in result["price_breakdown"]]
    assert "Beach view premium" in labels
    assert "Sunset side premium" in labels


def test_mountain_view_and_sunrise_premiums():
    result = calculate_dynamic_pricing(
        base_price=850.0,
        check_in=date(2025, 7, 1),
        check_out=date(2025, 7, 3),
        view_type="hill_view",
        facing_side="east",
    )
    labels = [i["label"] for i in result["price_breakdown"]]
    assert "Mountain view premium" in labels
    assert "Sunrise side premium" in labels


async def test_expired_offer_rejected(client, seed_data, mock_db):
    await mock_db["offers"].insert_one(
        {
            "code": "EXPIRED",
            "type": "percentage",
            "value": 10,
            "max_discount": 100,
            "valid_from": "2020-01-01",
            "valid_until": "2020-12-31",
            "usage_limit": 10,
            "used_count": 0,
            "is_active": True,
            "applicable_rooms": [],
        }
    )
    res = await client.post(
        "/api/pricing/calculate",
        json={
            "room_id": seed_data["room1_id"],
            "check_in": (date.today() + timedelta(days=5)).isoformat(),
            "check_out": (date.today() + timedelta(days=7)).isoformat(),
            "offer_code": "EXPIRED",
        },
    )
    assert res.status_code == 422


async def test_invalid_offer_code_rejected(client, seed_data):
    res = await client.post(
        "/api/pricing/calculate",
        json={
            "room_id": seed_data["room1_id"],
            "check_in": (date.today() + timedelta(days=5)).isoformat(),
            "check_out": (date.today() + timedelta(days=7)).isoformat(),
            "offer_code": "NOPE",
        },
    )
    assert res.status_code == 422
