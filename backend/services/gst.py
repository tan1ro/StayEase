from __future__ import annotations

LONG_TERM_RENTAL_CATEGORIES = frozenset({"Dormitory"})
LONG_TERM_MIN_NIGHTS = 90
LONG_TERM_MONTHLY_CAP_PER_PERSON = 20_000.0


def _standard_gst_rate(price_per_night: float) -> tuple[float, bool]:
    if price_per_night < 1000:
        return 0.0, False
    if price_per_night <= 7500:
        return 0.05, False
    return 0.18, True


def _long_term_rental_exempt(
    *,
    price_per_night: float,
    nights: int,
    room_category: str | None,
) -> bool:
    if room_category not in LONG_TERM_RENTAL_CATEGORIES:
        return False
    if nights < LONG_TERM_MIN_NIGHTS:
        return False
    monthly_per_person = price_per_night * 30
    return monthly_per_person <= LONG_TERM_MONTHLY_CAP_PER_PERSON


def calculate_gst(
    price_per_night: float,
    nights: int,
    *,
    room_category: str | None = None,
) -> dict:
    subtotal = price_per_night * nights
    if _long_term_rental_exempt(
        price_per_night=price_per_night,
        nights=nights,
        room_category=room_category,
    ):
        rate = 0.0
        itc_allowed = False
        slab = "long_term_rental"
    else:
        rate, itc_allowed = _standard_gst_rate(price_per_night)
        if rate == 0.0:
            slab = "budget"
        elif rate == 0.05:
            slab = "standard"
        else:
            slab = "premium"

    gst = subtotal * rate
    half = gst / 2
    return {
        "subtotal": round(subtotal, 2),
        "gst_rate": rate,
        "cgst_rate": rate / 2,
        "cgst_amount": round(half, 2),
        "sgst_rate": rate / 2,
        "sgst_amount": round(half, 2),
        "total_gst": round(gst, 2),
        "grand_total": round(subtotal + gst, 2),
        "itc_allowed": itc_allowed,
        "gst_slab": slab,
    }
