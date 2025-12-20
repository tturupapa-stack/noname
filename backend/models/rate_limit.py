"""
Rate Limit 관련 Pydantic 모델
API 요청/응답 스키마 정의
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RateLimitInfo(BaseModel):
    """Rate Limit 정보 (응답 헤더용)"""
    limit: int = Field(..., description="허용된 최대 요청 수")
    remaining: int = Field(..., description="남은 요청 수")
    reset_at: datetime = Field(..., description="제한 리셋 시각")
    retry_after: Optional[int] = Field(default=None, description="재시도 가능까지 남은 시간 (초)")


class RateLimitExceededResponse(BaseModel):
    """Rate Limit 초과 응답 (HTTP 429)"""
    error: str = Field(default="rate_limit_exceeded", description="에러 코드")
    message: str = Field(default="요청 한도를 초과했습니다", description="에러 메시지")
    retry_after: int = Field(..., description="재시도 가능까지 남은 시간 (초)")
    limit: int = Field(..., description="허용된 최대 요청 수")
    remaining: int = Field(default=0, description="남은 요청 수")
    reset_at: datetime = Field(..., description="제한 리셋 시각")


class RateLimitStatusResponse(BaseModel):
    """Rate Limit 상태 응답"""
    enabled: bool = Field(..., description="Rate Limit 활성화 여부")
    requests_per_window: int = Field(..., description="윈도우당 허용 요청 수")
    window_seconds: int = Field(..., description="시간 윈도우 (초)")
    identifier_type: str = Field(..., description="식별자 타입 (ip/api_key/user_id)")
    storage_backend: str = Field(..., description="저장소 백엔드 (redis/memory)")
    excluded_paths: list[str] = Field(..., description="제외된 경로 목록")


class RateLimitStatsResponse(BaseModel):
    """Rate Limit 통계 응답"""
    total_requests: int = Field(default=0, description="전체 요청 수")
    blocked_requests: int = Field(default=0, description="차단된 요청 수")
    block_rate: float = Field(default=0.0, description="차단율")
    unique_identifiers: int = Field(default=0, description="고유 식별자 수")
    current_window_start: Optional[datetime] = Field(default=None, description="현재 윈도우 시작 시각")
