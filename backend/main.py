from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="당신이 잠든 사이 API",
    description="주식 브리핑 대시보드 백엔드 API",
    version="0.1.0"
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
