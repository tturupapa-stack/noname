"""
레이어드 캐시 서비스 (L1: Memory + L2: Redis)

기능:
- L1 인메모리 캐시: LRU 정책, 크기 제한
- L2 Redis 캐시: 분산 환경 지원, 자동 재연결
- 통계 추적: 히트율, 미스율, 에러율
- Stampede 방지: 동시 요청 시 단일 API 호출
- 기존 코드 호환: 동기 인터페이스 유지
"""

import asyncio
import fnmatch
import json
import logging
import pickle
import sys
import time
from abc import ABC, abstractmethod
from collections import OrderedDict
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Awaitable

logger = logging.getLogger(__name__)


# ============================================================
# 통계 및 설정 클래스
# ============================================================

@dataclass
class CacheStats:
    """캐시 통계"""
    hits: int = 0
    misses: int = 0
    sets: int = 0
    deletes: int = 0
    errors: int = 0

    @property
    def hit_rate(self) -> float:
        """히트율 계산 (%)"""
        total = self.hits + self.misses
        return (self.hits / total * 100) if total > 0 else 0.0

    def to_dict(self) -> dict:
        return {
            "hits": self.hits,
            "misses": self.misses,
            "sets": self.sets,
            "deletes": self.deletes,
            "errors": self.errors,
            "hit_rate": round(self.hit_rate, 2)
        }


class CacheTTL:
    """TTL 설정 (초)"""
    # 종목 데이터
    TRENDING = 300           # 5분
    TOP_N = 300              # 5분
    STOCK_DETAIL = 300       # 5분
    NEWS = 900               # 15분

    # 차트 데이터 (기간별 가변)
    CHART_5D = 300           # 5분
    CHART_1MO = 1800         # 30분
    CHART_3MO = 3600         # 1시간
    CHART_6MO = 3600         # 1시간
    CHART_1Y = 3600          # 1시간

    # 브리핑 데이터
    BRIEFING_DETAIL = 3600   # 1시간 (불변)
    BRIEFING_LIST = 600      # 10분

    @classmethod
    def get_chart_ttl(cls, period: str) -> int:
        """차트 기간별 TTL 반환"""
        ttl_map = {
            "5d": cls.CHART_5D,
            "1mo": cls.CHART_1MO,
            "3mo": cls.CHART_3MO,
            "6mo": cls.CHART_6MO,
            "1y": cls.CHART_1Y,
        }
        return ttl_map.get(period, cls.CHART_5D)


# ============================================================
# 캐시 엔트리
# ============================================================

@dataclass
class CacheEntry:
    """캐시 엔트리"""
    value: Any
    expires_at: float
    size_bytes: int = 0
    created_at: float = field(default_factory=time.time)

    @property
    def is_expired(self) -> bool:
        return time.time() > self.expires_at

    @property
    def ttl_remaining(self) -> int:
        remaining = self.expires_at - time.time()
        return max(0, int(remaining))


# ============================================================
# L1: 메모리 캐시 (LRU)
# ============================================================

class MemoryCache:
    """
    L1: 인메모리 캐시
    - LRU (Least Recently Used) 정책
    - 최대 엔트리 수 및 메모리 제한
    - 빠른 접근 (~1ms)
    """

    def __init__(
        self,
        max_entries: int = 1000,
        max_memory_mb: int = 100
    ):
        self._cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self._max_entries = max_entries
        self._max_memory_bytes = max_memory_mb * 1024 * 1024
        self._current_memory = 0
        self._stats = CacheStats()
        self._lock = asyncio.Lock()

    def get(self, key: str) -> Optional[Any]:
        """캐시에서 값 조회 (동기)"""
        entry = self._cache.get(key)
        if entry is None:
            self._stats.misses += 1
            return None

        if entry.is_expired:
            self._remove_entry(key)
            self._stats.misses += 1
            return None

        # LRU: 최근 사용으로 이동
        self._cache.move_to_end(key)
        self._stats.hits += 1
        return entry.value

    def set(self, key: str, value: Any, ttl_seconds: int = 300) -> bool:
        """캐시에 값 저장 (동기)"""
        try:
            size = self._estimate_size(value)

            # 기존 키가 있으면 메모리에서 제거
            if key in self._cache:
                self._current_memory -= self._cache[key].size_bytes

            # 공간 확보 (LRU 정책)
            self._evict_if_needed(size)

            entry = CacheEntry(
                value=value,
                expires_at=time.time() + ttl_seconds,
                size_bytes=size
            )
            self._cache[key] = entry
            self._cache.move_to_end(key)
            self._current_memory += size
            self._stats.sets += 1
            return True

        except Exception as e:
            logger.warning(f"Memory cache set error: {e}")
            self._stats.errors += 1
            return False

    def delete(self, key: str) -> bool:
        """캐시에서 값 삭제"""
        if key in self._cache:
            self._remove_entry(key)
            self._stats.deletes += 1
            return True
        return False

    def clear(self) -> int:
        """전체 캐시 삭제"""
        count = len(self._cache)
        self._cache.clear()
        self._current_memory = 0
        return count

    def clear_pattern(self, pattern: str) -> int:
        """패턴에 매칭되는 키 삭제"""
        keys_to_delete = [
            key for key in self._cache.keys()
            if fnmatch.fnmatch(key, pattern)
        ]
        for key in keys_to_delete:
            self._remove_entry(key)
        return len(keys_to_delete)

    def keys(self, pattern: str = "*") -> List[str]:
        """패턴에 매칭되는 키 목록"""
        if pattern == "*":
            return list(self._cache.keys())
        return [k for k in self._cache.keys() if fnmatch.fnmatch(k, pattern)]

    def cleanup_expired(self) -> int:
        """만료된 엔트리 정리"""
        expired_keys = [
            key for key, entry in self._cache.items()
            if entry.is_expired
        ]
        for key in expired_keys:
            self._remove_entry(key)
        return len(expired_keys)

    @property
    def stats(self) -> CacheStats:
        return self._stats

    @property
    def key_count(self) -> int:
        return len(self._cache)

    @property
    def memory_usage_mb(self) -> float:
        return self._current_memory / (1024 * 1024)

    def _remove_entry(self, key: str) -> None:
        """엔트리 삭제 및 메모리 반환"""
        if key in self._cache:
            self._current_memory -= self._cache[key].size_bytes
            del self._cache[key]

    def _evict_if_needed(self, required_size: int) -> None:
        """LRU 정책으로 공간 확보"""
        # 엔트리 수 제한
        while len(self._cache) >= self._max_entries:
            oldest_key = next(iter(self._cache))
            self._remove_entry(oldest_key)

        # 메모리 제한
        while (self._current_memory + required_size > self._max_memory_bytes
               and self._cache):
            oldest_key = next(iter(self._cache))
            self._remove_entry(oldest_key)

    def _estimate_size(self, value: Any) -> int:
        """값의 메모리 크기 추정"""
        try:
            return sys.getsizeof(pickle.dumps(value))
        except Exception:
            return 1024  # 기본값 1KB


# ============================================================
# L2: Redis 캐시
# ============================================================

class RedisCache:
    """
    L2: Redis 캐시
    - 분산 환경 지원
    - 연결 풀링
    - 자동 재연결 (exponential backoff)
    - 연결 실패 시 graceful degradation
    """

    def __init__(
        self,
        url: str = "redis://localhost:6379/0",
        max_connections: int = 10,
        socket_timeout: float = 5.0
    ):
        self._url = url
        self._max_connections = max_connections
        self._socket_timeout = socket_timeout
        self._client = None
        self._connected = False
        self._stats = CacheStats()
        self._reconnect_attempts = 0
        self._max_reconnect_attempts = 5
        self._base_backoff = 1.0
        self._max_backoff = 60.0

    async def connect(self) -> bool:
        """Redis 연결"""
        try:
            import redis.asyncio as redis
            self._client = redis.from_url(
                self._url,
                max_connections=self._max_connections,
                socket_timeout=self._socket_timeout,
                decode_responses=False
            )
            await self._client.ping()
            self._connected = True
            self._reconnect_attempts = 0
            logger.info("Redis connected successfully")
            return True
        except ImportError:
            logger.warning("redis package not installed, L2 cache disabled")
            return False
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}")
            self._connected = False
            return False

    async def disconnect(self) -> None:
        """Redis 연결 종료"""
        if self._client:
            await self._client.close()
            self._connected = False
            logger.info("Redis disconnected")

    async def get(self, key: str) -> Optional[Any]:
        """캐시에서 값 조회"""
        if not self._connected:
            return None

        try:
            data = await self._client.get(key)
            if data:
                self._stats.hits += 1
                return pickle.loads(data)
            self._stats.misses += 1
            return None
        except Exception as e:
            self._stats.errors += 1
            await self._handle_error(e)
            return None

    async def set(self, key: str, value: Any, ttl_seconds: int = 300) -> bool:
        """캐시에 값 저장"""
        if not self._connected:
            return False

        try:
            serialized = pickle.dumps(value)
            await self._client.setex(key, ttl_seconds, serialized)
            self._stats.sets += 1
            return True
        except Exception as e:
            self._stats.errors += 1
            await self._handle_error(e)
            return False

    async def delete(self, key: str) -> bool:
        """캐시에서 값 삭제"""
        if not self._connected:
            return False

        try:
            result = await self._client.delete(key)
            if result:
                self._stats.deletes += 1
            return result > 0
        except Exception as e:
            self._stats.errors += 1
            await self._handle_error(e)
            return False

    async def clear(self) -> int:
        """전체 캐시 삭제"""
        if not self._connected:
            return 0

        try:
            await self._client.flushdb()
            return -1  # Redis doesn't return count on flush
        except Exception as e:
            self._stats.errors += 1
            await self._handle_error(e)
            return 0

    async def clear_pattern(self, pattern: str) -> int:
        """패턴에 매칭되는 키 삭제"""
        if not self._connected:
            return 0

        try:
            keys = []
            async for key in self._client.scan_iter(match=pattern):
                keys.append(key)
            if keys:
                await self._client.delete(*keys)
            return len(keys)
        except Exception as e:
            self._stats.errors += 1
            await self._handle_error(e)
            return 0

    async def keys(self, pattern: str = "*") -> List[str]:
        """패턴에 매칭되는 키 목록"""
        if not self._connected:
            return []

        try:
            keys = []
            async for key in self._client.scan_iter(match=pattern):
                keys.append(key.decode() if isinstance(key, bytes) else key)
            return keys
        except Exception as e:
            self._stats.errors += 1
            await self._handle_error(e)
            return []

    @property
    def stats(self) -> CacheStats:
        return self._stats

    @property
    def is_connected(self) -> bool:
        return self._connected

    async def _handle_error(self, error: Exception) -> None:
        """에러 처리 및 재연결 시도"""
        logger.warning(f"Redis error: {error}")
        if "Connection" in str(error) or "Timeout" in str(error):
            self._connected = False
            asyncio.create_task(self._reconnect_with_backoff())

    async def _reconnect_with_backoff(self) -> None:
        """Exponential backoff으로 재연결"""
        if self._reconnect_attempts >= self._max_reconnect_attempts:
            logger.error("Max Redis reconnection attempts reached")
            return

        delay = min(
            self._base_backoff * (2 ** self._reconnect_attempts),
            self._max_backoff
        )
        self._reconnect_attempts += 1

        logger.info(f"Reconnecting to Redis in {delay}s (attempt {self._reconnect_attempts})")
        await asyncio.sleep(delay)

        if await self.connect():
            logger.info("Redis reconnected successfully")


# ============================================================
# 캐시 매니저 (통합 인터페이스)
# ============================================================

class CacheManager:
    """
    통합 캐시 매니저
    - L1 (메모리) + L2 (Redis) 레이어드 캐싱
    - Stampede 방지
    - 통계 추적
    - 기존 코드 호환 (동기 인터페이스)
    """

    # 락 정리 설정
    LOCK_CLEANUP_INTERVAL = 300  # 5분마다 정리
    LOCK_MAX_AGE = 60  # 60초 이상 된 락 제거
    MAX_LOCKS = 1000  # 최대 락 개수

    def __init__(
        self,
        l1_cache: Optional[MemoryCache] = None,
        l2_cache: Optional[RedisCache] = None,
        enable_stampede_prevention: bool = True
    ):
        self._l1 = l1_cache or MemoryCache()
        self._l2 = l2_cache
        self._enable_stampede_prevention = enable_stampede_prevention
        self._locks: Dict[str, asyncio.Lock] = {}
        self._lock_timestamps: Dict[str, float] = {}  # 락 생성 시간 추적
        self._start_time = time.time()
        self._last_cleared: Optional[datetime] = None
        self._last_lock_cleanup: float = time.time()
        self._backend_mode = "memory"

    async def initialize(
        self,
        backend: str = "memory",
        redis_url: str = "redis://localhost:6379/0",
        max_entries: int = 1000,
        max_memory_mb: int = 100
    ) -> None:
        """캐시 매니저 초기화"""
        self._backend_mode = backend
        self._l1 = MemoryCache(max_entries=max_entries, max_memory_mb=max_memory_mb)

        if backend in ("redis", "layered"):
            self._l2 = RedisCache(url=redis_url)
            await self._l2.connect()

        logger.info(f"Cache manager initialized (backend={backend})")

    async def shutdown(self) -> None:
        """캐시 매니저 종료"""
        if self._l2:
            await self._l2.disconnect()
        logger.info("Cache manager shutdown")

    # ---- 동기 인터페이스 (기존 코드 호환) ----

    def get(self, key: str) -> Optional[Any]:
        """캐시에서 값 조회 (동기)"""
        # L1에서만 조회 (동기)
        return self._l1.get(key)

    def set(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        """캐시에 값 저장 (동기)"""
        self._l1.set(key, value, ttl_seconds)

        # L2에 비동기 저장 (백그라운드)
        if self._l2 and self._l2.is_connected:
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.create_task(self._l2.set(key, value, ttl_seconds))
            except RuntimeError:
                pass

    def delete(self, key: str) -> None:
        """캐시에서 값 삭제 (동기)"""
        self._l1.delete(key)

        if self._l2 and self._l2.is_connected:
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.create_task(self._l2.delete(key))
            except RuntimeError:
                pass

    def clear(self) -> None:
        """전체 캐시 삭제 (동기)"""
        self._l1.clear()
        self._last_cleared = datetime.now()

        if self._l2 and self._l2.is_connected:
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.create_task(self._l2.clear())
            except RuntimeError:
                pass

    def cleanup_expired(self) -> int:
        """만료된 엔트리 정리"""
        return self._l1.cleanup_expired()

    # ---- 비동기 인터페이스 (새 코드용) ----

    async def aget(self, key: str) -> Optional[Any]:
        """캐시에서 값 조회 (비동기)"""
        # L1 먼저
        value = self._l1.get(key)
        if value is not None:
            return value

        # L2 확인
        if self._l2 and self._l2.is_connected:
            try:
                value = await asyncio.wait_for(
                    self._l2.get(key),
                    timeout=1.0
                )
                if value is not None:
                    # L1에 채우기 (짧은 TTL)
                    self._l1.set(key, value, ttl_seconds=60)
                    return value
            except asyncio.TimeoutError:
                logger.warning(f"L2 cache timeout for key: {key}")
            except Exception as e:
                logger.warning(f"L2 cache error: {e}")

        return None

    async def aset(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        """캐시에 값 저장 (비동기)"""
        # L1에 짧은 TTL (1/5)
        l1_ttl = max(60, ttl_seconds // 5)
        self._l1.set(key, value, l1_ttl)

        # L2에 전체 TTL
        if self._l2 and self._l2.is_connected:
            await self._l2.set(key, value, ttl_seconds)

    async def adelete(self, key: str) -> None:
        """캐시에서 값 삭제 (비동기)"""
        self._l1.delete(key)
        if self._l2 and self._l2.is_connected:
            await self._l2.delete(key)

    async def aclear(self, pattern: Optional[str] = None, layers: List[str] = None) -> int:
        """캐시 삭제 (비동기)"""
        if layers is None:
            layers = ["l1", "l2"]

        total = 0

        if "l1" in layers:
            if pattern:
                total += self._l1.clear_pattern(pattern)
            else:
                total += self._l1.clear()

        if "l2" in layers and self._l2 and self._l2.is_connected:
            if pattern:
                total += await self._l2.clear_pattern(pattern)
            else:
                await self._l2.clear()
                total += 1

        self._last_cleared = datetime.now()
        return total

    def _cleanup_stale_locks(self) -> int:
        """오래된 락 정리 (메모리 누수 방지)"""
        current_time = time.time()

        # 정리 주기 체크
        if current_time - self._last_lock_cleanup < self.LOCK_CLEANUP_INTERVAL:
            return 0

        self._last_lock_cleanup = current_time
        removed_count = 0

        # 오래된 락 또는 최대 개수 초과 시 정리
        keys_to_remove = []
        for key, timestamp in list(self._lock_timestamps.items()):
            # 오래된 락 제거
            if current_time - timestamp > self.LOCK_MAX_AGE:
                keys_to_remove.append(key)

        # 최대 개수 초과 시 가장 오래된 것부터 제거
        if len(self._locks) > self.MAX_LOCKS:
            sorted_keys = sorted(
                self._lock_timestamps.keys(),
                key=lambda k: self._lock_timestamps.get(k, 0)
            )
            excess_count = len(self._locks) - self.MAX_LOCKS
            keys_to_remove.extend(sorted_keys[:excess_count])

        # 중복 제거 후 삭제
        for key in set(keys_to_remove):
            if key in self._locks and not self._locks[key].locked():
                del self._locks[key]
                if key in self._lock_timestamps:
                    del self._lock_timestamps[key]
                removed_count += 1

        if removed_count > 0:
            logger.debug(f"Cleaned up {removed_count} stale locks")

        return removed_count

    async def get_or_set(
        self,
        key: str,
        factory: Callable[[], Awaitable[Any]],
        ttl_seconds: int
    ) -> Any:
        """
        캐시에서 조회하거나 없으면 생성 후 저장
        Stampede 방지: 동시 요청 시 한 번만 factory 호출
        """
        value = await self.aget(key)
        if value is not None:
            return value

        if self._enable_stampede_prevention:
            # 주기적으로 오래된 락 정리
            self._cleanup_stale_locks()

            if key not in self._locks:
                self._locks[key] = asyncio.Lock()
                self._lock_timestamps[key] = time.time()

            async with self._locks[key]:
                # Double-check
                value = await self.aget(key)
                if value is not None:
                    # 락 사용 완료 후 타임스탬프 갱신
                    self._lock_timestamps[key] = time.time()
                    return value

                value = await factory()
                await self.aset(key, value, ttl_seconds)
                # 락 사용 완료 후 타임스탬프 갱신
                self._lock_timestamps[key] = time.time()
                return value
        else:
            value = await factory()
            await self.aset(key, value, ttl_seconds)
            return value

    # ---- 통계 및 모니터링 ----

    def get_stats(self) -> dict:
        """캐시 통계 반환"""
        l1_stats = {
            "backend": "memory",
            "hits": self._l1.stats.hits,
            "misses": self._l1.stats.misses,
            "sets": self._l1.stats.sets,
            "deletes": self._l1.stats.deletes,
            "errors": self._l1.stats.errors,
            "hit_rate": round(self._l1.stats.hit_rate, 2),
            "key_count": self._l1.key_count,
            "memory_usage_mb": round(self._l1.memory_usage_mb, 2),
            "connected": True
        }

        l2_stats = None
        if self._l2:
            l2_stats = {
                "backend": "redis",
                "hits": self._l2.stats.hits,
                "misses": self._l2.stats.misses,
                "sets": self._l2.stats.sets,
                "deletes": self._l2.stats.deletes,
                "errors": self._l2.stats.errors,
                "hit_rate": round(self._l2.stats.hit_rate, 2),
                "key_count": 0,  # Redis key count requires SCAN
                "memory_usage_mb": None,
                "connected": self._l2.is_connected
            }

        # 전체 히트율
        total_hits = l1_stats["hits"] + (l2_stats["hits"] if l2_stats else 0)
        total_misses = l1_stats["misses"] + (l2_stats["misses"] if l2_stats else 0)
        combined_rate = (total_hits / (total_hits + total_misses) * 100) if (total_hits + total_misses) > 0 else 0

        return {
            "l1_stats": l1_stats,
            "l2_stats": l2_stats,
            "combined_hit_rate": round(combined_rate, 2),
            "uptime_seconds": round(time.time() - self._start_time, 2),
            "last_cleared": self._last_cleared.isoformat() if self._last_cleared else None,
            "cache_backend": self._backend_mode
        }

    async def health_check(self) -> dict:
        """헬스 체크"""
        l1_ok = True  # 메모리는 항상 OK
        l2_ok = self._l2.is_connected if self._l2 else None

        if l2_ok is None:
            status = "healthy"
            message = "L1 (memory) cache operational"
        elif l2_ok:
            status = "healthy"
            message = "L1 + L2 cache operational"
        else:
            status = "degraded"
            message = "L2 (Redis) unavailable, using L1 only"

        return {
            "status": status,
            "l1_status": "healthy" if l1_ok else "unhealthy",
            "l2_status": "healthy" if l2_ok else ("unavailable" if l2_ok is False else None),
            "l2_connected": l2_ok if l2_ok is not None else False,
            "message": message
        }

    def keys(self, pattern: str = "*") -> List[str]:
        """L1 캐시 키 목록"""
        return self._l1.keys(pattern)


# ============================================================
# 싱글톤 인스턴스 및 호환성 레이어
# ============================================================

# 캐시 매니저 싱글톤
cache_manager = CacheManager()

# 기존 코드 호환용 (cache.get, cache.set 등)
cache = cache_manager


# ============================================================
# 캐시 키 상수 (기존과 동일)
# ============================================================

CACHE_KEY_TRENDING = "trending_stock"
CACHE_KEY_TOP_N = "top_n_stocks_{type}_{count}"
CACHE_KEY_NEWS = "news_{ticker}"
CACHE_KEY_STOCK_DETAIL = "stock_detail_{ticker}"
CACHE_KEY_CHART = "chart_{ticker}_{period}"
CACHE_KEY_BRIEFING_LIST = "briefing_list_{page}_{limit}"
CACHE_KEY_BRIEFING_DETAIL = "briefing_detail_{date}"


# ============================================================
# TTL 상수 (기존 호환 + 확장)
# ============================================================

CACHE_TTL_TRENDING = CacheTTL.TRENDING
CACHE_TTL_TOP_N = CacheTTL.TOP_N
CACHE_TTL_NEWS = CacheTTL.NEWS
CACHE_TTL_STOCK_DETAIL = CacheTTL.STOCK_DETAIL
CACHE_TTL_CHART = CacheTTL.CHART_5D  # 기본값 (기존 호환)
CACHE_TTL_BRIEFING_LIST = CacheTTL.BRIEFING_LIST
CACHE_TTL_BRIEFING_DETAIL = CacheTTL.BRIEFING_DETAIL
