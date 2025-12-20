"""
캐시 관리 API 라우터
통계, 초기화, 삭제, 헬스 체크 엔드포인트
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List

from models.cache import (
    CacheStatsResponse,
    CacheLayerStats,
    CacheClearRequest,
    CacheClearResponse,
    CacheKeysResponse,
    CacheKeyInfo,
    CacheHealthResponse
)
from services.cache_service import cache_manager

router = APIRouter(prefix="/api/cache", tags=["cache"])


@router.get("/stats", response_model=CacheStatsResponse)
async def get_cache_stats():
    """
    캐시 통계 조회

    히트율, 미스율, 키 개수, 메모리 사용량 등 반환.
    목표 히트율: 70% 이상
    """
    stats = cache_manager.get_stats()

    l1_stats = CacheLayerStats(**stats["l1_stats"])
    l2_stats = CacheLayerStats(**stats["l2_stats"]) if stats["l2_stats"] else None

    return CacheStatsResponse(
        l1_stats=l1_stats,
        l2_stats=l2_stats,
        combined_hit_rate=stats["combined_hit_rate"],
        uptime_seconds=stats["uptime_seconds"],
        last_cleared=datetime.fromisoformat(stats["last_cleared"]) if stats["last_cleared"] else None,
        cache_backend=stats["cache_backend"]
    )


@router.post("/clear", response_model=CacheClearResponse)
async def clear_cache(request: CacheClearRequest = None):
    """
    캐시 초기화

    - pattern 없이: 전체 캐시 삭제
    - pattern 지정: 패턴에 매칭되는 키만 삭제 (예: stock_*, news_*)
    - layers: 삭제할 레이어 지정 (l1, l2)

    **예시 패턴:**
    - `stock_*`: 모든 종목 관련 캐시
    - `news_*`: 모든 뉴스 캐시
    - `chart_AAPL_*`: AAPL 차트 캐시
    """
    if request is None:
        request = CacheClearRequest()

    try:
        cleared = await cache_manager.aclear(
            pattern=request.pattern,
            layers=request.layers
        )

        return CacheClearResponse(
            success=True,
            cleared_count=cleared,
            layers_cleared=request.layers,
            pattern=request.pattern,
            message=f"캐시가 초기화되었습니다 ({cleared}개 키 삭제)",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"캐시 초기화 실패: {str(e)}")


@router.delete("/{key_pattern}")
async def delete_cache_pattern(key_pattern: str):
    """
    특정 패턴의 캐시 삭제

    **예시:**
    - `/api/cache/stock_detail_AAPL`: AAPL 상세 정보 캐시 삭제
    - `/api/cache/chart_*`: 모든 차트 캐시 삭제
    - `/api/cache/news_TSLA`: TSLA 뉴스 캐시 삭제
    """
    try:
        deleted = await cache_manager.aclear(pattern=key_pattern, layers=["l1", "l2"])

        return {
            "success": True,
            "deleted_count": deleted,
            "pattern": key_pattern,
            "message": f"'{key_pattern}' 패턴의 캐시가 삭제되었습니다",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"캐시 삭제 실패: {str(e)}")


@router.get("/keys", response_model=CacheKeysResponse)
async def list_cache_keys(
    pattern: str = Query(default="*", description="키 패턴 (예: stock_*, news_*)"),
    limit: int = Query(default=100, ge=1, le=1000, description="최대 반환 개수")
):
    """
    캐시 키 목록 조회

    디버깅 및 모니터링용.
    패턴을 지정하여 특정 키만 조회 가능.

    **예시:**
    - `*`: 모든 키
    - `stock_*`: 종목 관련 키
    - `chart_AAPL_*`: AAPL 차트 키
    """
    try:
        all_keys = cache_manager.keys(pattern)[:limit]

        keys_info = [
            CacheKeyInfo(
                key=key,
                ttl_remaining=None,  # L1에서는 TTL 조회 어려움
                size_bytes=None,
                layer="l1"
            )
            for key in all_keys
        ]

        return CacheKeysResponse(
            keys=keys_info,
            total_count=len(keys_info),
            pattern=pattern
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"키 조회 실패: {str(e)}")


@router.get("/health", response_model=CacheHealthResponse)
async def cache_health():
    """
    캐시 시스템 헬스 체크

    L1 (메모리) 및 L2 (Redis) 캐시 상태 확인.

    **상태:**
    - `healthy`: 정상 작동
    - `degraded`: L2 불가, L1만 작동 (성능 저하)
    - `unhealthy`: 캐시 시스템 오류
    """
    try:
        health = await cache_manager.health_check()

        return CacheHealthResponse(
            status=health["status"],
            l1_status=health["l1_status"],
            l2_status=health["l2_status"],
            l2_connected=health["l2_connected"],
            message=health["message"]
        )
    except Exception as e:
        return CacheHealthResponse(
            status="unhealthy",
            l1_status="unknown",
            l2_status="unknown",
            l2_connected=False,
            message=f"헬스 체크 실패: {str(e)}"
        )


@router.get("/ttl")
async def get_ttl_config():
    """
    현재 TTL 설정 조회

    각 데이터 타입별 캐시 유효 시간(초) 반환.
    """
    from services.cache_service import CacheTTL

    return {
        "ttl_config": {
            "trending": CacheTTL.TRENDING,
            "top_n": CacheTTL.TOP_N,
            "stock_detail": CacheTTL.STOCK_DETAIL,
            "news": CacheTTL.NEWS,
            "chart_5d": CacheTTL.CHART_5D,
            "chart_1mo": CacheTTL.CHART_1MO,
            "chart_3mo": CacheTTL.CHART_3MO,
            "chart_6mo": CacheTTL.CHART_6MO,
            "chart_1y": CacheTTL.CHART_1Y,
            "briefing_detail": CacheTTL.BRIEFING_DETAIL,
            "briefing_list": CacheTTL.BRIEFING_LIST
        },
        "description": {
            "trending": "화제 종목 (5분)",
            "top_n": "TOP N 종목 (5분)",
            "stock_detail": "종목 상세 (5분)",
            "news": "뉴스 (15분)",
            "chart_5d": "5일 차트 (5분)",
            "chart_1mo": "1개월 차트 (30분)",
            "chart_3mo": "3개월 차트 (1시간)",
            "chart_6mo": "6개월 차트 (1시간)",
            "chart_1y": "1년 차트 (1시간)",
            "briefing_detail": "브리핑 상세 (1시간)",
            "briefing_list": "브리핑 목록 (10분)"
        }
    }
