from __future__ import annotations

from datetime import date, timedelta


def stay_night_dates(check_in: date, check_out: date) -> list[str]:
    """ISO dates for each night of a stay (check-in inclusive, check-out exclusive)."""
    nights: list[str] = []
    current = check_in
    while current < check_out:
        nights.append(current.isoformat())
        current += timedelta(days=1)
    return nights


def blocked_dates_conflict(blocked_dates: list[str] | None, check_in: date, check_out: date) -> bool:
    blocked = set(blocked_dates or [])
    if not blocked:
        return False
    return any(night in blocked for night in stay_night_dates(check_in, check_out))
