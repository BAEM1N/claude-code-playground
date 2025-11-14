"""
Pytest configuration and fixtures.
"""
import os
import pytest
from typing import Generator, AsyncGenerator
from unittest.mock import Mock, AsyncMock, patch
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from dotenv import load_dotenv

# Load test environment variables
load_dotenv(".env.test")

from app.core.database import get_db, Base
from app.core.config import settings

# Mock the storage and cache services before they're used
import app.services.storage_service as storage_module
import app.services.cache_service as cache_module

# Mock storage service
mock_storage = Mock()
mock_storage.ensure_bucket = Mock()
# upload_file should return storage path string
mock_storage.upload_file = Mock(return_value="courses/00000000-0000-0000-0000-000000000001/test.txt")
mock_storage.get_file = Mock()
mock_storage.delete_file = Mock()
mock_storage.get_presigned_url = Mock(return_value="http://test.url")
storage_module.storage_service = mock_storage

# Mock cache service
mock_cache = Mock()
mock_cache.connect = AsyncMock()
mock_cache.disconnect = AsyncMock()
mock_cache.get = AsyncMock(return_value=None)
mock_cache.set = AsyncMock()
mock_cache.delete = AsyncMock()
mock_cache.incr = AsyncMock(return_value=1)
mock_cache.expire = AsyncMock()
cache_module.cache_service = mock_cache

# Mock rate limiter to disable rate limiting in tests
import app.core.rate_limit as rate_limit_module
original_get_rate_limiter = rate_limit_module.get_rate_limiter

def mock_get_rate_limiter(rate_string: str):
    """Mock rate limiter that always allows requests."""
    limiter = original_get_rate_limiter(rate_string)
    limiter.check_rate_limit = AsyncMock()  # Always allows
    return limiter

rate_limit_module.get_rate_limiter = mock_get_rate_limiter

# Now import app after mocking
from app.main import app

# Test database URL
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def async_engine():
    """Create async engine for tests."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        future=True
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture(scope="function")
async def async_session(async_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create async session for tests."""
    async_session_maker = async_sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

    async with async_session_maker() as session:
        yield session


@pytest.fixture(scope="function")
async def override_get_db(async_session: AsyncSession):
    """Override the get_db dependency."""
    async def _override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def client(override_get_db) -> Generator:
    """Create test client."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="function")
async def async_client(override_get_db) -> AsyncGenerator:
    """Create async test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def valid_token() -> str:
    """Create a valid test JWT token."""
    from jose import jwt
    from datetime import datetime, timedelta
    import uuid

    payload = {
        "sub": str(uuid.UUID("00000000-0000-0000-0000-000000000001")),  # Valid UUID
        "email": "test@example.com",
        "role": "student",
        "exp": datetime.utcnow() + timedelta(hours=1)
    }

    token = jwt.encode(
        payload,
        settings.SUPABASE_JWT_SECRET,
        algorithm=settings.ALGORITHM
    )

    return token


@pytest.fixture
def expired_token() -> str:
    """Create an expired test JWT token."""
    from jose import jwt
    from datetime import datetime, timedelta
    import uuid

    payload = {
        "sub": str(uuid.UUID("00000000-0000-0000-0000-000000000002")),  # Valid UUID
        "email": "test@example.com",
        "role": "student",
        "exp": datetime.utcnow() - timedelta(hours=1)  # Expired
    }

    token = jwt.encode(
        payload,
        settings.SUPABASE_JWT_SECRET,
        algorithm=settings.ALGORITHM
    )

    return token


@pytest.fixture
def auth_headers(valid_token: str) -> dict:
    """Create authorization headers with valid token."""
    return {
        "Authorization": f"Bearer {valid_token}"
    }
