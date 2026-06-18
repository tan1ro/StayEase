"""MongoDB Atlas connection via Motor async driver."""

from __future__ import annotations

import logging
from typing import Any, Awaitable, Callable, TypeVar

from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorClientSession,
    AsyncIOMotorDatabase,
)
from pymongo import ASCENDING

from config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T")

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None
_transactions_available: bool = False


async def _ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    await db["users"].create_index("email", unique=True)
    await db["users"].create_index("referral_code", unique=True)
    await db["offers"].create_index("code", unique=True)
    await db["reviews"].create_index("booking_id", unique=True)
    await db["invoices"].create_index("booking_id", unique=True)
    await db["invoices"].create_index("invoice_number", unique=True)
    await db["bookings"].create_index(
        [
            ("room_id", ASCENDING),
            ("status", ASCENDING),
            ("check_in_date", ASCENDING),
            ("check_out_date", ASCENDING),
        ]
    )
    await db["listing_reports"].create_index(
        [("room_id", ASCENDING), ("reporter_id", ASCENDING)],
        unique=True,
        partialFilterExpression={"status": "open"},
        name="unique_open_report_per_reporter",
    )
    await db["inquiries"].create_index([("guest_id", ASCENDING), ("created_at", ASCENDING)])
    await db["inquiries"].create_index([("host_id", ASCENDING), ("created_at", ASCENDING)])
    await db["waitlist"].create_index(
        [
            ("room_id", ASCENDING),
            ("guest_id", ASCENDING),
            ("check_in_date", ASCENDING),
            ("check_out_date", ASCENDING),
        ],
        unique=True,
        partialFilterExpression={"status": "waiting"},
        name="unique_waiting_entry",
    )
    await db["chat_sessions"].create_index("session_id", unique=True)
    await db["chat_sessions"].create_index([("user_id", ASCENDING), ("updated_at", ASCENDING)])


async def _check_transactions(client: AsyncIOMotorClient) -> bool:
    try:
        hello = await client.admin.command("hello")
        if not hello.get("setName"):
            return False
        async with await client.start_session() as session:
            async with await session.start_transaction():
                pass
        return True
    except Exception:
        logger.info("MongoDB multi-document transactions unavailable; using atomic fallbacks")
        return False


async def connect_db() -> None:
    """Connect to MongoDB Atlas and ensure indexes."""
    global _client, _db, _transactions_available
    _client = AsyncIOMotorClient(settings.MONGO_URI)
    _db = _client[settings.MONGO_DB_NAME]
    await _ensure_indexes(_db)
    _transactions_available = await _check_transactions(_client)
    logger.info("Connected to MongoDB database '%s'", settings.MONGO_DB_NAME)


async def disconnect_db() -> None:
    """Close the MongoDB client connection."""
    global _client, _db, _transactions_available
    if _client is not None:
        _client.close()
    _client = None
    _db = None
    _transactions_available = False
    logger.info("Disconnected from MongoDB")


def get_database() -> AsyncIOMotorDatabase:
    """FastAPI dependency — returns the connected Motor database instance."""
    if _db is None:
        raise RuntimeError("Database not connected. Call connect_db() during application startup.")
    return _db


class Database:
    """Backward-compatible wrapper for services that import `database`."""

    @property
    def db(self) -> AsyncIOMotorDatabase:
        return get_database()

    def collection(self, name: str) -> Any:
        return get_database()[name]

    @property
    def transactions_available(self) -> bool:
        return _transactions_available

    async def connect(self) -> None:
        await connect_db()

    async def disconnect(self) -> None:
        await disconnect_db()

    async def ensure_indexes(self) -> None:
        await _ensure_indexes(get_database())

    async def run_transaction(
        self, callback: Callable[[AsyncIOMotorClientSession | None], Awaitable[T]]
    ) -> T:
        if _client is None:
            raise RuntimeError("Database not connected")
        if _transactions_available:
            async with await _client.start_session() as session:
                async with await session.start_transaction():
                    return await callback(session)
        return await callback(None)


database = Database()
