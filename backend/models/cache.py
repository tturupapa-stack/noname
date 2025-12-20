"""
캐시 관련 Pydantic 모델
API 요청/응답 스키마 정의
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class CacheLayerStats(BaseModel):
    """캐시 레이어별 통계"""
    backend: str = Field(..., description="캐시 백엔드 타입 (memory/redis)")
    hits: int = Field(default=0, description="캐시 히트 수")
    misses: int = Field(default=0, description="캐시 미스 수")
    sets: int = Field(default=0, description="캐시 저장 수")
    deletes: int = Field(default=0, description="캐시 삭제 수")
    errors: int = Field(default=0, description="에러 수")
    hit_rate: float = Field(default=0.0, description="히트율 (%)")
    key_count: int = Field(default=0, description="저장된 키 수")
    memory_usage_mb: Optional[float] = Field(default=None, description="메모리 사용량 (MB)")
    connected: bool = Field(default=True, description="연결 상태")


class CacheStatsResponse(BaseModel):
    """캐시 통계 응답"""
    l1_stats: CacheLayerStats = Field(..., description="L1 (메모리) 캐시 통계")
    l2_stats: Optional[CacheLayerStats] = Field(default=None, description="L2 (Redis) 캐시 통계")
    combined_hit_rate: float = Field(..., description="전체 히트율 (%)")
    uptime_seconds: float = Field(..., description="서버 가동 시간 (초)")
    last_cleared: Optional[datetime] = Field(default=None, description="마지막 캐시 초기화 시각")
    cache_backend: str = Field(..., description="현재 캐시 백엔드 모드")


class CacheClearRequest(BaseModel):
    """캐시 초기화 요청"""
    pattern: Optional[str] = Field(default=None, description="삭제할 키 패턴 (예: stock_*, news_*)")
    layers: List[str] = Field(default=["l1", "l2"], description="초기화할 레이어 (l1, l2)")


class CacheClearResponse(BaseModel):
    """캐시 초기화 응답"""
    success: bool = Field(..., description="성공 여부")
    cleared_count: int = Field(..., description="삭제된 키 수")
    layers_cleared: List[str] = Field(..., description="초기화된 레이어")
    pattern: Optional[str] = Field(default=None, description="적용된 패턴")
    message: str = Field(..., description="결과 메시지")
    timestamp: datetime = Field(..., description="처리 시각")


class CacheKeyInfo(BaseModel):
    """캐시 키 정보"""
    key: str = Field(..., description="캐시 키")
    ttl_remaining: Optional[int] = Field(default=None, description="남은 TTL (초)")
    size_bytes: Optional[int] = Field(default=None, description="값 크기 (바이트)")
    layer: str = Field(..., description="저장된 레이어 (l1/l2/both)")


class CacheKeysResponse(BaseModel):
    """캐시 키 목록 응답"""
    keys: List[CacheKeyInfo] = Field(..., description="캐시 키 목록")
    total_count: int = Field(..., description="전체 키 수")
    pattern: str = Field(..., description="검색 패턴")


class CacheHealthResponse(BaseModel):
    """캐시 헬스 체크 응답"""
    status: str = Field(..., description="전체 상태 (healthy/degraded/unhealthy)")
    l1_status: str = Field(..., description="L1 상태")
    l2_status: Optional[str] = Field(default=None, description="L2 상태")
    l2_connected: bool = Field(default=False, description="Redis 연결 상태")
    message: str = Field(..., description="상태 메시지")


class TTLConfig(BaseModel):
    """TTL 설정 정보"""
    trending: int = Field(default=300, description="화제 종목 TTL")
    top_n: int = Field(default=300, description="TOP N 종목 TTL")
    stock_detail: int = Field(default=300, description="종목 상세 TTL")
    news: int = Field(default=900, description="뉴스 TTL")
    chart_5d: int = Field(default=300, description="5일 차트 TTL")
    chart_1mo: int = Field(default=1800, description="1개월 차트 TTL")
    chart_3mo: int = Field(default=3600, description="3개월+ 차트 TTL")
    briefing_detail: int = Field(default=3600, description="브리핑 상세 TTL")
    briefing_list: int = Field(default=600, description="브리핑 목록 TTL")
