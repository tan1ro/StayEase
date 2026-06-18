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


def get_database() -> AsyncIOMotorDatabase:
    """FastAPI dependency — returns the connected Motor database instance."""
    if _db is None:
        raise RuntimeError("Database not connected. Call connect_db() during application startup.")
    return _db


async def connect_db() -> None:
    global _client, _db, _transactions_available
    _client = AsyncIOMotorClient(settings.MONGO_URI)
    _db = _client[settings.MONGO_DB_NAME]
    if settings.MONGO_REPLICA_SET_INIT:
        await _init_replica_set()
    await ensure_indexes()
    _transactions_available = await _check_transactions()
    logger.info("Connected to MongoDB database %s", settings.MONGO_DB_NAME)


async def disconnect_db() -> None:
    global _client, _db, _transactions_available
    if _client is not None:
        _client.close()
    _client = None
    _db = None
    _transactions_available = False
    logger.info("Disconnected from MongoDB")


async def ensure_indexes() -> None:
    db = get_database()
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


async def run_transaction(
    callback: Callable[[AsyncIOMotorClientSession | None], Awaitable[T]],
) -> T:
    if _client is None:
        raise RuntimeError("Database not connected")
    if _transactions_available:
        async with await _client.start_session() as session:
            async with await session.start_transaction():
                return await callback(session)
    return await callback(None)


async def _check_transactions() -> bool:
    if _client is None:
        return False
    try:
        hello = await _client.admin.command("hello")
        if not hello.get("setName"):
            return False
        async with await _client.start_session() as session:
            async with await session.start_transaction():
                pass
        return True
    except Exception:
        logger.info("MongoDB multi-document transactions unavailable; using atomic fallbacks")
        return False


async def _init_replica_set() -> None:
    if _client is None:
        return
    try:
        status = await _client.admin.command("replSetGetStatus")
        if status.get("ok") == 1:
            return
    except Exception:
        pass
    host = settings.MONGO_REPLICA_SET_HOST
    try:
        await _client.admin.command(
            "replSetInitiate",
            {"_id": settings.MONGO_REPLICA_SET_NAME, "members": [{"_id": 0, "host": host}]},
        )
        logger.info("Initialized MongoDB replica set %s", settings.MONGO_REPLICA_SET_NAME)
    except Exception as exc:
        if "already initialized" not in str(exc).lower():
            logger.warning("Replica set init skipped: %s", exc)


class Database:
    """Backward-compatible accessor used by services and tests."""

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
        await ensure_indexes()

    async def run_transaction(
        self, callback: Callable[[AsyncIOMotorClientSession | None], Awaitable[T]]
    ) -> T:
        return await run_transaction(callback)


database = Database()
