import os
from fastapi import APIRouter, HTTPException, Query
from dotenv import load_dotenv

from datetime import datetime
from models.stock import (
    ScreenerType, TrendingStockResponse, StockDetailResponse, StockDetail,
    TopNStocksResponse, CompareRequest, CompareResponse, CompareStockItem, CompareRanking,
    ChartDataResponse, PriceDataPoint
)
from models.news import NewsItem
from services.screener_service import hot_stock_screener, ScreenerServiceError
from services.news_service import get_news_service, NewsServiceError
from services.briefing_service import briefing_storage
from services.cache_service import (
    cache, CACHE_KEY_TRENDING, CACHE_KEY_TOP_N, CACHE_KEY_NEWS,
    CACHE_KEY_STOCK_DETAIL, CACHE_KEY_CHART,
    CACHE_TTL_TRENDING, CACHE_TTL_TOP_N, CACHE_TTL_NEWS,
    CACHE_TTL_STOCK_DETAIL, CACHE_TTL_CHART
)

# .env 파일 로드
load_dotenv()

router = APIRouter(prefix="/api/stocks", tags=["stocks"])


@router.post("/cache/clear")
async def clear_cache():
    """캐시 초기화 - 수동으로 새로운 데이터 로드가 필요할 때 사용"""
    cache.clear()
    return {"message": "캐시가 초기화되었습니다", "status": "ok"}


@router.get("/{ticker}/chart", response_model=ChartDataResponse)
async def get_stock_chart(
    ticker: str,
    period: str = Query(default="5d", description="기간: 5d, 1mo, 3mo, 6mo, 1y")
):
    """
    종목 차트 데이터 조회

    **파라미터:**
    - ticker: 종목 심볼 (예: TSLA, AAPL)
    - period: 기간 (5d, 1mo, 3mo, 6mo, 1y)
    """
    ticker = ticker.upper()

    # 캐시 확인
    cache_key = CACHE_KEY_CHART.format(ticker=ticker, period=period)
    cached = cache.get(cache_key)
    if cached:
        return cached

    try:
        from yahooquery import Ticker

        yq_ticker = Ticker(ticker)

        # 종목명 조회
        price_data = yq_ticker.price.get(ticker, {})
        if isinstance(price_data, str) or not price_data:
            raise HTTPException(status_code=404, detail=f"종목 '{ticker}'를 찾을 수 없습니다")

        name = price_data.get("shortName") or price_data.get("longName", ticker)

        # 히스토리 데이터 조회
        history = yq_ticker.history(period=period)

        if history.empty or isinstance(history, str):
            raise HTTPException(status_code=404, detail="차트 데이터를 가져올 수 없습니다")

        # DataFrame을 리스트로 변환
        data_points = []
        for idx, row in history.iterrows():
            # idx는 (symbol, date) 튜플
            date_str = idx[1].strftime("%Y-%m-%d") if hasattr(idx[1], 'strftime') else str(idx[1])
            data_points.append(PriceDataPoint(
                date=date_str,
                open=round(row.get("open", 0), 2),
                high=round(row.get("high", 0), 2),
                low=round(row.get("low", 0), 2),
                close=round(row.get("close", 0), 2),
                volume=int(row.get("volume", 0))
            ))

        response = ChartDataResponse(
            symbol=ticker,
            name=name,
            period=period,
            data=data_points
        )

        # 캐시 저장
        cache.set(cache_key, response, CACHE_TTL_CHART)

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"차트 조회 실패: {str(e)}")


@router.get("/trending", response_model=TrendingStockResponse)
async def get_trending_stock(
    type: ScreenerType = Query(
        default=ScreenerType.MOST_ACTIVES,
        description="스크리너 타입: most_actives(거래량), day_gainers(상승), day_losers(하락)"
    )
):
    """
    화제 종목 조회 (캐시 적용: 5분)

    3개 스크리너에서 30개 후보를 수집하고, 복합 점수(40점 만점)로 TOP 1 종목 선정.
    선정된 종목의 관련 뉴스도 함께 반환.

    **점수 기준:**
    - 거래량 급증 (10점): 평소 대비 3배 이상
    - 가격 변동 (10점): 5% 이상 변동
    - 모멘텀 일관성 (10점): 5일/10일 수익률 양수
    - 시가총액 적정성 (10점): $2B~$100B 구간
    """
    # 캐시 확인
    cached = cache.get(CACHE_KEY_TRENDING)
    if cached:
        return cached

    try:
        # 1. 화제 종목 조회
        hot_result = hot_stock_screener.get_daily_hot_stock()

        # 2. 뉴스 조회 (캐시 적용)
        news_cache_key = CACHE_KEY_NEWS.format(ticker=hot_result.stock.symbol)
        news_items = cache.get(news_cache_key)

        if news_items is None:
            news_items = []
            try:
                news_service = get_news_service()
                news_result = news_service.search_stock_news(
                    ticker=hot_result.stock.symbol,
                    num_results=5,
                    hours=24
                )
                news_items = news_result.news
                cache.set(news_cache_key, news_items, CACHE_TTL_NEWS)
            except (NewsServiceError, Exception):
                pass

        # 3. 브리핑 자동 저장
        try:
            briefing_storage.save_briefing(
                stock=hot_result.stock,
                score=hot_result.score,
                why_hot=hot_result.why_hot,
                news=news_items
            )
        except Exception:
            pass

        response = TrendingStockResponse(
            stock=hot_result.stock,
            score=hot_result.score,
            why_hot=hot_result.why_hot,
            news=news_items
        )

        # 캐시 저장
        cache.set(CACHE_KEY_TRENDING, response, CACHE_TTL_TRENDING)

        return response

    except ScreenerServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.get("/trending/top", response_model=TopNStocksResponse)
async def get_top_n_stocks(
    type: ScreenerType = Query(
        default=ScreenerType.MOST_ACTIVES,
        description="스크리너 타입: most_actives(거래량), day_gainers(상승), day_losers(하락)"
    ),
    count: int = Query(
        default=5,
        ge=1,
        le=10,
        description="조회할 종목 수 (1~10)"
    )
):
    """
    TOP N 종목 조회 (캐시 적용: 5분)

    지정된 스크리너 타입에서 TOP N 종목을 점수순으로 반환.

    **파라미터:**
    - type: 스크리너 타입
    - count: 조회 개수 (1~10, 기본값 5)

    **응답:**
    - 각 종목의 순위, 상세 정보, 점수 포함
    """
    # 캐시 확인
    cache_key = CACHE_KEY_TOP_N.format(type=type.value, count=count)
    cached = cache.get(cache_key)
    if cached:
        return cached

    try:
        result = hot_stock_screener.get_top_n_stocks(
            screener_type=type,
            count=count
        )

        # 캐시 저장
        cache.set(cache_key, result, CACHE_TTL_TOP_N)

        return result

    except ScreenerServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.post("/compare", response_model=CompareResponse)
async def compare_stocks(request: CompareRequest):
    """
    여러 종목 비교

    최대 5개 종목의 주요 지표를 비교합니다.

    **Request Body:**
    - tickers: 비교할 종목 심볼 리스트 (최대 5개)

    **Response:**
    - 각 종목의 가격, 변동률, 거래량, 시가총액
    - 지표별 순위
    """
    tickers = [t.upper().strip() for t in request.tickers if t.strip()]

    # 중복 제거
    tickers = list(dict.fromkeys(tickers))

    # 최대 5개 제한
    if len(tickers) > 5:
        raise HTTPException(
            status_code=400,
            detail="최대 5개 종목까지 비교 가능합니다"
        )

    if len(tickers) < 2:
        raise HTTPException(
            status_code=400,
            detail="최소 2개 이상의 종목이 필요합니다"
        )

    try:
        from yahooquery import Ticker

        # 종목 정보 조회
        yq_tickers = Ticker(tickers)
        price_data = yq_tickers.price
        summary_data = yq_tickers.summary_detail

        stocks = []
        for ticker in tickers:
            p_data = price_data.get(ticker, {})
            s_data = summary_data.get(ticker, {})

            if isinstance(p_data, str) or not p_data:
                continue

            volume = p_data.get("regularMarketVolume", 0)
            market_cap = p_data.get("marketCap")

            stocks.append(CompareStockItem(
                symbol=ticker,
                name=p_data.get("shortName") or p_data.get("longName", ticker),
                price=p_data.get("regularMarketPrice", 0),
                change=p_data.get("regularMarketChange", 0),
                change_percent=(p_data.get("regularMarketChangePercent", 0) * 100)
                    if p_data.get("regularMarketChangePercent") else 0,
                volume=volume,
                volume_formatted=_format_number(volume),
                market_cap=market_cap,
                market_cap_formatted=_format_market_cap(market_cap),
                pe_ratio=s_data.get("trailingPE") if isinstance(s_data, dict) else None
            ))

        if len(stocks) < 2:
            raise HTTPException(
                status_code=400,
                detail="유효한 종목을 2개 이상 찾을 수 없습니다"
            )

        # 순위 계산
        rankings = CompareRanking(
            by_change_percent=[s.symbol for s in sorted(stocks, key=lambda x: x.change_percent, reverse=True)],
            by_volume=[s.symbol for s in sorted(stocks, key=lambda x: x.volume, reverse=True)],
            by_market_cap=[s.symbol for s in sorted(stocks, key=lambda x: x.market_cap or 0, reverse=True)]
        )

        return CompareResponse(
            count=len(stocks),
            stocks=stocks,
            rankings=rankings,
            compared_at=datetime.now().isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"비교 실패: {str(e)}")


def _format_number(num: int) -> str:
    """숫자를 K/M/B 형식으로 포맷"""
    if num >= 1_000_000_000:
        return f"{num / 1_000_000_000:.2f}B"
    elif num >= 1_000_000:
        return f"{num / 1_000_000:.2f}M"
    elif num >= 1_000:
        return f"{num / 1_000:.2f}K"
    return str(num)


def _format_market_cap(market_cap: float | None) -> str:
    """시가총액을 T/B/M 형식으로 포맷"""
    if market_cap is None:
        return "N/A"
    if market_cap >= 1_000_000_000_000:
        return f"${market_cap / 1_000_000_000_000:.2f}T"
    elif market_cap >= 1_000_000_000:
        return f"${market_cap / 1_000_000_000:.2f}B"
    elif market_cap >= 1_000_000:
        return f"${market_cap / 1_000_000:.2f}M"
    return f"${market_cap:,.0f}"


@router.get("/{ticker}", response_model=StockDetailResponse)
async def get_stock_detail(ticker: str):
    """
    종목 상세 정보 조회 (캐시 적용: 5분)

    지정된 종목의 기본 정보와 최근 뉴스를 반환.

    **Args:**
    - ticker: 종목 심볼 (예: NVDA, AAPL, TSLA)
    """
    ticker = ticker.upper()

    # 캐시 확인
    cache_key = CACHE_KEY_STOCK_DETAIL.format(ticker=ticker)
    cached = cache.get(cache_key)
    if cached:
        return cached

    try:
        from yahooquery import Ticker

        # 1. 종목 정보 조회
        yq_ticker = Ticker(ticker)
        price_data = yq_ticker.price.get(ticker, {})
        summary_data = yq_ticker.summary_detail.get(ticker, {})

        # 에러 체크
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
            change_percent=price_data.get("regularMarketChangePercent", 0) * 100
                if price_data.get("regularMarketChangePercent") else 0,
            volume=price_data.get("regularMarketVolume", 0),
            avg_volume=summary_data.get("averageVolume") if isinstance(summary_data, dict) else None,
            market_cap=price_data.get("marketCap"),
            pe_ratio=summary_data.get("trailingPE") if isinstance(summary_data, dict) else None,
            fifty_two_week_high=summary_data.get("fiftyTwoWeekHigh") if isinstance(summary_data, dict) else None,
            fifty_two_week_low=summary_data.get("fiftyTwoWeekLow") if isinstance(summary_data, dict) else None,
            currency=price_data.get("currency", "USD")
        )

        # 2. 뉴스 조회 (캐시 적용)
        news_cache_key = CACHE_KEY_NEWS.format(ticker=ticker)
        news_items = cache.get(news_cache_key)

        if news_items is None:
            news_items = []
            try:
                news_service = get_news_service()
                news_result = news_service.search_stock_news(
                    ticker=ticker,
                    num_results=5,
                    hours=24
                )
                news_items = news_result.news
                cache.set(news_cache_key, news_items, CACHE_TTL_NEWS)
            except (NewsServiceError, Exception):
                pass

        response = StockDetailResponse(
            stock=stock,
            news=news_items
        )

        # 캐시 저장
        cache.set(cache_key, response, CACHE_TTL_STOCK_DETAIL)

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")
