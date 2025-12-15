from yahooquery import Screener, Ticker
from typing import List, Dict, Any, Optional
from models.stock import (
    ScreenerType, ScoreBreakdown, WhyHotItem,
    StockDetail, HotStockResponse, RankedStock, TopNStocksResponse
)


class ScreenerServiceError(Exception):
    """스크리너 서비스 에러"""
    pass


class HotStockScreener:
    """복합 지표 기반 화제 종목 스크리너"""

    SCREENER_TYPES = [
        ScreenerType.MOST_ACTIVES,
        ScreenerType.DAY_GAINERS,
        ScreenerType.DAY_LOSERS
    ]
    CANDIDATES_PER_TYPE = 10  # 각 타입에서 10개씩 = 총 30개

    def __init__(self):
        self.screener = Screener()

    def get_daily_hot_stock(self) -> HotStockResponse:
        """
        오늘의 화제 종목 1개 선정

        Returns:
            HotStockResponse: 화제 종목 정보
        """
        # 1. 후보 종목 수집 (30개)
        candidates = self._get_candidates()

        if not candidates:
            raise ScreenerServiceError("후보 종목을 찾을 수 없습니다")

        # 2. 복합 점수 계산
        scored_candidates = self._calculate_scores(candidates)

        # 3. TOP 1 선정 (점수순, 동점시 거래량순)
        winner = sorted(
            scored_candidates,
            key=lambda x: (x["score"].total, x["volume"]),
            reverse=True
        )[0]

        # 4. 상세 정보 조회
        stock_detail = self._get_stock_detail(winner)

        # 5. WHY HOT 생성
        why_hot = self._generate_why_hot(winner, stock_detail)

        # 6. 뉴스 조회 (선택)
        news = self._get_news(winner["symbol"])

        return HotStockResponse(
            stock=stock_detail,
            score=winner["score"],
            why_hot=why_hot,
            recent_news=news
        )

    def get_top_n_stocks(
        self,
        screener_type: ScreenerType,
        count: int = 5
    ) -> TopNStocksResponse:
        """
        TOP N 종목 조회

        Args:
            screener_type: 스크리너 타입 (most_actives, day_gainers, day_losers)
            count: 조회할 종목 수 (1~10)

        Returns:
            TopNStocksResponse: TOP N 종목 리스트
        """
        # count 범위 검증
        count = max(1, min(10, count))

        try:
            # 1. 해당 스크리너에서 종목 조회
            result = self.screener.get_screeners([screener_type.value], count=count)

            if not isinstance(result, dict):
                raise ScreenerServiceError(f"스크리너 응답 오류: {type(result)}")

            if screener_type.value not in result:
                raise ScreenerServiceError(f"스크리너 '{screener_type.value}' 결과 없음")

            quotes = result[screener_type.value].get("quotes", [])

            if not quotes:
                raise ScreenerServiceError(f"'{screener_type.value}' 결과가 비어있음")

            # 2. 후보 리스트 생성
            candidates = []
            for quote in quotes[:count]:
                candidates.append({
                    "symbol": quote.get("symbol"),
                    "name": quote.get("shortName") or quote.get("longName", ""),
                    "price": quote.get("regularMarketPrice", 0),
                    "change": quote.get("regularMarketChange", 0),
                    "change_percent": quote.get("regularMarketChangePercent", 0),
                    "volume": quote.get("regularMarketVolume", 0),
                    "avg_volume": quote.get("averageDailyVolume3Month", 0),
                    "market_cap": quote.get("marketCap"),
                })

            # 3. 점수 계산
            scored_candidates = self._calculate_scores(candidates)

            # 4. 점수순 정렬 (동점시 거래량순)
            sorted_candidates = sorted(
                scored_candidates,
                key=lambda x: (x["score"].total, x["volume"]),
                reverse=True
            )

            # 5. RankedStock 리스트 생성
            ranked_stocks = []
            for rank, candidate in enumerate(sorted_candidates, 1):
                stock_detail = StockDetail(
                    symbol=candidate["symbol"],
                    name=candidate["name"],
                    price=candidate["price"],
                    change=candidate["change"],
                    change_percent=candidate["change_percent"],
                    volume=candidate["volume"],
                    avg_volume=candidate.get("avg_volume"),
                    volume_ratio=candidate.get("volume_ratio"),
                    market_cap=candidate.get("market_cap"),
                )

                ranked_stocks.append(RankedStock(
                    rank=rank,
                    stock=stock_detail,
                    score=candidate["score"]
                ))

            return TopNStocksResponse(
                screener_type=screener_type,
                count=len(ranked_stocks),
                stocks=ranked_stocks
            )

        except ScreenerServiceError:
            raise
        except Exception as e:
            raise ScreenerServiceError(f"TOP N 조회 실패: {str(e)}")

    def _get_candidates(self) -> List[Dict[str, Any]]:
        """3개 스크리너에서 후보 종목 수집"""
        candidates = []
        seen_symbols = set()

        try:
            screener_ids = [st.value for st in self.SCREENER_TYPES]
            result = self.screener.get_screeners(
                screener_ids,
                count=self.CANDIDATES_PER_TYPE
            )

            if not isinstance(result, dict):
                raise ScreenerServiceError(f"스크리너 응답 오류: {type(result)}")

            for screener_type in screener_ids:
                if screener_type not in result:
                    continue

                quotes = result[screener_type].get("quotes", [])

                for quote in quotes:
                    symbol = quote.get("symbol")
                    if not symbol or symbol in seen_symbols:
                        continue

                    seen_symbols.add(symbol)
                    candidates.append({
                        "symbol": symbol,
                        "name": quote.get("shortName") or quote.get("longName", ""),
                        "price": quote.get("regularMarketPrice", 0),
                        "change": quote.get("regularMarketChange", 0),
                        "change_percent": quote.get("regularMarketChangePercent", 0),
                        "volume": quote.get("regularMarketVolume", 0),
                        "avg_volume": quote.get("averageDailyVolume3Month", 0),
                        "market_cap": quote.get("marketCap"),
                        "source": screener_type
                    })

            return candidates

        except ScreenerServiceError:
            raise
        except Exception as e:
            raise ScreenerServiceError(f"후보 수집 실패: {str(e)}")

    def _calculate_scores(self, candidates: List[Dict]) -> List[Dict]:
        """복합 점수 계산"""
        for candidate in candidates:
            score = ScoreBreakdown()

            # 1. 거래량 급증 점수 (10점)
            volume = candidate.get("volume", 0)
            avg_volume = candidate.get("avg_volume", 0)

            if avg_volume and avg_volume > 0:
                volume_ratio = volume / avg_volume
                candidate["volume_ratio"] = round(volume_ratio, 2)

                if volume_ratio >= 3:
                    score.volume_score = 10
                elif volume_ratio >= 2:
                    score.volume_score = 7
                elif volume_ratio >= 1.5:
                    score.volume_score = 5

            # 2. 가격 변동 점수 (10점)
            change_percent = abs(candidate.get("change_percent", 0))

            if change_percent >= 5:
                score.price_change_score = 10
            elif change_percent >= 3:
                score.price_change_score = 7
            elif change_percent >= 2:
                score.price_change_score = 5

            # 3. 모멘텀 점수 (10점) - history 조회 필요
            momentum_score = self._calculate_momentum_score(candidate["symbol"])
            score.momentum_score = momentum_score
            candidate["momentum_data"] = momentum_score > 0

            # 4. 시가총액 적정성 점수 (10점)
            market_cap = candidate.get("market_cap", 0)

            if market_cap:
                cap_billions = market_cap / 1_000_000_000

                if 2 <= cap_billions <= 100:
                    score.market_cap_score = 10
                elif 1 <= cap_billions <= 200:
                    score.market_cap_score = 5

            # 총점 계산
            score.total = (
                score.volume_score +
                score.price_change_score +
                score.momentum_score +
                score.market_cap_score
            )

            candidate["score"] = score

        return candidates

    def _calculate_momentum_score(self, symbol: str) -> int:
        """모멘텀 점수 계산 (5일/10일 수익률 기반)"""
        try:
            ticker = Ticker(symbol)
            hist = ticker.history(period="1mo", interval="1d")

            if hist is None or hist.empty:
                return 0

            # MultiIndex 처리
            if isinstance(hist.index, type(hist.index)) and hasattr(hist.index, 'get_level_values'):
                try:
                    hist = hist.reset_index()
                except Exception:
                    pass

            if "close" not in hist.columns:
                return 0

            closes = hist["close"].values

            if len(closes) < 10:
                return 0

            # 5일 수익률
            return_5d = (closes[-1] - closes[-5]) / closes[-5] * 100 if closes[-5] else 0
            # 10일 수익률
            return_10d = (closes[-1] - closes[-10]) / closes[-10] * 100 if closes[-10] else 0

            if return_5d > 0 and return_10d > 0:
                return 10
            elif return_5d > 0:
                return 5

            return 0

        except Exception:
            return 0

    def _get_stock_detail(self, candidate: Dict) -> StockDetail:
        """종목 상세 정보 조회"""
        try:
            ticker = Ticker(candidate["symbol"])
            summary = ticker.summary_detail.get(candidate["symbol"], {})

            if isinstance(summary, str):
                summary = {}

            return StockDetail(
                symbol=candidate["symbol"],
                name=candidate["name"],
                price=candidate["price"],
                change=candidate["change"],
                change_percent=candidate["change_percent"],
                volume=candidate["volume"],
                avg_volume=candidate.get("avg_volume"),
                volume_ratio=candidate.get("volume_ratio"),
                market_cap=candidate.get("market_cap"),
                pe_ratio=summary.get("trailingPE"),
                fifty_two_week_high=summary.get("fiftyTwoWeekHigh"),
                fifty_two_week_low=summary.get("fiftyTwoWeekLow"),
            )

        except Exception:
            return StockDetail(
                symbol=candidate["symbol"],
                name=candidate["name"],
                price=candidate["price"],
                change=candidate["change"],
                change_percent=candidate["change_percent"],
                volume=candidate["volume"],
                avg_volume=candidate.get("avg_volume"),
                volume_ratio=candidate.get("volume_ratio"),
                market_cap=candidate.get("market_cap"),
            )

    def _generate_why_hot(self, candidate: Dict, detail: StockDetail) -> List[WhyHotItem]:
        """WHY HOT 생성"""
        items = []
        score = candidate["score"]

        # 거래량 급증
        volume_ratio = candidate.get("volume_ratio", 0)
        if volume_ratio >= 1.5:
            items.append(WhyHotItem(
                icon="✅",
                message=f"거래량 급증 (평소 대비 {volume_ratio}배)"
            ))

        # 가격 변동
        change_pct = candidate.get("change_percent", 0)
        if abs(change_pct) >= 2:
            direction = "상승" if change_pct > 0 else "하락"
            items.append(WhyHotItem(
                icon="✅",
                message=f"당일 {abs(change_pct):.1f}% {direction}"
            ))

        # 모멘텀
        if score.momentum_score == 10:
            items.append(WhyHotItem(
                icon="✅",
                message="5일·10일 수익률 모두 양수 (상승 추세)"
            ))
        elif score.momentum_score == 5:
            items.append(WhyHotItem(
                icon="✅",
                message="5일 수익률 양수 (단기 상승)"
            ))

        # 시가총액
        if score.market_cap_score == 10:
            items.append(WhyHotItem(
                icon="✅",
                message="적정 시가총액 구간 ($2B~$100B)"
            ))

        # PER 경고
        if detail.pe_ratio and detail.pe_ratio > 100:
            items.append(WhyHotItem(
                icon="⚠️",
                message=f"PER {detail.pe_ratio:.0f}배로 다소 높음"
            ))

        # 기본 항목 없으면 추가
        if not items:
            items.append(WhyHotItem(
                icon="✅",
                message="3개 스크리너(거래량/상승/하락)에서 상위권 진입"
            ))

        return items

    def _get_news(self, symbol: str) -> Optional[List[str]]:
        """최근 뉴스 조회"""
        try:
            ticker = Ticker(symbol)
            news = ticker.news()

            if not news or not isinstance(news, list):
                return None

            # 최근 3개 뉴스 제목
            titles = []
            for item in news[:3]:
                if isinstance(item, dict) and "title" in item:
                    titles.append(item["title"])

            return titles if titles else None

        except Exception:
            return None


# 싱글톤 인스턴스
hot_stock_screener = HotStockScreener()
