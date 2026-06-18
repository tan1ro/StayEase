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


class Database:
    def __init__(self) -> None:
        self._client: AsyncIOMotorClient | None = None
        self._db: AsyncIOMotorDatabase | None = None
        self._transactions_available: bool = False

    async def connect(self) -> None:
        self._client = AsyncIOMotorClient(settings.MONGO_URI)
        self._db = self._client[settings.MONGO_DB_NAME]
        if settings.MONGO_REPLICA_SET_INIT:
            await self._init_replica_set()
        await self.ensure_indexes()
        self._transactions_available = await self._check_transactions()

    async def disconnect(self) -> None:
        if self._client is not None:
            self._client.close()
        self._client = None
        self._db = None
        self._transactions_available = False

    @property
    def db(self) -> AsyncIOMotorDatabase:
        if self._db is None:
            raise RuntimeError("Database not connected")
        return self._db

    def collection(self, name: str) -> Any:
        return self.db[name]

    @property
    def transactions_available(self) -> bool:
        return self._transactions_available

    async def ensure_indexes(self) -> None:
        await self.db["users"].create_index("email", unique=True)
        await self.db["users"].create_index("referral_code", unique=True)
        await self.db["offers"].create_index("code", unique=True)
        await self.db["reviews"].create_index("booking_id", unique=True)
        await self.db["invoices"].create_index("booking_id", unique=True)
        await self.db["invoices"].create_index("invoice_number", unique=True)
        await self.db["bookings"].create_index(
            [
                ("room_id", ASCENDING),
                ("status", ASCENDING),
                ("check_in_date", ASCENDING),
                ("check_out_date", ASCENDING),
            ]
        )
        await self.db["listing_reports"].create_index(
            [("room_id", ASCENDING), ("reporter_id", ASCENDING)],
            unique=True,
            partialFilterExpression={"status": "open"},
            name="unique_open_report_per_reporter",
        )
        await self.db["inquiries"].create_index([("guest_id", ASCENDING), ("created_at", ASCENDING)])
        await self.db["inquiries"].create_index([("host_id", ASCENDING), ("created_at", ASCENDING)])
        await self.db["waitlist"].create_index(
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
        await self.db["chat_sessions"].create_index("session_id", unique=True)
        await self.db["chat_sessions"].create_index([("user_id", ASCENDING), ("updated_at", ASCENDING)])

    async def run_transaction(
        self, callback: Callable[[AsyncIOMotorClientSession | None], Awaitable[T]]
    ) -> T:
        if self._client is None:
            raise RuntimeError("Database not connected")
        if self._transactions_available:
            async with await self._client.start_session() as session:
                async with await session.start_transaction():
                    return await callback(session)
        return await callback(None)

    async def _check_transactions(self) -> bool:
        if self._client is None:
            return False
        try:
            hello = await self._client.admin.command("hello")
            if not hello.get("setName"):
                return False
            async with await self._client.start_session() as session:
                async with await session.start_transaction():
                    pass
            return True
        except Exception:
            logger.info("MongoDB multi-document transactions unavailable; using atomic fallbacks")
            return False

    async def _init_replica_set(self) -> None:
        if self._client is None:
            return
        try:
            status = await self._client.admin.command("replSetGetStatus")
            if status.get("ok") == 1:
                return
        except Exception:
            pass
        host = settings.MONGO_REPLICA_SET_HOST
        try:
            await self._client.admin.command(
                "replSetInitiate",
                {"_id": settings.MONGO_REPLICA_SET_NAME, "members": [{"_id": 0, "host": host}]},
            )
            logger.info("Initialized MongoDB replica set %s", settings.MONGO_REPLICA_SET_NAME)
        except Exception as exc:
            if "already initialized" not in str(exc).lower():
                logger.warning("Replica set init skipped: %s", exc)


database = Database()


def get_database() -> AsyncIOMotorDatabase:
    """FastAPI dependency — returns the connected Motor database instance."""
    return database.db


async def connect_db() -> None:
    await database.connect()


async def disconnect_db() -> None:
    await database.disconnect()
