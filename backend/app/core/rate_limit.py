"""
Rate Limiting for API Endpoints

Simple in-memory rate limiter using token bucket algorithm.
For production, consider using Redis-based rate limiting.

Usage:
    from app.core.rate_limit import RateLimiter, get_rate_limiter

    @router.post("/endpoint")
    async def endpoint(
        request: Request,
        rate_limiter: RateLimiter = Depends(get_rate_limiter("10/minute"))
    ):
        await rate_limiter.check_rate_limit(request)
        # Your endpoint logic...
"""

import time
from typing import Dict, Tuple, Optional
from collections import defaultdict
from fastapi import Request, HTTPException, status
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Simple token bucket rate limiter

    Tracks requests per (IP address + user_id) combination.
    """

    def __init__(
        self,
        max_requests: int,
        window_seconds: int,
        identifier: str = "default"
    ):
        """
        Initialize rate limiter

        Args:
            max_requests: Maximum number of requests allowed
            window_seconds: Time window in seconds
            identifier: Identifier for this rate limiter (for logging)
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.identifier = identifier

        # Storage: key -> (request_count, window_start_time)
        self.requests: Dict[str, Tuple[int, float]] = defaultdict(lambda: (0, time.time()))

        # For cleanup
        self.last_cleanup = time.time()
        self.cleanup_interval = 300  # 5 minutes

    def _get_client_key(self, request: Request) -> str:
        """Get unique key for client (IP + user if available)"""
        client_ip = request.client.host if request.client else "unknown"

        # Try to get user_id from request state (set by auth middleware)
        user_id = getattr(request.state, "user_id", None)

        if user_id:
            return f"{client_ip}:{user_id}"
        return client_ip

    def _cleanup_old_entries(self):
        """Remove expired entries to prevent memory leak"""
        current_time = time.time()

        # Only cleanup periodically
        if current_time - self.last_cleanup < self.cleanup_interval:
            return

        # Remove entries older than 2x window
        cutoff_time = current_time - (self.window_seconds * 2)
        expired_keys = [
            key for key, (_, start_time) in self.requests.items()
            if start_time < cutoff_time
        ]

        for key in expired_keys:
            del self.requests[key]

        self.last_cleanup = current_time

        if expired_keys:
            logger.debug(f"Rate limiter '{self.identifier}' cleaned up {len(expired_keys)} expired entries")

    async def check_rate_limit(self, request: Request):
        """
        Check if request is within rate limit

        Raises HTTPException(429) if rate limit exceeded
        """
        client_key = self._get_client_key(request)
        current_time = time.time()

        # Periodic cleanup
        self._cleanup_old_entries()

        # Get current request data
        request_count, window_start = self.requests[client_key]

        # Check if we're in a new window
        time_elapsed = current_time - window_start
        if time_elapsed > self.window_seconds:
            # Start new window
            self.requests[client_key] = (1, current_time)
            logger.debug(f"Rate limit '{self.identifier}' for {client_key}: 1/{self.max_requests} (new window)")
            return

        # Check if limit exceeded
        if request_count >= self.max_requests:
            # Calculate retry after
            retry_after = int(self.window_seconds - time_elapsed) + 1

            logger.warning(
                f"Rate limit exceeded for {client_key} on '{self.identifier}': "
                f"{request_count}/{self.max_requests} requests in {int(time_elapsed)}s"
            )

            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {self.max_requests} requests per {self.window_seconds} seconds.",
                headers={"Retry-After": str(retry_after)}
            )

        # Increment counter
        self.requests[client_key] = (request_count + 1, window_start)
        logger.debug(
            f"Rate limit '{self.identifier}' for {client_key}: "
            f"{request_count + 1}/{self.max_requests}"
        )


# Global rate limiter instances
_rate_limiters: Dict[str, RateLimiter] = {}


def get_rate_limiter(limit_string: str) -> RateLimiter:
    """
    Get or create rate limiter instance

    Args:
        limit_string: Format "N/period" where period is "second", "minute", "hour", "day"
                     Examples: "10/minute", "100/hour", "1000/day"

    Returns:
        RateLimiter instance

    Usage:
        rate_limiter = Depends(lambda: get_rate_limiter("10/minute"))
    """
    global _rate_limiters

    if limit_string in _rate_limiters:
        return _rate_limiters[limit_string]

    # Parse limit string
    try:
        count_str, period = limit_string.split("/")
        count = int(count_str)

        # Convert period to seconds
        period_seconds = {
            "second": 1,
            "minute": 60,
            "hour": 3600,
            "day": 86400
        }

        if period not in period_seconds:
            raise ValueError(f"Invalid period: {period}")

        seconds = period_seconds[period]

        # Create and cache limiter
        limiter = RateLimiter(
            max_requests=count,
            window_seconds=seconds,
            identifier=limit_string
        )
        _rate_limiters[limit_string] = limiter

        logger.info(f"Created rate limiter: {limit_string} ({count} requests per {seconds}s)")
        return limiter

    except Exception as e:
        logger.error(f"Failed to parse rate limit string '{limit_string}': {e}")
        raise ValueError(f"Invalid rate limit format: {limit_string}. Use 'N/period' format.")


async def rate_limit_dependency(limit_string: str):
    """
    Dependency factory for rate limiting

    Usage:
        @router.post("/endpoint")
        async def endpoint(
            request: Request,
            _: None = Depends(rate_limit_dependency("10/minute"))
        ):
            ...
    """
    limiter = get_rate_limiter(limit_string)

    async def check_limit(request: Request):
        await limiter.check_rate_limit(request)

    return check_limit
