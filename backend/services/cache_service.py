"""인메모리 캐시 서비스"""

import time
from typing import Any, Optional, Dict
from dataclasses import dataclass


@dataclass
class CacheEntry:
    """캐시 엔트리"""
    value: Any
    expires_at: float


class CacheService:
    """간단한 인메모리 TTL 캐시"""

    def __init__(self):
        self._cache: Dict[str, CacheEntry] = {}

    def get(self, key: str) -> Optional[Any]:
        """캐시에서 값 조회"""
        entry = self._cache.get(key)
        if entry is None:
            return None

        # 만료 체크
        if time.time() > entry.expires_at:
            del self._cache[key]
            return None

        return entry.value

    def set(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        """캐시에 값 저장"""
        self._cache[key] = CacheEntry(
            value=value,
            expires_at=time.time() + ttl_seconds
        )

    def delete(self, key: str) -> None:
        """캐시에서 값 삭제"""
        if key in self._cache:
            del self._cache[key]

    def clear(self) -> None:
        """전체 캐시 삭제"""
        self._cache.clear()

    def cleanup_expired(self) -> int:
        """만료된 엔트리 정리"""
        now = time.time()
        expired_keys = [
            key for key, entry in self._cache.items()
            if now > entry.expires_at
        ]
        for key in expired_keys:
            del self._cache[key]
        return len(expired_keys)


# 싱글톤 인스턴스
cache = CacheService()

# 캐시 키 상수
CACHE_KEY_TRENDING = "trending_stock"
CACHE_KEY_TOP_N = "top_n_stocks_{type}_{count}"
CACHE_KEY_NEWS = "news_{ticker}"
CACHE_KEY_STOCK_DETAIL = "stock_detail_{ticker}"
CACHE_KEY_CHART = "chart_{ticker}_{period}"

# TTL 설정 (초)
CACHE_TTL_TRENDING = 300      # 5분
CACHE_TTL_TOP_N = 300         # 5분
CACHE_TTL_NEWS = 900          # 15분
CACHE_TTL_STOCK_DETAIL = 300  # 5분
CACHE_TTL_CHART = 300         # 5분
