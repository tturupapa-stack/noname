"""
캐시 및 애플리케이션 설정
환경 변수 기반 설정 관리
"""

from pydantic_settings import BaseSettings
from typing import Optional


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

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


# 싱글톤 인스턴스
cache_settings = CacheSettings()
app_settings = AppSettings()
