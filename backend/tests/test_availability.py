from datetime import date, timedelta

from services.availability import blocked_dates_conflict, stay_night_dates


def test_stay_night_dates():
    nights = stay_night_dates(date(2025, 6, 10), date(2025, 6, 13))
    assert nights == ["2025-06-10", "2025-06-11", "2025-06-12"]


def test_blocked_dates_conflict():
    blocked = ["2025-06-11"]
    assert blocked_dates_conflict(blocked, date(2025, 6, 10), date(2025, 6, 12))
    assert not blocked_dates_conflict(blocked, date(2025, 6, 12), date(2025, 6, 14))


def test_booking_ranges_overlap():
    ranges = [("2025-06-10", "2025-06-15")]
    from services.availability import booking_ranges_overlap, find_next_available_stay

    assert booking_ranges_overlap(date(2025, 6, 12), date(2025, 6, 14), ranges)
    assert not booking_ranges_overlap(date(2025, 6, 15), date(2025, 6, 17), ranges)


def test_find_next_available_stay():
    from services.availability import find_next_available_stay

    search_from = date.today() + timedelta(days=10)
    blocked_until = search_from + timedelta(days=3)
    nights = 4
    result = find_next_available_stay(
        blocked_dates=[],
        booking_ranges=[(search_from.isoformat(), blocked_until.isoformat())],
        nights=nights,
        search_from=search_from,
    )
    assert result == (blocked_until, blocked_until + timedelta(days=nights))
