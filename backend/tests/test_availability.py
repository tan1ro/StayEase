from datetime import date, timedelta

from services.availability import blocked_dates_conflict, stay_night_dates


def test_stay_night_dates():
    nights = stay_night_dates(date(2025, 6, 10), date(2025, 6, 13))
    assert nights == ["2025-06-10", "2025-06-11", "2025-06-12"]


def test_blocked_dates_conflict():
    blocked = ["2025-06-11"]
    assert blocked_dates_conflict(blocked, date(2025, 6, 10), date(2025, 6, 12))
    assert not blocked_dates_conflict(blocked, date(2025, 6, 12), date(2025, 6, 14))
