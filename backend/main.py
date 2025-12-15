import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from api.stock import router as stock_router
from api.briefing import router as briefing_router
from api.briefing_generate import router as briefing_generate_router

# .env 파일 로드
load_dotenv()


async def preload_cache():
    """서버 시작 시 캐시 미리 로드 (백그라운드)"""
    import httpx
    await asyncio.sleep(2)  # 서버 시작 대기

    try:
        async with httpx.AsyncClient() as client:
            print("📦 캐시 프리로딩 시작...")

            # TOP 3 종목 미리 로드
            await client.get(
                "http://localhost:8000/api/stocks/trending/top?type=most_actives&count=3",
                timeout=120.0
            )
            print("✅ TOP 3 캐시 로드 완료")

    except Exception as e:
        print(f"⚠️ 캐시 프리로딩 실패 (서비스는 정상 작동): {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 생명주기 관리"""
    # 시작 시: 백그라운드에서 캐시 프리로딩
    asyncio.create_task(preload_cache())
    yield
    # 종료 시: 정리 작업

app = FastAPI(
    title="당신이 잠든 사이 API",
    description="주식 브리핑 대시보드 백엔드 API",
    version="0.1.0",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "당신이 잠든 사이 API", "status": "running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# 라우터 등록
app.include_router(stock_router)
app.include_router(briefing_router)
app.include_router(briefing_generate_router)
