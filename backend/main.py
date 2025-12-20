import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from api.stock import router as stock_router
from api.briefing import router as briefing_router
from api.briefing_generate import router as briefing_generate_router
from api.cache import router as cache_router
from services.cache_service import cache_manager
from config import cache_settings

# .env 파일 로드
load_dotenv()


async def preload_cache():
    """서버 시작 시 캐시 미리 로드 (백그라운드)"""
    import httpx
    await asyncio.sleep(2)  # 서버 시작 대기

    try:
        async with httpx.AsyncClient() as client:
            print("📦 캐시 프리로딩 시작...")

            # 1. TOP 3 종목 미리 로드
            response = await client.get(
                "http://localhost:8000/api/stocks/trending/top?type=most_actives&count=3",
                timeout=120.0
            )
            print("✅ TOP 3 캐시 로드 완료")

            # 2. TOP 3 종목의 상세 정보 + 차트 미리 로드
            if response.status_code == 200:
                data = response.json()
                symbols = [stock["stock"]["symbol"] for stock in data.get("stocks", [])]

                for symbol in symbols:
                    try:
                        # 종목 상세 프리로드
                        await client.get(
                            f"http://localhost:8000/api/stocks/{symbol}",
                            timeout=30.0
                        )
                        # 차트 데이터 프리로드
                        await client.get(
                            f"http://localhost:8000/api/stocks/{symbol}/chart?period=5d",
                            timeout=30.0
                        )
                        print(f"✅ {symbol} 상세/차트 캐시 로드 완료")
                    except Exception:
                        pass

            print("🎉 캐시 프리로딩 완료!")

    except Exception as e:
        print(f"⚠️ 캐시 프리로딩 실패 (서비스는 정상 작동): {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 생명주기 관리"""
    # 시작 시: 캐시 매니저 초기화
    print(f"🚀 캐시 매니저 초기화 (backend={cache_settings.cache_backend})...")
    await cache_manager.initialize(
        backend=cache_settings.cache_backend,
        redis_url=cache_settings.cache_redis_url,
        max_entries=cache_settings.cache_l1_max_entries,
        max_memory_mb=cache_settings.cache_l1_max_memory_mb
    )

    # 백그라운드에서 캐시 프리로딩
    asyncio.create_task(preload_cache())

    yield

    # 종료 시: 캐시 매니저 정리
    print("🛑 캐시 매니저 종료...")
    await cache_manager.shutdown()


app = FastAPI(
    title="당신이 잠든 사이 API",
    description="주식 브리핑 대시보드 백엔드 API",
    version="0.2.0",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
