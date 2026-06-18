from __future__ import annotations

from datetime import date, timedelta
from typing import Any, Optional

DEFAULT_MAX_SEARCH_DAYS = 730


def stay_night_dates(check_in: date, check_out: date) -> list[str]:
    """ISO dates for each night of a stay (check-in inclusive, check-out exclusive)."""
    nights: list[str] = []
    current = check_in
    while current < check_out:
        nights.append(current.isoformat())
        current += timedelta(days=1)
    return nights


def blocked_dates_conflict(
    blocked_dates: list[str] | None, check_in: date, check_out: date
) -> bool:
    blocked = set(blocked_dates or [])
    if not blocked:
        return False
    return any(night in blocked for night in stay_night_dates(check_in, check_out))


def booking_ranges_overlap(
    check_in: date, check_out: date, booking_ranges: list[tuple[str, str]]
) -> bool:
    for start_raw, end_raw in booking_ranges:
        start = (
            date.fromisoformat(start_raw) if isinstance(start_raw, str) else start_raw
        )
        end = date.fromisoformat(end_raw) if isinstance(end_raw, str) else end_raw
        if check_in < end and check_out > start:
            return True
    return False


def is_stay_available(
    *,
    blocked_dates: list[str] | None,
    booking_ranges: list[tuple[str, str]],
    check_in: date,
    check_out: date,
) -> bool:
    if check_out <= check_in:
        return False
    if blocked_dates_conflict(blocked_dates, check_in, check_out):
        return False
    return not booking_ranges_overlap(check_in, check_out, booking_ranges)


def find_next_available_stay(
    *,
    blocked_dates: list[str] | None,
    booking_ranges: list[tuple[str, str]],
    nights: int,
    search_from: date,
    max_search_days: int = DEFAULT_MAX_SEARCH_DAYS,
) -> Optional[tuple[date, date]]:
    if nights <= 0:
        return None
    start = max(search_from, date.today())
    for offset in range(max_search_days):
        check_in = start + timedelta(days=offset)
        check_out = check_in + timedelta(days=nights)
        if is_stay_available(
            blocked_dates=blocked_dates,
            booking_ranges=booking_ranges,
            check_in=check_in,
            check_out=check_out,
        ):
            return check_in, check_out
    return None


def find_next_available_for_room_sets(
    room_sets: list[dict[str, Any]],
    *,
    nights: int,
    search_from: date,
    max_search_days: int = DEFAULT_MAX_SEARCH_DAYS,
) -> Optional[tuple[date, date]]:
    """Return the next stay window when every room in room_sets is available."""
    if not room_sets or nights <= 0:
        return None
    start = max(search_from, date.today())
    for offset in range(max_search_days):
        check_in = start + timedelta(days=offset)
        check_out = check_in + timedelta(days=nights)
        if all(
            is_stay_available(
                blocked_dates=room.get("blocked_dates"),
                booking_ranges=room.get("booking_ranges", []),
                check_in=check_in,
                check_out=check_out,
            )
            for room in room_sets
        ):
            return check_in, check_out
    return None


def find_next_available_any_room(
    room_sets: list[dict[str, Any]],
    *,
    nights: int,
    search_from: date,
    max_search_days: int = DEFAULT_MAX_SEARCH_DAYS,
) -> Optional[tuple[date, date, dict[str, Any]]]:
    """Return the next stay window when at least one room in room_sets is available."""
    if not room_sets or nights <= 0:
        return None
    start = max(search_from, date.today())
    for offset in range(max_search_days):
        check_in = start + timedelta(days=offset)
        check_out = check_in + timedelta(days=nights)
        for room in room_sets:
            if is_stay_available(
                blocked_dates=room.get("blocked_dates"),
                booking_ranges=room.get("booking_ranges", []),
                check_in=check_in,
                check_out=check_out,
            ):
                return check_in, check_out, room
    return None
