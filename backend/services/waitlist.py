from __future__ import annotations

from datetime import date
from typing import Any, Optional

from bson import ObjectId

from database import database
from models.common import utc_now


async def find_conflicting_booking(
    room_id: str, check_in: date, check_out: date, *, session=None
) -> Optional[dict[str, Any]]:
    bookings = database.collection("bookings")
    conflict = await bookings.find_one(
        {
            "room_id": room_id,
            "status": {"$in": ["confirmed", "completed"]},
            "check_in_date": {"$lt": check_out.isoformat()},
            "check_out_date": {"$gt": check_in.isoformat()},
        },
        session=session,
    )
    return conflict


async def promote_waitlist_on_cancel(
    room_id: str, check_in: date, check_out: date, *, session=None
) -> Optional[dict]:
    waitlist = database.collection("waitlist")
    entry = await waitlist.find_one_and_update(
        {
            "room_id": room_id,
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_out.isoformat(),
            "status": "waiting",
        },
        {"$set": {"status": "notify", "notified_at": utc_now()}},
        sort=[("created_at", 1)],
        return_document=True,
        session=session,
    )
    return entry
