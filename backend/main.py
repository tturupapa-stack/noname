import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from api.stock import router as stock_router
from api.briefing import router as briefing_router
from api.briefing_generate import router as briefing_generate_router
from api.cache import router as cache_router
from api.notifications import router as notifications_router
from services.cache_service import cache_manager
from services.rate_limit_service import rate_limit_service
from middleware.rate_limit import RateLimitMiddleware
from config import cache_settings, rate_limit_settings, app_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Backend server URL from environment or default
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

# .env 파일 로드 (프로젝트 루트와 backend 디렉토리 모두 확인)
project_root = Path(__file__).parent.parent
env_paths = [
    project_root / ".env",
    Path(__file__).parent / ".env"
]
for env_path in env_paths:
    if env_path.exists():
        load_dotenv(env_path)
        break


async def preload_cache():
    """서버 시작 시 캐시 미리 로드 (백그라운드)"""
    import httpx
    await asyncio.sleep(2)  # 서버 시작 대기

    try:
        async with httpx.AsyncClient() as client:
            logger.info("Cache preloading started...")

            # 1. TOP 3 종목 미리 로드
            response = await client.get(
                f"{BACKEND_URL}/api/stocks/trending/top?type=most_actives&count=3",
                timeout=120.0
            )
            logger.info("TOP 3 cache loaded successfully")

            # 2. TOP 3 종목의 상세 정보 + 차트 미리 로드
            if response.status_code == 200:
                data = response.json()
                symbols = [stock["stock"]["symbol"] for stock in data.get("stocks", [])]

                for symbol in symbols:
                    try:
                        # 종목 상세 프리로드
                        await client.get(
                            f"{BACKEND_URL}/api/stocks/{symbol}",
                            timeout=30.0
                        )
                        # 차트 데이터 프리로드
                        await client.get(
                            f"{BACKEND_URL}/api/stocks/{symbol}/chart?period=5d",
                            timeout=30.0
                        )
                        logger.info(f"{symbol} detail/chart cache loaded")
                    except Exception:
                        pass

            logger.info("Cache preloading completed!")

    except Exception as e:
        logger.warning(f"Cache preloading failed (service still operational): {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 생명주기 관리"""
    # 시작 시: 캐시 매니저 초기화
    logger.info(f"Initializing cache manager (backend={cache_settings.cache_backend})...")
    await cache_manager.initialize(
        backend=cache_settings.cache_backend,
        redis_url=cache_settings.cache_redis_url,
        max_entries=cache_settings.cache_l1_max_entries,
        max_memory_mb=cache_settings.cache_l1_max_memory_mb
    )

    # Rate Limit 서비스 초기화
    if rate_limit_settings.rate_limit_enabled:
        logger.info("Initializing Rate Limit service...")
        await rate_limit_service.initialize(
            use_redis=rate_limit_settings.rate_limit_use_redis,
            redis_url=cache_settings.cache_redis_url
        )
        logger.info(
            f"Rate Limit enabled (backend={rate_limit_service.backend}, "
            f"{rate_limit_settings.rate_limit_requests}req/{rate_limit_settings.rate_limit_window_seconds}s)"
        )

    # 백그라운드에서 캐시 프리로딩
    asyncio.create_task(preload_cache())

    yield

    # 종료 시: Rate Limit 서비스 정리
    if rate_limit_settings.rate_limit_enabled:
        logger.info("Shutting down Rate Limit service...")
        await rate_limit_service.shutdown()

    # 종료 시: 캐시 매니저 정리
    logger.info("Shutting down cache manager...")
    await cache_manager.shutdown()


app = FastAPI(
    title="당신이 잠든 사이 API",
    description="주식 브리핑 대시보드 백엔드 API",
    version="0.2.0",
    lifespan=lifespan
)

# CORS 설정 (환경변수에서 origin 목록 로드)
cors_origins = [origin.strip() for origin in app_settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limit 미들웨어 (CORS 다음에 적용)
if rate_limit_settings.rate_limit_enabled:
    app.add_middleware(RateLimitMiddleware)


@app.get("/")
async def root():
    return {"message": "당신이 잠든 사이 API", "status": "running", "version": "0.2.0"}


@app.get("/health")
async def health_check():
    """서버 및 캐시 헬스 체크"""
    cache_health = await cache_manager.health_check()
    return {
        "status": "healthy" if cache_health["status"] != "unhealthy" else "degraded",
        "cache": cache_health
    }


# 라우터 등록
app.include_router(stock_router)
app.include_router(briefing_router)
app.include_router(briefing_generate_router)
app.include_router(cache_router)
app.include_router(notifications_router)
