from services.review_stats import aggregate_reviews_by_room


def test_aggregate_reviews_by_room_groups_and_averages():
    reviews = [
        {"room_id": "room-a", "rating": 5, "created_at": "2026-01-02"},
        {"room_id": "room-a", "rating": 4, "created_at": "2026-01-01"},
        {"room_id": "room-b", "rating": 3, "created_at": "2026-01-03"},
    ]

    grouped = aggregate_reviews_by_room(reviews, reviews_per_room=2)

    assert grouped["room-a"]["total_reviews"] == 2
    assert grouped["room-a"]["avg_rating"] == 4.5
    assert len(grouped["room-a"]["reviews"]) == 2
    assert grouped["room-b"]["total_reviews"] == 1
    assert grouped["room-b"]["avg_rating"] == 3.0
