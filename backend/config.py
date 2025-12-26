"""
캐시, Rate Limit 및 애플리케이션 설정
환경 변수 기반 설정 관리
"""

from pydantic_settings import BaseSettings
from typing import Optional, List


class RateLimitSettings(BaseSettings):
    """Rate Limit 설정"""

    # 기본 활성화 여부
    rate_limit_enabled: bool = True

    # 기본 제한 설정
    rate_limit_requests: int = 60  # 윈도우당 허용 요청 수
    rate_limit_window_seconds: int = 60  # 시간 윈도우 (초)

    # 식별자 설정
    rate_limit_by: str = "ip"  # ip, api_key, user_id

    # 제외 경로 (정규식 패턴)
    rate_limit_exclude_paths: str = "/health,/,/api/rate-limit"

    # Redis 사용 여부 (False면 메모리 사용)
    rate_limit_use_redis: bool = True

    # 응답 헤더 포함 여부
    rate_limit_include_headers: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


class CacheSettings(BaseSettings):
    """캐시 설정"""

    # 백엔드 선택: memory, redis, layered
    cache_backend: str = "memory"

    # Redis 설정
    cache_redis_url: str = "redis://localhost:6379/0"
    cache_redis_max_connections: int = 10
    cache_redis_socket_timeout: float = 5.0
    cache_redis_retry_on_timeout: bool = True

    # L1 메모리 캐시 설정
    cache_l1_max_entries: int = 1000
    cache_l1_max_memory_mb: int = 100

    # 기능 플래그
    cache_enable_stampede_prevention: bool = True
    cache_enable_stats: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


class AppSettings(BaseSettings):
    """애플리케이션 설정"""

    # Exa API
    exa_api_key: Optional[str] = None

    # 서버 설정
    debug: bool = False

    # CORS 설정 (콤마로 구분된 origin 목록)
    cors_origins: str = "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


# 싱글톤 인스턴스
cache_settings = CacheSettings()
app_settings = AppSettings()
rate_limit_settings = RateLimitSettings()
