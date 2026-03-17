import logging
from typing import Any, Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from backend.config import settings

logger = logging.getLogger(__name__)


class DatabaseUnavailableError(RuntimeError):
    """Raised when the MongoDB dependency is unavailable."""


class DatabaseManager:
    def __init__(self) -> None:
        self._client: Optional[AsyncIOMotorClient] = None
        self._database: Optional[AsyncIOMotorDatabase] = None
        self._last_error: str = ""

    @property
    def client(self) -> AsyncIOMotorClient:
        if self._client is None:
            raise DatabaseUnavailableError("Database client has not been initialized.")
        return self._client

    @property
    def database(self) -> AsyncIOMotorDatabase:
        if self._database is None:
            raise DatabaseUnavailableError("Database has not been initialized.")
        return self._database

    async def connect(self) -> AsyncIOMotorDatabase:
        if self._database is not None:
            return self._database

        if not settings.mongo_url.strip():
            self._last_error = "MONGO_URL is not configured."
            raise DatabaseUnavailableError(self._last_error)

        logger.info("Connecting to MongoDB database '%s'", settings.mongo_database)

        self._last_error = ""

        candidate_client = AsyncIOMotorClient(
            settings.mongo_url,
            serverSelectionTimeoutMS=settings.mongo_server_selection_timeout_ms,
            uuidRepresentation="standard",
        )

        try:
            await candidate_client.admin.command("ping")
            self._client = candidate_client
            self._database = candidate_client[settings.mongo_database]

            await self._ensure_indexes()
        except Exception as exc:
            candidate_client.close()
            self._client = None
            self._database = None
            self._last_error = str(exc)
            logger.warning("MongoDB connection failed: %s", exc)
            raise DatabaseUnavailableError(
                f"MongoDB is unavailable: {exc}"
            ) from exc

        logger.info("MongoDB connection established successfully")
        return self._database

    async def disconnect(self) -> None:
        if self._client is not None:
            logger.info("Closing MongoDB connection")
            self._client.close()

        self._client = None
        self._database = None
        self._last_error = ""

    def health_snapshot(self) -> dict[str, Any]:
        return {
            "available": self._database is not None,
            "database": settings.mongo_database,
            "error": self._last_error or None,
        }

    async def _ensure_indexes(self) -> None:
        db = self.database

        await db.users.create_index("google_sub", unique=True, name="uniq_google_sub")
        await db.users.create_index("email", unique=True, name="uniq_user_email")

        await db.symptom_analyses.create_index(
            [("user_id", 1), ("created_at", -1)],
            name="idx_user_created_at",
        )
        await db.symptom_analyses.create_index(
            [("symptom", 1), ("created_at", -1)],
            name="idx_symptom_created_at",
        )


database_manager = DatabaseManager()


async def connect_to_mongo() -> AsyncIOMotorDatabase:
    return await database_manager.connect()


async def close_mongo_connection() -> None:
    await database_manager.disconnect()


def get_database() -> AsyncIOMotorDatabase:
    return database_manager.database


def get_database_health() -> dict[str, Any]:
    return database_manager.health_snapshot()
