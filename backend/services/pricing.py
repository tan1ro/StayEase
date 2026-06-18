from __future__ import annotations

from datetime import date, timedelta
from typing import Any, Optional

from services.gst import calculate_gst
from services.platform_fees import calculate_platform_fees


PEAK_MONTHS = {12, 1, 3}

VIEW_PREMIUMS: dict[str, float] = {
    "beach_view": 600.0,
    "sea_view": 500.0,
    "hill_view": 350.0,
    "pool_view": 250.0,
    "garden_view": 150.0,
    "city_view": 0.0,
}

VIEW_PREMIUM_LABELS: dict[str, str] = {
    "beach_view": "Beach view premium",
    "sea_view": "Sea view premium",
    "hill_view": "Mountain view premium",
    "pool_view": "Pool view premium",
    "garden_view": "Garden view premium",
}

SUNRISE_FACING = {"east", "north_east", "south_east"}
SUNSET_FACING = {"west", "north_west", "south_west"}
SUNRISE_PREMIUM_PER_NIGHT = 250.0
SUNSET_PREMIUM_PER_NIGHT = 250.0


def _iter_nights(check_in: date, check_out: date) -> list[date]:
    nights = []
    current = check_in
    while current < check_out:
        nights.append(current)
        current += timedelta(days=1)
    return nights


def calculate_dynamic_pricing(
    *,
    base_price: float,
    check_in: date,
    check_out: date,
    offer: Optional[dict[str, Any]] = None,
    referral_credits: float = 0.0,
    view_type: Optional[str] = None,
    facing_side: Optional[str] = None,
) -> dict[str, Any]:
    nights_list = _iter_nights(check_in, check_out)
    total_nights = len(nights_list)
    if total_nights <= 0:
        raise ValueError("Invalid date range")

    line_items: list[dict[str, Any]] = []
    subtotal_before_adjustments = base_price * total_nights
    line_items.append(
        {"label": "Base price", "amount": round(subtotal_before_adjustments, 2), "type": "base"}
    )

    adjustments = 0.0

    view_key = (view_type or "none").lower()
    view_premium_rate = VIEW_PREMIUMS.get(view_key, 0.0)
    if view_premium_rate > 0:
        view_premium = view_premium_rate * total_nights
        adjustments += view_premium
        line_items.append(
            {
                "label": VIEW_PREMIUM_LABELS.get(view_key, "View premium"),
                "amount": round(view_premium, 2),
                "type": "surcharge",
            }
        )

    facing = (facing_side or "none").lower()
    if facing in SUNRISE_FACING:
        sunrise_premium = SUNRISE_PREMIUM_PER_NIGHT * total_nights
        adjustments += sunrise_premium
        line_items.append(
            {
                "label": "Sunrise side premium",
                "amount": round(sunrise_premium, 2),
                "type": "surcharge",
            }
        )
    elif facing in SUNSET_FACING:
        sunset_premium = SUNSET_PREMIUM_PER_NIGHT * total_nights
        adjustments += sunset_premium
        line_items.append(
            {
                "label": "Sunset side premium",
                "amount": round(sunset_premium, 2),
                "type": "surcharge",
            }
        )

    weekend_nights = sum(1 for n in nights_list if n.weekday() in (4, 5))
    if weekend_nights:
        weekend_surcharge = base_price * 0.20 * weekend_nights
        adjustments += weekend_surcharge
        line_items.append(
            {
                "label": "Weekend surcharge",
                "amount": round(weekend_surcharge, 2),
                "type": "surcharge",
            }
        )

    peak_nights = sum(1 for n in nights_list if n.month in PEAK_MONTHS)
    if peak_nights:
        peak_surcharge = base_price * 0.30 * peak_nights
        adjustments += peak_surcharge
        line_items.append(
            {
                "label": "Peak season surcharge",
                "amount": round(peak_surcharge, 2),
                "type": "surcharge",
            }
        )

    if total_nights >= 7:
        long_stay_discount = base_price * 0.10 * total_nights
        adjustments -= long_stay_discount
        line_items.append(
            {
                "label": "Long stay discount",
                "amount": round(-long_stay_discount, 2),
                "type": "discount",
            }
        )

    days_ahead = (check_in - date.today()).days
    if days_ahead <= 2:
        last_minute = base_price * 0.15 * total_nights
        adjustments += last_minute
        line_items.append(
            {
                "label": "Last minute surcharge",
                "amount": round(last_minute, 2),
                "type": "surcharge",
            }
        )
    elif days_ahead >= 30:
        early_bird = base_price * 0.05 * total_nights
        adjustments -= early_bird
        line_items.append(
            {
                "label": "Early bird discount",
                "amount": round(-early_bird, 2),
                "type": "discount",
            }
        )

    subtotal = subtotal_before_adjustments + adjustments
    discount_amount = 0.0

    if offer:
        if offer["type"] == "percentage":
            discount_amount = min(
                subtotal * (offer["value"] / 100),
                offer.get("max_discount") or subtotal,
            )
        else:
            discount_amount = min(offer["value"], subtotal)
        line_items.append(
            {
                "label": f"Offer ({offer['code']})",
                "amount": round(-discount_amount, 2),
                "type": "discount",
            }
        )
        subtotal -= discount_amount

    referral_credit_used = 0.0
    if referral_credits > 0:
        referral_credit_used = min(referral_credits, subtotal)
        subtotal -= referral_credit_used
        line_items.append(
            {
                "label": "Referral credit",
                "amount": round(-referral_credit_used, 2),
                "type": "discount",
            }
        )

    final_price_per_night = subtotal / total_nights if total_nights else base_price
    gst = calculate_gst(final_price_per_night, total_nights)
    fees = calculate_platform_fees(subtotal)

    line_items.append(
        {
            "label": "StayEase service fee",
            "amount": fees["guest_platform_fee"],
            "type": "fee",
        }
    )

    return {
        "total_nights": total_nights,
        "base_price": base_price,
        "final_price_per_night": round(final_price_per_night, 2),
        "price_breakdown": line_items,
        "subtotal": round(subtotal, 2),
        "discount_amount": round(discount_amount, 2),
        "referral_credit_used": round(referral_credit_used, 2),
        "guest_platform_fee": fees["guest_platform_fee"],
        "host_platform_fee": fees["host_platform_fee"],
        "host_payout": fees["host_payout"],
        "guest_platform_fee_percent": fees["guest_platform_fee_percent"],
        "host_platform_fee_percent": fees["host_platform_fee_percent"],
        "gst_rate": gst["gst_rate"],
        "gst_amount": gst["total_gst"],
        "cgst_amount": gst["cgst_amount"],
        "sgst_amount": gst["sgst_amount"],
        "total_price": round(gst["grand_total"] + fees["guest_platform_fee"], 2),
        "gst_breakdown": gst,
    }
