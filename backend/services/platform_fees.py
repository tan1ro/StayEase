from __future__ import annotations

from config import settings


def calculate_platform_fees(subtotal: float) -> dict[str, float]:
    """Compute guest service fee (added to guest total) and host service fee (deducted from payout)."""
    guest_rate = settings.GUEST_PLATFORM_FEE_PERCENT / 100
    host_rate = settings.HOST_PLATFORM_FEE_PERCENT / 100
    guest_platform_fee = round(subtotal * guest_rate, 2)
    host_platform_fee = round(subtotal * host_rate, 2)
    host_payout = round(subtotal - host_platform_fee, 2)
    return {
        "guest_platform_fee": guest_platform_fee,
        "host_platform_fee": host_platform_fee,
        "host_payout": host_payout,
        "guest_platform_fee_percent": settings.GUEST_PLATFORM_FEE_PERCENT,
        "host_platform_fee_percent": settings.HOST_PLATFORM_FEE_PERCENT,
    }
