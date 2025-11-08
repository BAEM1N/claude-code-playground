"""
Redis caching service.
"""
import json
from typing import Optional, Any
import redis.asyncio as redis
from ..core.config import settings


class CacheService:
    """Redis cache service for caching frequently accessed data."""

    def __init__(self):
        """Initialize Redis connection."""
        self.redis_client: Optional[redis.Redis] = None

    async def connect(self):
        """Connect to Redis."""
        self.redis_client = await redis.from_url(
            f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}",
            password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
            encoding="utf-8",
            decode_responses=True,
        )

    async def disconnect(self):
        """Disconnect from Redis."""
        if self.redis_client:
            await self.redis_client.close()

    async def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None
        """
        if not self.redis_client:
            return None

        try:
            value = await self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            print(f"Cache get error: {e}")
            return None

    async def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """
        Set value in cache.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds

        Returns:
            True if successful
        """
        if not self.redis_client:
            return False

        try:
            await self.redis_client.setex(
                key,
                ttl,
                json.dumps(value, default=str)
            )
            return True
        except Exception as e:
            print(f"Cache set error: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """
        Delete value from cache.

        Args:
            key: Cache key

        Returns:
            True if successful
        """
        if not self.redis_client:
            return False

        try:
            await self.redis_client.delete(key)
            return True
        except Exception as e:
            print(f"Cache delete error: {e}")
            return False

    async def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching pattern.

        Args:
            pattern: Key pattern (e.g., "user:*")

        Returns:
            Number of keys deleted
        """
        if not self.redis_client:
            return 0

        try:
            keys = []
            async for key in self.redis_client.scan_iter(match=pattern):
                keys.append(key)

            if keys:
                return await self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            print(f"Cache delete pattern error: {e}")
            return 0

    # Helper methods for common cache patterns
    async def get_user_profile(self, user_id: str):
        """Get cached user profile."""
        return await self.get(f"user:profile:{user_id}")

    async def set_user_profile(self, user_id: str, profile: dict):
        """Cache user profile."""
        return await self.set(
            f"user:profile:{user_id}",
            profile,
            settings.CACHE_USER_PROFILE_TTL
        )

    async def get_course(self, course_id: str):
        """Get cached course."""
        return await self.get(f"course:{course_id}")

    async def set_course(self, course_id: str, course: dict):
        """Cache course."""
        return await self.set(
            f"course:{course_id}",
            course,
            settings.CACHE_COURSE_TTL
        )

    async def invalidate_course(self, course_id: str):
        """Invalidate course cache."""
        await self.delete(f"course:{course_id}")
        await self.delete(f"course:{course_id}:members")

    async def get_unread_notifications_count(self, user_id: str):
        """Get cached unread notifications count."""
        return await self.get(f"notifications:{user_id}:unread")

    async def set_unread_notifications_count(self, user_id: str, count: int):
        """Cache unread notifications count."""
        return await self.set(
            f"notifications:{user_id}:unread",
            count,
            settings.CACHE_NOTIFICATIONS_TTL
        )


# Global cache service instance
cache_service = CacheService()
