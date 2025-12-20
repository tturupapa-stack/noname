"""
Rate Limiting Tests

Tests for rate limiting functionality:
- Memory-based rate limiter
- Rate limit middleware
- Rate limit headers
- 429 response handling
"""

import pytest
import asyncio
import time
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from starlette.responses import JSONResponse

from services.rate_limit_service import (
    MemoryRateLimiter,
    RateLimitResult,
    RateLimitStats
)
from middleware.rate_limit import RateLimitMiddleware


class TestMemoryRateLimiter:
    """Test cases for MemoryRateLimiter class."""

    @pytest.fixture
    def limiter(self):
        """Create a fresh MemoryRateLimiter instance."""
        return MemoryRateLimiter()

    @pytest.mark.asyncio
    async def test_first_request_allowed(self, limiter):
        """First request should always be allowed."""
        result = await limiter.check("test_ip", limit=10, window_seconds=60)

        assert result.allowed is True
        assert result.limit == 10
        assert result.remaining == 9

    @pytest.mark.asyncio
    async def test_requests_within_limit(self, limiter):
        """Requests within limit should be allowed."""
        limit = 5
        for i in range(limit):
            result = await limiter.check("test_ip", limit=limit, window_seconds=60)
            assert result.allowed is True
            assert result.remaining == limit - i - 1

    @pytest.mark.asyncio
    async def test_requests_exceed_limit(self, limiter):
        """Requests exceeding limit should be blocked."""
        limit = 3

        # Use up the limit
        for i in range(limit):
            await limiter.check("test_ip", limit=limit, window_seconds=60)

        # Next request should be blocked
        result = await limiter.check("test_ip", limit=limit, window_seconds=60)

        assert result.allowed is False
        assert result.remaining == 0
        assert result.retry_after is not None
        assert result.retry_after > 0

    @pytest.mark.asyncio
    async def test_different_identifiers_independent(self, limiter):
        """Different identifiers should have independent limits."""
        limit = 2

        # Exhaust limit for ip1
        for _ in range(limit + 1):
            await limiter.check("ip1", limit=limit, window_seconds=60)

        # ip2 should still have full limit
        result = await limiter.check("ip2", limit=limit, window_seconds=60)

        assert result.allowed is True
        assert result.remaining == limit - 1

    @pytest.mark.asyncio
    async def test_window_reset(self, limiter):
        """Limit should reset after window expires."""
        limit = 2
        window_seconds = 1  # 1 second window for faster testing

        # Use up limit
        for _ in range(limit):
            await limiter.check("test_ip", limit=limit, window_seconds=window_seconds)

        # Verify blocked
        result = await limiter.check("test_ip", limit=limit, window_seconds=window_seconds)
        assert result.allowed is False

        # Wait for window to expire
        await asyncio.sleep(window_seconds + 0.1)

        # Should be allowed again
        result = await limiter.check("test_ip", limit=limit, window_seconds=window_seconds)
        assert result.allowed is True
        assert result.remaining == limit - 1

    @pytest.mark.asyncio
    async def test_stats_tracking(self, limiter):
        """Should track request statistics."""
        limit = 2

        # Make some requests
        await limiter.check("ip1", limit=limit, window_seconds=60)
        await limiter.check("ip1", limit=limit, window_seconds=60)
        await limiter.check("ip1", limit=limit, window_seconds=60)  # blocked

        stats = await limiter.get_stats()

        assert stats.total_requests == 3
        assert stats.blocked_requests == 1
        assert stats.block_rate > 0

    @pytest.mark.asyncio
    async def test_reset_identifier(self, limiter):
        """Should reset specific identifier's counter."""
        limit = 3

        # Make some requests
        await limiter.check("test_ip", limit=limit, window_seconds=60)
        await limiter.check("test_ip", limit=limit, window_seconds=60)

        # Reset
        result = await limiter.reset("test_ip")
        assert result is True

        # Should have full limit again
        result = await limiter.check("test_ip", limit=limit, window_seconds=60)
        assert result.allowed is True
        assert result.remaining == limit - 1

    @pytest.mark.asyncio
    async def test_reset_nonexistent_identifier(self, limiter):
        """Resetting non-existent identifier should return False."""
        result = await limiter.reset("nonexistent")
        assert result is False

    @pytest.mark.asyncio
    async def test_cleanup_expired(self, limiter):
        """Should cleanup expired entries."""
        window_seconds = 1

        # Create entries
        await limiter.check("ip1", limit=5, window_seconds=window_seconds)
        await limiter.check("ip2", limit=5, window_seconds=window_seconds)

        # Wait for expiry
        await asyncio.sleep(window_seconds + 0.1)

        # Cleanup
        cleaned = await limiter.cleanup_expired(window_seconds)
        assert cleaned == 2


class TestRateLimitMiddleware:
    """Test cases for RateLimitMiddleware."""

    @pytest.fixture
    def app_with_rate_limit(self):
        """Create a test app with rate limiting."""
        app = FastAPI()

        @app.get("/api/test")
        async def test_endpoint():
            return {"status": "ok"}

        @app.get("/health")
        async def health():
            return {"status": "healthy"}

        @app.get("/")
        async def root():
            return {"status": "running"}

        return app

    def test_rate_limit_headers_present(self, app_with_rate_limit):
        """Should include rate limit headers in response."""
        with patch('middleware.rate_limit.rate_limit_settings') as mock_settings, \
             patch('middleware.rate_limit.rate_limit_service') as mock_service:

            mock_settings.rate_limit_enabled = True
            mock_settings.rate_limit_exclude_paths = "/health,/"
            mock_settings.rate_limit_include_headers = True

            mock_result = RateLimitResult(
                allowed=True,
                limit=60,
                remaining=59,
                reset_at=time.time() + 60
            )
            mock_service.check = AsyncMock(return_value=mock_result)

            app_with_rate_limit.add_middleware(RateLimitMiddleware)
            client = TestClient(app_with_rate_limit)

            response = client.get("/api/test")

            assert response.status_code == 200
            assert "X-RateLimit-Limit" in response.headers
            assert "X-RateLimit-Remaining" in response.headers
            assert "X-RateLimit-Reset" in response.headers

    def test_rate_limit_429_response(self, app_with_rate_limit):
        """Should return 429 when rate limit exceeded."""
        with patch('middleware.rate_limit.rate_limit_settings') as mock_settings, \
             patch('middleware.rate_limit.rate_limit_service') as mock_service:

            mock_settings.rate_limit_enabled = True
            mock_settings.rate_limit_exclude_paths = "/health,/"
            mock_settings.rate_limit_include_headers = True

            mock_result = RateLimitResult(
                allowed=False,
                limit=60,
                remaining=0,
                reset_at=time.time() + 60,
                retry_after=60
            )
            mock_service.check = AsyncMock(return_value=mock_result)

            app_with_rate_limit.add_middleware(RateLimitMiddleware)
            client = TestClient(app_with_rate_limit)

            response = client.get("/api/test")

            assert response.status_code == 429
            data = response.json()
            assert data["error"] == "rate_limit_exceeded"
            assert "Retry-After" in response.headers

    def test_excluded_paths_bypass_rate_limit(self, app_with_rate_limit):
        """Excluded paths should bypass rate limiting."""
        with patch('middleware.rate_limit.rate_limit_settings') as mock_settings, \
             patch('middleware.rate_limit.rate_limit_service') as mock_service:

            mock_settings.rate_limit_enabled = True
            mock_settings.rate_limit_exclude_paths = "/health,/"
            mock_settings.rate_limit_include_headers = True

            app_with_rate_limit.add_middleware(RateLimitMiddleware)
            client = TestClient(app_with_rate_limit)

            # Health endpoint should not call rate limit service
            response = client.get("/health")
            assert response.status_code == 200
            mock_service.check.assert_not_called()

            # Root endpoint should not call rate limit service
            response = client.get("/")
            assert response.status_code == 200

    def test_rate_limit_disabled_bypass(self, app_with_rate_limit):
        """Should bypass rate limiting when disabled."""
        with patch('middleware.rate_limit.rate_limit_settings') as mock_settings, \
             patch('middleware.rate_limit.rate_limit_service') as mock_service:

            mock_settings.rate_limit_enabled = False

            app_with_rate_limit.add_middleware(RateLimitMiddleware)
            client = TestClient(app_with_rate_limit)

            response = client.get("/api/test")

            assert response.status_code == 200
            mock_service.check.assert_not_called()

    def test_client_ip_extraction_from_headers(self, app_with_rate_limit):
        """Should extract client IP from X-Forwarded-For header."""
        with patch('middleware.rate_limit.rate_limit_settings') as mock_settings, \
             patch('middleware.rate_limit.rate_limit_service') as mock_service:

            mock_settings.rate_limit_enabled = True
            mock_settings.rate_limit_exclude_paths = ""
            mock_settings.rate_limit_include_headers = True

            mock_result = RateLimitResult(
                allowed=True,
                limit=60,
                remaining=59,
                reset_at=time.time() + 60
            )
            mock_service.check = AsyncMock(return_value=mock_result)

            app_with_rate_limit.add_middleware(RateLimitMiddleware)
            client = TestClient(app_with_rate_limit)

            response = client.get(
                "/api/test",
                headers={"X-Forwarded-For": "1.2.3.4, 5.6.7.8"}
            )

            assert response.status_code == 200
            # First IP should be used
            mock_service.check.assert_called_once()
            call_args = mock_service.check.call_args
            assert call_args[0][0] == "1.2.3.4"

    def test_rate_limit_fail_open(self, app_with_rate_limit):
        """Should allow request when rate limit check fails."""
        with patch('middleware.rate_limit.rate_limit_settings') as mock_settings, \
             patch('middleware.rate_limit.rate_limit_service') as mock_service:

            mock_settings.rate_limit_enabled = True
            mock_settings.rate_limit_exclude_paths = ""
            mock_settings.rate_limit_include_headers = True

            mock_service.check = AsyncMock(side_effect=Exception("Service error"))

            app_with_rate_limit.add_middleware(RateLimitMiddleware)
            client = TestClient(app_with_rate_limit)

            response = client.get("/api/test")

            # Should still return 200 (fail-open)
            assert response.status_code == 200


class TestRateLimitIntegration:
    """Integration tests for rate limiting with actual requests."""

    @pytest.mark.asyncio
    async def test_rapid_requests_blocked(self):
        """Rapid requests should be blocked after limit."""
        limiter = MemoryRateLimiter()
        limit = 5
        identifier = "test_rapid"

        allowed_count = 0
        blocked_count = 0

        for _ in range(limit + 3):
            result = await limiter.check(identifier, limit=limit, window_seconds=60)
            if result.allowed:
                allowed_count += 1
            else:
                blocked_count += 1

        assert allowed_count == limit
        assert blocked_count == 3

    @pytest.mark.asyncio
    async def test_concurrent_requests(self):
        """Should handle concurrent requests correctly."""
        limiter = MemoryRateLimiter()
        limit = 10
        identifier = "test_concurrent"

        async def make_request():
            return await limiter.check(identifier, limit=limit, window_seconds=60)

        # Make concurrent requests
        tasks = [make_request() for _ in range(15)]
        results = await asyncio.gather(*tasks)

        allowed = sum(1 for r in results if r.allowed)
        blocked = sum(1 for r in results if not r.allowed)

        assert allowed == limit
        assert blocked == 5
