from datetime import datetime
from fastapi import APIRouter, HTTPException
from yahooquery import Ticker

from models.briefing import GenerateBriefingRequest, GenerateBriefingResponse
from models.stock import StockDetail, ScoreBreakdown, WhyHotItem
from services.briefing_generator import briefing_generator
from services.screener_service import hot_stock_screener, ScreenerServiceError
from services.news_service import get_news_service, NewsServiceError

router = APIRouter(prefix="/api/briefing", tags=["briefing-generate"])


@router.post("/generate", response_model=GenerateBriefingResponse)
async def generate_briefing(request: GenerateBriefingRequest):
    """
    브리핑 마크다운 콘텐츠 생성

    지정된 종목에 대한 브리핑 마크다운을 생성합니다.
    ticker가 지정되지 않으면 스크리너에서 TOP 1 종목을 자동 선정합니다.

    **Request Body:**
    - ticker: 종목 심볼 (예: TSLA, AAPL) - 빈 문자열이면 자동 선정
    - type: 스크리너 타입 (most_actives | day_gainers | day_losers)

    **Response:**
    - ticker: 브리핑 대상 종목
    - markdown: 생성된 마크다운 콘텐츠
    - generated_at: 생성 시각
    """
    ticker = request.ticker.upper().strip()
    screener_type = request.type

    try:
        # ticker가 비어있으면 스크리너에서 TOP 1 선정
        if not ticker:
            hot_result = hot_stock_screener.get_daily_hot_stock()
            stock = hot_result.stock
            score = hot_result.score
            why_hot = hot_result.why_hot
            ticker = stock.symbol
        else:
            # 지정된 ticker로 종목 정보 조회
            yq_ticker = Ticker(ticker)
            price_data = yq_ticker.price.get(ticker, {})
            summary_data = yq_ticker.summary_detail.get(ticker, {})

            if isinstance(price_data, str) or not price_data:
                raise HTTPException(
                    status_code=404,
                    detail=f"종목 '{ticker}'를 찾을 수 없습니다"
                )

            # StockDetail 생성
            stock = StockDetail(
                symbol=ticker,
                name=price_data.get("shortName") or price_data.get("longName", ticker),
                price=price_data.get("regularMarketPrice", 0),
                change=price_data.get("regularMarketChange", 0),
                change_percent=(price_data.get("regularMarketChangePercent", 0) * 100)
                    if price_data.get("regularMarketChangePercent") else 0,
                volume=price_data.get("regularMarketVolume", 0),
                avg_volume=summary_data.get("averageVolume") if isinstance(summary_data, dict) else None,
                market_cap=price_data.get("marketCap"),
                currency=price_data.get("currency", "USD")
            )

            # 점수 계산 (간단 버전)
            score = _calculate_simple_score(stock)
            why_hot = _generate_why_hot(stock, score)

        # 뉴스 조회
        news_items = []
        try:
            news_service = get_news_service()
            news_result = news_service.search_stock_news(
                ticker=ticker,
                num_results=5,
                hours=24
            )
            news_items = news_result.news
        except (NewsServiceError, Exception):
            pass

        # 마크다운 생성
        markdown = briefing_generator.generate_markdown(
            stock=stock,
            score=score,
            why_hot=why_hot,
            news=news_items,
            screener_type=screener_type
        )

        return GenerateBriefingResponse(
            ticker=ticker,
            markdown=markdown,
            generated_at=datetime.now()
        )

    except HTTPException:
        raise
    except ScreenerServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"브리핑 생성 실패: {str(e)}")


def _calculate_simple_score(stock: StockDetail) -> ScoreBreakdown:
    """간단한 점수 계산"""
    volume_score = 0
    price_change_score = 0
    momentum_score = 5  # 기본값
    market_cap_score = 0

    # 거래량 점수
    if stock.avg_volume and stock.volume:
        ratio = stock.volume / stock.avg_volume
        if ratio >= 3:
            volume_score = 10
        elif ratio >= 2:
            volume_score = 7
        elif ratio >= 1.5:
            volume_score = 5
        elif ratio >= 1.2:
            volume_score = 3

    # 가격 변동 점수
    change = abs(stock.change_percent)
    if change >= 10:
        price_change_score = 10
    elif change >= 5:
        price_change_score = 7
    elif change >= 3:
        price_change_score = 5
    elif change >= 1:
        price_change_score = 3

    # 시가총액 점수
    if stock.market_cap:
        mcap_b = stock.market_cap / 1_000_000_000
        if 2 <= mcap_b <= 100:
            market_cap_score = 10
        elif mcap_b < 2:
            market_cap_score = 5
        else:
            market_cap_score = 7

    return ScoreBreakdown(
        volume_score=volume_score,
        price_change_score=price_change_score,
        momentum_score=momentum_score,
        market_cap_score=market_cap_score,
        total=volume_score + price_change_score + momentum_score + market_cap_score
    )


def _generate_why_hot(stock: StockDetail, score: ScoreBreakdown) -> list[WhyHotItem]:
    """WHY HOT 생성"""
    items = []

    if score.volume_score >= 7 and stock.avg_volume:
        ratio = stock.volume / stock.avg_volume
        items.append(WhyHotItem(icon="✅", message=f"거래량 급증 (평소 대비 {ratio:.2f}배)"))

    if score.price_change_score >= 7:
        direction = "상승" if stock.change_percent >= 0 else "하락"
        items.append(WhyHotItem(icon="✅", message=f"당일 {abs(stock.change_percent):.1f}% {direction}"))

    if score.market_cap_score >= 10:
        items.append(WhyHotItem(icon="✅", message="적정 시가총액 구간 ($2B~$100B)"))

    if not items:
        items.append(WhyHotItem(icon="ℹ️", message="일반적인 거래 패턴"))

    return items
