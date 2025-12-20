"""
Rate Limit 서비스

기능:
- IP 기반 요청 제한 (고정 윈도우)
- Redis 기반 분산 카운터 (메모리 폴백)
- 통계 추적
"""

import asyncio
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)


@dataclass
class RateLimitResult:
    """Rate Limit 체크 결과"""
    allowed: bool
    limit: int
    remaining: int
    reset_at: float  # Unix timestamp
    retry_after: Optional[int] = None  # 초과 시에만 설정


@dataclass
class RateLimitStats:
    """Rate Limit 통계"""
    total_requests: int = 0
    blocked_requests: int = 0

    @property
    def block_rate(self) -> float:
        if self.total_requests == 0:
            return 0.0
        return self.blocked_requests / self.total_requests


@dataclass
class MemoryRateLimitEntry:
    """메모리 Rate Limit 엔트리"""
    count: int = 0
    window_start: float = field(default_factory=time.time)


class MemoryRateLimiter:
    """메모리 기반 Rate Limiter (단일 서버용)"""

    def __init__(self):
        self._entries: Dict[str, MemoryRateLimitEntry] = {}
        self._stats = RateLimitStats()
        self._lock = asyncio.Lock()

    async def check(
        self,
        identifier: str,
        limit: int,
        window_seconds: int
    ) -> RateLimitResult:
        """Rate Limit 체크 및 카운터 증가"""
        async with self._lock:
            now = time.time()
            self._stats.total_requests += 1

            # 엔트리 조회 또는 생성
            entry = self._entries.get(identifier)

            if entry is None:
                # 새 엔트리 생성
                entry = MemoryRateLimitEntry(count=1, window_start=now)
                self._entries[identifier] = entry
                return RateLimitResult(
                    allowed=True,
                    limit=limit,
                    remaining=limit - 1,
                    reset_at=now + window_seconds
                )

            # 윈도우 만료 체크
            window_end = entry.window_start + window_seconds
            if now >= window_end:
                # 새 윈도우 시작
                entry.count = 1
                entry.window_start = now
                return RateLimitResult(
                    allowed=True,
                    limit=limit,
                    remaining=limit - 1,
                    reset_at=now + window_seconds
                )

            # 현재 윈도우 내에서 카운트 증가
            entry.count += 1
            remaining = max(0, limit - entry.count)
            reset_at = entry.window_start + window_seconds

            if entry.count > limit:
                # 제한 초과
                self._stats.blocked_requests += 1
                retry_after = int(reset_at - now) + 1
                return RateLimitResult(
                    allowed=False,
                    limit=limit,
                    remaining=0,
                    reset_at=reset_at,
                    retry_after=retry_after
                )

            return RateLimitResult(
                allowed=True,
                limit=limit,
                remaining=remaining,
                reset_at=reset_at
            )

    async def get_stats(self) -> RateLimitStats:
        """통계 조회"""
        return self._stats

    async def reset(self, identifier: str) -> bool:
        """특정 식별자의 카운터 리셋"""
        async with self._lock:
            if identifier in self._entries:
                del self._entries[identifier]
                return True
            return False

    async def cleanup_expired(self, window_seconds: int) -> int:
        """만료된 엔트리 정리"""
        async with self._lock:
            now = time.time()
            expired = [
                key for key, entry in self._entries.items()
                if now >= entry.window_start + window_seconds
            ]
            for key in expired:
                del self._entries[key]
            return len(expired)


class RedisRateLimiter:
    """Redis 기반 Rate Limiter (분산 환경용)"""

    def __init__(self, redis_url: str):
        self._redis_url = redis_url
        self._client = None
        self._connected = False
        self._stats = RateLimitStats()
        self._lock = asyncio.Lock()

    async def connect(self) -> bool:
        """Redis 연결"""
        try:
            import redis.asyncio as redis
            self._client = redis.from_url(
                self._redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            await self._client.ping()
            self._connected = True
            logger.info("Rate Limiter: Redis 연결 성공")
            return True
        except Exception as e:
            logger.warning(f"Rate Limiter: Redis 연결 실패 - {e}")
            self._connected = False
            return False

    async def disconnect(self):
        """Redis 연결 해제"""
        if self._client:
            await self._client.close()
            self._connected = False

    @property
    def is_connected(self) -> bool:
        return self._connected

    async def check(
        self,
        identifier: str,
        limit: int,
        window_seconds: int
    ) -> RateLimitResult:
        """Rate Limit 체크 및 카운터 증가 (원자적 연산)"""
        if not self._connected:
            raise ConnectionError("Redis not connected")

        self._stats.total_requests += 1
        key = f"ratelimit:{identifier}"
        now = time.time()

        try:
            pipe = self._client.pipeline()
            pipe.incr(key)
            pipe.ttl(key)
            results = await pipe.execute()

            count = results[0]
            ttl = results[1]

            # 첫 요청이면 TTL 설정
            if ttl == -1:
                await self._client.expire(key, window_seconds)
                ttl = window_seconds

            reset_at = now + max(ttl, 0)
            remaining = max(0, limit - count)

            if count > limit:
                self._stats.blocked_requests += 1
                retry_after = max(ttl, 1)
                return RateLimitResult(
                    allowed=False,
                    limit=limit,
                    remaining=0,
                    reset_at=reset_at,
                    retry_after=retry_after
                )

            return RateLimitResult(
                allowed=True,
                limit=limit,
                remaining=remaining,
                reset_at=reset_at
            )

        except Exception as e:
            logger.error(f"Rate Limit 체크 실패: {e}")
            self._stats.total_requests -= 1  # 롤백
            raise

    async def get_stats(self) -> RateLimitStats:
        """통계 조회"""
        return self._stats

    async def reset(self, identifier: str) -> bool:
        """특정 식별자의 카운터 리셋"""
        if not self._connected:
            return False
        try:
            key = f"ratelimit:{identifier}"
            result = await self._client.delete(key)
            return result > 0
        except Exception as e:
            logger.error(f"Rate Limit 리셋 실패: {e}")
            return False


class RateLimitService:
    """Rate Limit 서비스 (통합 인터페이스)"""

    def __init__(self):
        self._memory_limiter = MemoryRateLimiter()
        self._redis_limiter: Optional[RedisRateLimiter] = None
        self._use_redis = False
        self._initialized = False
        self._settings = None

    async def initialize(
        self,
        use_redis: bool = True,
        redis_url: str = "redis://localhost:6379/0"
    ):
        """서비스 초기화"""
        from config import rate_limit_settings
        self._settings = rate_limit_settings

        if use_redis:
            self._redis_limiter = RedisRateLimiter(redis_url)
            connected = await self._redis_limiter.connect()
            self._use_redis = connected
            if not connected:
                logger.warning("Rate Limiter: Redis 사용 불가, 메모리 모드로 폴백")

        self._initialized = True
        backend = "Redis" if self._use_redis else "Memory"
        logger.info(f"Rate Limit 서비스 초기화 완료 (backend={backend})")

    async def shutdown(self):
        """서비스 종료"""
        if self._redis_limiter:
            await self._redis_limiter.disconnect()
        self._initialized = False

    async def check(
        self,
        identifier: str,
        limit: Optional[int] = None,
        window_seconds: Optional[int] = None
    ) -> RateLimitResult:
        """Rate Limit 체크"""
        if not self._initialized:
            await self.initialize()

        # 설정값 사용 (파라미터 우선)
        _limit = limit or self._settings.rate_limit_requests
        _window = window_seconds or self._settings.rate_limit_window_seconds

        if self._use_redis and self._redis_limiter:
            try:
                return await self._redis_limiter.check(identifier, _limit, _window)
            except Exception as e:
                logger.warning(f"Redis Rate Limit 실패, 메모리로 폴백: {e}")
                self._use_redis = False

        return await self._memory_limiter.check(identifier, _limit, _window)

    async def get_stats(self) -> RateLimitStats:
        """통계 조회"""
        if self._use_redis and self._redis_limiter:
            return await self._redis_limiter.get_stats()
        return await self._memory_limiter.get_stats()

    async def reset(self, identifier: str) -> bool:
        """특정 식별자의 카운터 리셋"""
        if self._use_redis and self._redis_limiter:
            return await self._redis_limiter.reset(identifier)
        return await self._memory_limiter.reset(identifier)

    @property
    def backend(self) -> str:
        """현재 사용 중인 백엔드"""
        return "redis" if self._use_redis else "memory"

    @property
    def is_enabled(self) -> bool:
        """Rate Limit 활성화 여부"""
        if self._settings:
            return self._settings.rate_limit_enabled
        return True


# 싱글톤 인스턴스
rate_limit_service = RateLimitService()
