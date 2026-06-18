"""Delete all users and every collection that stores user-generated data."""

from __future__ import annotations

import asyncio

from config import settings
from database import connect_db, disconnect_db, get_database

# Collections that hold user accounts or data tied to users/hosts/guests.
USER_DATA_COLLECTIONS = (
    "users",
    "bookings",
    "reviews",
    "invoices",
    "inquiries",
    "notifications",
    "waitlist",
    "chat_sessions",
    "listing_reports",
    "rooms",
    "offers",
)


async def clear_user_data() -> None:
    await connect_db()
    db = get_database()
    print(f"Clearing user data in database '{settings.MONGO_DB_NAME}'...")
    print("—" * 40)
    for name in USER_DATA_COLLECTIONS:
        result = await db[name].delete_many({})
        print(f"  {name:<20} {result.deleted_count:>6} deleted")
    print("—" * 40)
    print("Done. All users and related data removed.")
    await disconnect_db()


if __name__ == "__main__":
    asyncio.run(clear_user_data())
