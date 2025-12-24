"""차트 데이터 수집 및 텍스트 변환 서비스"""

from typing import List, Dict, Optional
from datetime import datetime
from yahooquery import Ticker


class ChartService:
    """Yahoo Finance 차트 데이터 수집 및 LLM용 텍스트 변환"""

    def get_chart_data(self, symbol: str, period: str = "5d") -> Dict:
        """
        종목 차트 데이터 수집

        Args:
            symbol: 종목 심볼
            period: 기간 (5d, 1mo, 3mo, 6mo, 1y)

        Returns:
            차트 데이터 딕셔너리
        """
        try:
            ticker = Ticker(symbol)
            history = ticker.history(period=period)

            if history.empty or isinstance(history, str):
                return {"error": "차트 데이터를 가져올 수 없습니다"}

            # DataFrame을 리스트로 변환
            data_points = []
            for idx, row in history.iterrows():
                date_str = idx[1].strftime("%Y-%m-%d") if hasattr(idx[1], 'strftime') else str(idx[1])
                data_points.append({
                    "date": date_str,
                    "open": round(row.get("open", 0), 2),
                    "high": round(row.get("high", 0), 2),
                    "low": round(row.get("low", 0), 2),
                    "close": round(row.get("close", 0), 2),
                    "volume": int(row.get("volume", 0))
                })

            return {
                "symbol": symbol,
                "period": period,
                "data": data_points
            }
        except Exception as e:
            return {"error": f"차트 데이터 수집 실패: {str(e)}"}

    def format_chart_for_llm(self, chart_data: Dict) -> str:
        """
        차트 데이터를 LLM이 이해하기 쉬운 텍스트 형식으로 변환

        Args:
            chart_data: get_chart_data()의 반환값

        Returns:
            텍스트 형식의 차트 요약
        """
        if "error" in chart_data:
            return f"차트 데이터 오류: {chart_data['error']}"

        data_points = chart_data.get("data", [])
        if not data_points:
            return "차트 데이터가 없습니다."

        symbol = chart_data.get("symbol", "N/A")
        period = chart_data.get("period", "N/A")

        # 가격 변동 계산
        first_close = data_points[0].get("close", 0)
        last_close = data_points[-1].get("close", 0)
        price_change = last_close - first_close
        price_change_percent = (price_change / first_close * 100) if first_close > 0 else 0

        # 최고가/최저가
        highs = [dp.get("high", 0) for dp in data_points]
        lows = [dp.get("low", 0) for dp in data_points]
        max_high = max(highs) if highs else 0
        min_low = min(lows) if lows else 0

        # 거래량 추이
        volumes = [dp.get("volume", 0) for dp in data_points]
        avg_volume = sum(volumes) / len(volumes) if volumes else 0
        max_volume = max(volumes) if volumes else 0
        min_volume = min(volumes) if volumes else 0

        # 텍스트 형식으로 변환
        text = f"""종목: {symbol}
기간: {period}

가격 변동:
- 시작가: ${first_close:.2f}
- 종료가: ${last_close:.2f}
- 변동액: ${price_change:+.2f} ({price_change_percent:+.2f}%)

가격 범위:
- 최고가: ${max_high:.2f}
- 최저가: ${min_low:.2f}
- 변동폭: ${max_high - min_low:.2f}

거래량:
- 평균 거래량: {avg_volume:,.0f}주
- 최대 거래량: {max_volume:,.0f}주
- 최소 거래량: {min_volume:,.0f}주

일별 상세 데이터:
"""
        for dp in data_points[-10:]:  # 최근 10일만 표시
            date = dp.get("date", "N/A")
            close = dp.get("close", 0)
            volume = dp.get("volume", 0)
            text += f"- {date}: 종가 ${close:.2f}, 거래량 {volume:,}주\n"

        return text


# 싱글톤 인스턴스
chart_service = ChartService()

