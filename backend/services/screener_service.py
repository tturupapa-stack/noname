from yahooquery import Screener, Ticker
from typing import List, Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
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
    MAX_PARALLEL_REQUESTS = 10  # 병렬 요청 최대 개수

    def __init__(self):
        self.screener = Screener()
        self._momentum_cache: Dict[str, int] = {}  # 모멘텀 점수 캐시

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

        # 빈 리스트 검사
        if not scored_candidates:
            raise ScreenerServiceError("점수 계산된 후보 종목이 없습니다")

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
        """복합 점수 계산 (모멘텀 점수는 배치 병렬 처리)"""
        # 1. 먼저 모멘텀 점수가 필요한 심볼들을 수집
        symbols_to_fetch = [
            c["symbol"] for c in candidates
            if c["symbol"] not in self._momentum_cache
        ]

        # 2. 배치로 모멘텀 점수 병렬 계산 (캐시 미스인 것만)
        if symbols_to_fetch:
            momentum_scores = self._calculate_momentum_scores_batch(symbols_to_fetch)
            self._momentum_cache.update(momentum_scores)

        # 3. 각 종목의 점수 계산
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

            # 3. 모멘텀 점수 (10점) - 캐시에서 가져옴
            momentum_score = self._momentum_cache.get(candidate["symbol"], 0)
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

    def _calculate_momentum_scores_batch(self, symbols: List[str]) -> Dict[str, int]:
        """
        여러 종목의 모멘텀 점수를 배치로 병렬 계산
        yahooquery의 Ticker는 여러 심볼을 한 번에 처리할 수 있음
        """
        momentum_scores: Dict[str, int] = {}

        if not symbols:
            return momentum_scores

        try:
            # yahooquery는 여러 심볼을 한 번에 처리 가능
            ticker = Ticker(symbols, asynchronous=True)
            hist = ticker.history(period="1mo", interval="1d")

            if hist is None or hist.empty:
                return {s: 0 for s in symbols}

            # MultiIndex DataFrame 처리
            for symbol in symbols:
                try:
                    if isinstance(hist.index, type(hist.index)) and hasattr(hist.index, 'get_level_values'):
                        # MultiIndex인 경우 심볼별로 슬라이싱
                        try:
                            symbol_hist = hist.loc[symbol] if symbol in hist.index.get_level_values(0) else None
                        except KeyError:
                            symbol_hist = None
                    else:
                        symbol_hist = hist

                    if symbol_hist is None or (hasattr(symbol_hist, 'empty') and symbol_hist.empty):
                        momentum_scores[symbol] = 0
                        continue

                    closes = symbol_hist["close"].values if "close" in symbol_hist.columns else []

                    if len(closes) < 10:
                        momentum_scores[symbol] = 0
                        continue

                    # 5일 수익률 (0으로 나누기 방지)
                    return_5d = (closes[-1] - closes[-5]) / closes[-5] * 100 if closes[-5] and closes[-5] != 0 else 0
                    # 10일 수익률 (0으로 나누기 방지)
                    return_10d = (closes[-1] - closes[-10]) / closes[-10] * 100 if closes[-10] and closes[-10] != 0 else 0

                    if return_5d > 0 and return_10d > 0:
                        momentum_scores[symbol] = 10
                    elif return_5d > 0:
                        momentum_scores[symbol] = 5
                    else:
                        momentum_scores[symbol] = 0

                except Exception:
                    momentum_scores[symbol] = 0

        except Exception:
            # 배치 실패 시 모든 심볼에 0점
            momentum_scores = {s: 0 for s in symbols}

        # 누락된 심볼 처리
        for symbol in symbols:
            if symbol not in momentum_scores:
                momentum_scores[symbol] = 0

        return momentum_scores

    def _calculate_momentum_score(self, symbol: str) -> int:
        """모멘텀 점수 계산 (5일/10일 수익률 기반) - 캐시 우선 확인"""
        # 캐시 확인
        if symbol in self._momentum_cache:
            return self._momentum_cache[symbol]

        try:
            ticker = Ticker(symbol)
            hist = ticker.history(period="1mo", interval="1d")

            if hist is None or hist.empty:
                self._momentum_cache[symbol] = 0
                return 0

            # MultiIndex 처리
            if isinstance(hist.index, type(hist.index)) and hasattr(hist.index, 'get_level_values'):
                try:
                    hist = hist.reset_index()
                except Exception:
                    pass

            if "close" not in hist.columns:
                self._momentum_cache[symbol] = 0
                return 0

            closes = hist["close"].values

            if len(closes) < 10:
                self._momentum_cache[symbol] = 0
                return 0

            # 5일 수익률 (0으로 나누기 방지)
            return_5d = (closes[-1] - closes[-5]) / closes[-5] * 100 if closes[-5] and closes[-5] != 0 else 0
            # 10일 수익률 (0으로 나누기 방지)
            return_10d = (closes[-1] - closes[-10]) / closes[-10] * 100 if closes[-10] and closes[-10] != 0 else 0

            if return_5d > 0 and return_10d > 0:
                score = 10
            elif return_5d > 0:
                score = 5
            else:
                score = 0

            self._momentum_cache[symbol] = score
            return score

        except Exception:
            self._momentum_cache[symbol] = 0
            return 0

    def _get_stock_detail(self, candidate: Dict) -> StockDetail:
        """종목 상세 정보 조회 - candidate 데이터 재사용으로 API 호출 최소화"""
        # candidate에 이미 있는 데이터로 StockDetail 생성
        # 추가 API 호출 없이 기본 정보만 반환 (성능 최적화)
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
            # PE ratio, 52week high/low는 상세 페이지에서만 조회
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
