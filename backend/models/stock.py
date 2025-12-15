from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class ScreenerType(str, Enum):
    """스크리너 타입"""
    MOST_ACTIVES = "most_actives"
    DAY_GAINERS = "day_gainers"
    DAY_LOSERS = "day_losers"


class ScoreBreakdown(BaseModel):
    """점수 상세 내역"""
    volume_score: int = 0          # 거래량 급증 (10점)
    price_change_score: int = 0    # 가격 변동 (10점)
    momentum_score: int = 0        # 모멘텀 일관성 (10점)
    market_cap_score: int = 0      # 시가총액 적정성 (10점)
    total: int = 0                 # 총점 (40점 만점)


class WhyHotItem(BaseModel):
    """WHY HOT 항목"""
    icon: str              # ✅, ⚠️, ❌
    message: str


class StockDetail(BaseModel):
    """종목 상세 정보"""
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    volume: int
    avg_volume: Optional[int] = None
    volume_ratio: Optional[float] = None  # 평소 대비 거래량 배수
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    fifty_two_week_high: Optional[float] = None
    fifty_two_week_low: Optional[float] = None
    currency: str = "USD"


class HotStockResponse(BaseModel):
    """화제 종목 응답 (내부용)"""
    stock: StockDetail
    score: ScoreBreakdown
    why_hot: List[WhyHotItem]
    recent_news: Optional[List[str]] = None


class TrendingStockResponse(BaseModel):
    """화제 종목 API 응답"""
    stock: StockDetail
    score: ScoreBreakdown
    why_hot: List[WhyHotItem]
    news: List["NewsItem"] = []


class StockDetailResponse(BaseModel):
    """종목 상세 API 응답"""
    stock: StockDetail
    news: List["NewsItem"] = []


class RankedStock(BaseModel):
    """순위가 포함된 종목"""
    rank: int
    stock: StockDetail
    score: ScoreBreakdown


class TopNStocksResponse(BaseModel):
    """TOP N 종목 API 응답"""
    screener_type: ScreenerType
    count: int
    stocks: List[RankedStock]


class CompareRequest(BaseModel):
    """종목 비교 요청"""
    tickers: List[str]


class CompareStockItem(BaseModel):
    """비교용 종목 정보"""
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    volume: int
    volume_formatted: str  # "45.2M" 형식
    market_cap: Optional[float] = None
    market_cap_formatted: str = "N/A"  # "$1.58T" 형식
    pe_ratio: Optional[float] = None


class CompareRanking(BaseModel):
    """비교 순위"""
    by_change_percent: List[str]  # 변동률 순 (높은 순)
    by_volume: List[str]  # 거래량 순 (높은 순)
    by_market_cap: List[str]  # 시가총액 순 (높은 순)


class CompareResponse(BaseModel):
    """종목 비교 응답"""
    count: int
    stocks: List[CompareStockItem]
    rankings: CompareRanking
    compared_at: str


class PriceDataPoint(BaseModel):
    """주가 데이터 포인트"""
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class ChartDataResponse(BaseModel):
    """차트 데이터 응답"""
    symbol: str
    name: str
    period: str
    data: List[PriceDataPoint]


# 순환 참조 방지를 위한 forward reference
from models.news import NewsItem
TrendingStockResponse.model_rebuild()
StockDetailResponse.model_rebuild()
