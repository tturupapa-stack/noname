from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from models.stock import StockDetail, ScoreBreakdown, WhyHotItem
from models.news import NewsItem


class Briefing(BaseModel):
    """브리핑 데이터"""
    id: str  # YYYY-MM-DD 형식
    date: str  # YYYY-MM-DD
    created_at: datetime
    stock: StockDetail
    score: ScoreBreakdown
    why_hot: List[WhyHotItem]
    news: List[NewsItem] = []


class BriefingListResponse(BaseModel):
    """브리핑 리스트 응답"""
    briefings: List[Briefing]
    total: int
    page: int
    limit: int
    total_pages: int


class BriefingResponse(BaseModel):
    """단일 브리핑 응답"""
    briefing: Briefing


class GenerateBriefingRequest(BaseModel):
    """브리핑 생성 요청"""
    ticker: str
    type: str = "most_actives"  # most_actives | day_gainers | day_losers


class GenerateBriefingResponse(BaseModel):
    """브리핑 생성 응답"""
    ticker: str
    markdown: str
    generated_at: datetime


class AIBriefingRequest(BaseModel):
    """AI 브리핑 생성 요청"""
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    news_count: int = 3


class AIBriefingResponse(BaseModel):
    """AI 브리핑 생성 응답"""
    symbol: str
    name: str
    markdown: str
    generated_at: datetime
    success: bool
    error: Optional[str] = None
