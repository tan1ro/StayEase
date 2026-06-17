from __future__ import annotations

from datetime import date
from typing import Any

POLICY_DESCRIPTIONS = {
    "flexible": (
        "Full refund if cancelled at least 24 hours before check-in. "
        "If cancelled within 24 hours, 50% of the total stay amount is charged."
    ),
    "moderate": (
        "Full refund if cancelled 5 or more days before check-in. "
        "50% refund if cancelled between 24 hours and 5 days before check-in. "
        "No refund if cancelled within 24 hours of check-in."
    ),
    "strict": (
        "50% refund if cancelled 7 or more days before check-in. "
        "No refund if cancelled within 7 days of check-in."
    ),
}


def calculate_cancellation(
    *,
    total_price: float,
    check_in_date: date,
    cancellation_policy: str = "moderate",
    payment_status: str = "pending",
    cancelled_at: date | None = None,
) -> dict[str, Any]:
    """Compute refund and cancellation charges per listing policy."""
    cancelled_at = cancelled_at or date.today()
    days_until_checkin = (check_in_date - cancelled_at).days
    policy = cancellation_policy if cancellation_policy in POLICY_DESCRIPTIONS else "moderate"

    if payment_status == "pending":
        return {
            "cancellation_policy": policy,
            "policy_description": POLICY_DESCRIPTIONS[policy],
            "days_until_checkin": days_until_checkin,
            "refund_percentage": 1.0,
            "refund_amount": 0.0,
            "cancellation_charge": 0.0,
            "total_price": round(total_price, 2),
            "reason": "Booking cancelled before payment — no charge applied",
            "payment_status": payment_status,
        }

    refund_pct = 0.0
    reason = ""

    if policy == "flexible":
        if days_until_checkin >= 1:
            refund_pct = 1.0
            reason = "Cancelled 24+ hours before check-in — full refund"
        else:
            refund_pct = 0.5
            reason = "Cancelled within 24 hours of check-in — 50% cancellation charge"
    elif policy == "moderate":
        if days_until_checkin >= 5:
            refund_pct = 1.0
            reason = "Cancelled 5+ days before check-in — full refund"
        elif days_until_checkin >= 1:
            refund_pct = 0.5
            reason = "Cancelled 1–5 days before check-in — 50% refund"
        else:
            refund_pct = 0.0
            reason = "Cancelled within 24 hours of check-in — no refund"
    else:  # strict
        if days_until_checkin >= 7:
            refund_pct = 0.5
            reason = "Cancelled 7+ days before check-in — 50% refund"
        else:
            refund_pct = 0.0
            reason = "Cancelled within 7 days of check-in — no refund"

    refund_amount = round(total_price * refund_pct, 2)
    cancellation_charge = round(total_price - refund_amount, 2)

    return {
        "cancellation_policy": policy,
        "policy_description": POLICY_DESCRIPTIONS[policy],
        "days_until_checkin": days_until_checkin,
        "refund_percentage": refund_pct,
        "refund_amount": refund_amount,
        "cancellation_charge": cancellation_charge,
        "total_price": round(total_price, 2),
        "reason": reason,
        "payment_status": payment_status,
    }
