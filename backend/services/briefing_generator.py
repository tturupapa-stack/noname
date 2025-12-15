"""브리핑 콘텐츠 생성 서비스"""

from datetime import datetime
from typing import List, Optional
from models.stock import StockDetail, ScoreBreakdown, WhyHotItem
from models.news import NewsItem


class BriefingGenerator:
    """마크다운 브리핑 콘텐츠 생성기"""

    def generate_markdown(
        self,
        stock: StockDetail,
        score: ScoreBreakdown,
        why_hot: List[WhyHotItem],
        news: List[NewsItem],
        screener_type: str = "most_actives"
    ) -> str:
        """
        브리핑 마크다운 콘텐츠 생성

        Args:
            stock: 종목 정보
            score: 점수 정보
            why_hot: WHY HOT 항목들
            news: 뉴스 목록
            screener_type: 스크리너 타입

        Returns:
            str: 마크다운 형식의 브리핑 콘텐츠
        """
        today = datetime.now()
        date_str = today.strftime("%Y년 %m월 %d일")
        time_str = today.strftime("%H:%M")

        # 스크리너 타입 한글화
        type_names = {
            "most_actives": "거래량 급증",
            "day_gainers": "상승률 상위",
            "day_losers": "하락률 상위"
        }
        type_name = type_names.get(screener_type, screener_type)

        # 가격 변동 방향
        change_direction = "상승" if stock.change_percent >= 0 else "하락"
        change_emoji = "📈" if stock.change_percent >= 0 else "📉"

        # 마크다운 생성
        markdown = f"""# 🌙 당신이 잠든 사이 - 오늘의 브리핑

> **{date_str}** {time_str} 기준

---

## 🔥 오늘의 화제 종목

### {stock.symbol} - {stock.name}

| 항목 | 값 |
|------|-----|
| 현재가 | **${stock.price:,.2f}** |
| 전일대비 | {change_emoji} {stock.change_percent:+.2f}% (${stock.change:+.2f}) |
| 거래량 | {stock.volume:,}주 |
| 시가총액 | ${self._format_market_cap(stock.market_cap)} |
| 선정 기준 | {type_name} |

---

## 📊 복합 점수 분석 ({score.total}/40점)

| 지표 | 점수 | 설명 |
|------|------|------|
| 거래량 급증 | {score.volume_score}/10 | {self._get_volume_desc(score.volume_score)} |
| 가격 변동 | {score.price_change_score}/10 | {self._get_price_desc(score.price_change_score)} |
| 모멘텀 | {score.momentum_score}/10 | {self._get_momentum_desc(score.momentum_score)} |
| 시가총액 | {score.market_cap_score}/10 | {self._get_mcap_desc(score.market_cap_score)} |

---

## 💡 WHY HOT?

{self._format_why_hot(why_hot)}

---

## 📰 관련 뉴스

{self._format_news(news)}

---

## 📝 투자 참고사항

> ⚠️ 본 브리핑은 정보 제공 목적이며, 투자 권유가 아닙니다.
> 투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다.

---

*🤖 자동 생성된 브리핑입니다.*
"""
        return markdown

    def _format_market_cap(self, market_cap: Optional[float]) -> str:
        """시가총액 포맷팅"""
        if market_cap is None:
            return "N/A"
        if market_cap >= 1_000_000_000_000:
            return f"{market_cap / 1_000_000_000_000:.2f}T"
        elif market_cap >= 1_000_000_000:
            return f"{market_cap / 1_000_000_000:.2f}B"
        elif market_cap >= 1_000_000:
            return f"{market_cap / 1_000_000:.2f}M"
        return f"{market_cap:,.0f}"

    def _get_volume_desc(self, score: int) -> str:
        """거래량 점수 설명"""
        if score >= 10:
            return "평소 대비 3배 이상 급증"
        elif score >= 7:
            return "평소 대비 2배 이상 증가"
        elif score >= 5:
            return "평소 대비 1.5배 이상"
        elif score >= 3:
            return "평소 대비 소폭 증가"
        return "평소 수준"

    def _get_price_desc(self, score: int) -> str:
        """가격 변동 점수 설명"""
        if score >= 10:
            return "10% 이상 급등/급락"
        elif score >= 7:
            return "5% 이상 큰 변동"
        elif score >= 5:
            return "3% 이상 변동"
        elif score >= 3:
            return "1% 이상 변동"
        return "소폭 변동"

    def _get_momentum_desc(self, score: int) -> str:
        """모멘텀 점수 설명"""
        if score >= 10:
            return "5일/10일 모두 상승 추세"
        elif score >= 5:
            return "단기 상승 추세"
        return "추세 불분명"

    def _get_mcap_desc(self, score: int) -> str:
        """시가총액 점수 설명"""
        if score >= 10:
            return "적정 규모 ($2B~$100B)"
        elif score >= 5:
            return "대형주 또는 중형주"
        return "초대형주 또는 소형주"

    def _format_why_hot(self, why_hot: List[WhyHotItem]) -> str:
        """WHY HOT 포맷팅"""
        if not why_hot:
            return "- 분석 정보 없음"

        lines = []
        for item in why_hot:
            lines.append(f"- {item.icon} {item.message}")
        return "\n".join(lines)

    def _format_news(self, news: List[NewsItem]) -> str:
        """뉴스 포맷팅"""
        if not news:
            return "- 관련 뉴스가 없습니다."

        lines = []
        for i, item in enumerate(news[:5], 1):
            title = item.title if item.title else "제목 없음"
            source = item.source if item.source else "출처 미상"
            lines.append(f"{i}. [{title}]({item.url}) - *{source}*")

        return "\n".join(lines)


# 싱글톤 인스턴스
briefing_generator = BriefingGenerator()
