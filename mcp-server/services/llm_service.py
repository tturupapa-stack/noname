"""Anthropic Claude LLM 통합 서비스"""

import os
from typing import List, Dict, Optional
from anthropic import Anthropic
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()


class LLMServiceError(Exception):
    """LLM 서비스 에러"""
    pass


class LLMService:
    """Anthropic Claude API를 사용한 LLM 서비스"""

    def __init__(self, api_key: Optional[str] = None):
        """
        Args:
            api_key: Anthropic API 키. 없으면 환경변수 ANTHROPIC_API_KEY 사용
        """
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise LLMServiceError(
                "ANTHROPIC_API_KEY가 설정되지 않았습니다. "
                "환경변수를 설정하거나 api_key 파라미터를 전달하세요."
            )
        self.client = Anthropic(api_key=self.api_key)
        self.model = "claude-sonnet-4-20250514"  # Claude Sonnet 4

    def summarize_news(self, news_items: List[Dict], stock_symbol: str) -> str:
        """
        뉴스 기사들을 요약

        Args:
            news_items: 뉴스 아이템 리스트 (title, url, source 포함)
            stock_symbol: 종목 심볼

        Returns:
            요약된 뉴스 텍스트
        """
        if not news_items:
            return "관련 뉴스가 없습니다."

        # 뉴스 목록을 텍스트로 변환
        news_text = "\n\n".join([
            f"제목: {item.get('title', 'N/A')}\n"
            f"출처: {item.get('source', 'N/A')}\n"
            f"URL: {item.get('url', 'N/A')}"
            for item in news_items
        ])

        prompt = f"""다음은 {stock_symbol} 종목에 대한 최신 뉴스 기사들입니다. 
이 뉴스들을 종합적으로 요약하고, 종목에 미칠 수 있는 영향을 분석해주세요.

뉴스 목록:
{news_text}

요약 형식:
1. 주요 뉴스 요약 (3-5줄)
2. 종목에 미치는 영향 분석 (2-3줄)
3. 투자자에게 주는 시사점 (1-2줄)

한국어로 작성해주세요."""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=500,
                temperature=0.7,
                system="당신은 주식 시장 분석 전문가입니다. 뉴스를 객관적으로 요약하고 분석합니다.",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            return message.content[0].text.strip()
        except Exception as e:
            raise LLMServiceError(f"뉴스 요약 실패: {str(e)}")

    def analyze_chart(self, chart_text: str, stock_symbol: str) -> str:
        """
        차트 데이터를 분석하고 해석

        Args:
            chart_text: 차트 데이터 텍스트 (format_chart_for_llm 결과)
            stock_symbol: 종목 심볼

        Returns:
            차트 분석 결과 텍스트
        """
        prompt = f"""다음은 {stock_symbol} 종목의 최근 주가 차트 데이터입니다.
이 데이터를 분석하여 주가 추이, 패턴, 그리고 향후 전망에 대한 인사이트를 제공해주세요.

차트 데이터:
{chart_text}

분석 형식:
1. 주가 추이 요약 (2-3줄)
2. 주요 패턴 및 특징 (2-3줄)
3. 기술적 분석 인사이트 (2-3줄)

한국어로 작성해주세요. 객관적이고 전문적인 톤으로 작성하세요."""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=400,
                temperature=0.7,
                system="당신은 기술적 분석 전문가입니다. 차트 데이터를 분석하여 투자 인사이트를 제공합니다.",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            return message.content[0].text.strip()
        except Exception as e:
            raise LLMServiceError(f"차트 분석 실패: {str(e)}")

    def generate_briefing(
        self,
        stock_info: Dict,
        news_summary: str,
        chart_analysis: str,
        score_info: Optional[Dict] = None
    ) -> str:
        """
        최종 브리핑 JSON 생성 (구조화된 데이터)

        Args:
            stock_info: 종목 정보 (symbol, name, price, change, change_percent 등)
            news_summary: 뉴스 요약 텍스트
            chart_analysis: 차트 분석 텍스트
            score_info: 점수 정보 (선택)

        Returns:
            브리핑 JSON 문자열
        """
        import json
        from datetime import datetime
        today = datetime.now()
        date_str = today.strftime("%Y년 %m월 %d일")
        time_str = today.strftime("%H:%M")

        symbol = stock_info.get("symbol", "N/A")
        name = stock_info.get("name", "N/A")
        price = stock_info.get("price", 0)
        change = stock_info.get("change", 0)
        change_percent = stock_info.get("change_percent", 0)

        prompt = f"""다음 정보를 바탕으로 "당신이 잠든 사이" 브리핑을 JSON 형식으로 작성해주세요.

종목 정보:
- 심볼: {symbol}
- 종목명: {name}
- 현재가: ${price:.2f}
- 전일대비: {change_percent:+.2f}% (${change:+.2f})

뉴스 요약:
{news_summary}

차트 분석:
{chart_analysis}

아래 JSON 구조를 정확히 따라 응답해주세요. JSON만 출력하고 다른 텍스트는 포함하지 마세요:

{{
  "headline": "한 줄 핵심 요약 (15자 내외, 임팩트 있게)",
  "sentiment": "positive" | "negative" | "neutral",
  "sentimentScore": 1-100 사이 숫자 (긍정적일수록 높음),
  "newsSummary": {{
    "mainPoint": "뉴스 핵심 내용 한 문장",
    "details": ["세부 포인트 1", "세부 포인트 2", "세부 포인트 3"]
  }},
  "technicalAnalysis": {{
    "trend": "상승" | "하락" | "횡보",
    "support": 지지선 가격 (숫자),
    "resistance": 저항선 가격 (숫자),
    "summary": "차트 분석 요약 한 문장"
  }},
  "investmentInsight": {{
    "outlook": "긍정적" | "부정적" | "중립",
    "points": ["투자 포인트 1", "투자 포인트 2"],
    "risks": ["리스크 요인 1", "리스크 요인 2"],
    "conclusion": "종합 결론 한 문장"
  }}
}}

규칙:
1. 이모지를 사용하지 마세요
2. 각 항목은 간결하고 핵심만 담아주세요
3. 전문적이지만 이해하기 쉬운 표현을 사용하세요
4. JSON 형식을 정확히 지켜주세요"""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=1500,
                temperature=0.7,
                system="당신은 주식 시장 분석 전문가입니다. 정확한 JSON 형식으로 간결하고 핵심적인 브리핑을 작성합니다. 이모지를 사용하지 않습니다.",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            response_text = message.content[0].text.strip()

            # JSON 파싱 시도 - 응답에서 JSON 부분만 추출
            if response_text.startswith("```"):
                # 코드 블록에서 JSON 추출
                lines = response_text.split("\n")
                json_lines = []
                in_json = False
                for line in lines:
                    if line.startswith("```json"):
                        in_json = True
                        continue
                    elif line.startswith("```"):
                        in_json = False
                        continue
                    if in_json:
                        json_lines.append(line)
                response_text = "\n".join(json_lines)

            # JSON 유효성 검사
            try:
                parsed = json.loads(response_text)
                # 필수 필드 확인
                required_fields = ["headline", "sentiment", "newsSummary", "technicalAnalysis", "investmentInsight"]
                for field in required_fields:
                    if field not in parsed:
                        raise ValueError(f"Missing field: {field}")

                # 메타 정보 추가
                parsed["meta"] = {
                    "symbol": symbol,
                    "name": name,
                    "price": price,
                    "change": change,
                    "changePercent": change_percent,
                    "date": date_str,
                    "time": time_str,
                    "generatedAt": today.isoformat()
                }

                return json.dumps(parsed, ensure_ascii=False, indent=2)

            except (json.JSONDecodeError, ValueError) as e:
                # JSON 파싱 실패 시 폴백 - 구조화된 기본 응답 생성
                fallback = {
                    "headline": f"{name} 시장 동향 분석",
                    "sentiment": "positive" if change_percent >= 0 else "negative",
                    "sentimentScore": 50 + int(change_percent * 5) if abs(change_percent * 5) < 50 else (100 if change_percent > 0 else 0),
                    "newsSummary": {
                        "mainPoint": news_summary[:100] if news_summary else "관련 뉴스 정보를 분석 중입니다.",
                        "details": []
                    },
                    "technicalAnalysis": {
                        "trend": "상승" if change_percent > 0 else ("하락" if change_percent < 0 else "횡보"),
                        "support": round(price * 0.95, 2),
                        "resistance": round(price * 1.05, 2),
                        "summary": chart_analysis[:100] if chart_analysis else "차트 데이터를 분석 중입니다."
                    },
                    "investmentInsight": {
                        "outlook": "긍정적" if change_percent > 0 else ("부정적" if change_percent < 0 else "중립"),
                        "points": ["시장 동향 모니터링 필요"],
                        "risks": ["변동성 주의"],
                        "conclusion": "추가 분석이 필요합니다."
                    },
                    "meta": {
                        "symbol": symbol,
                        "name": name,
                        "price": price,
                        "change": change,
                        "changePercent": change_percent,
                        "date": date_str,
                        "time": time_str,
                        "generatedAt": today.isoformat()
                    },
                    "_rawResponse": response_text[:500]  # 디버깅용
                }
                return json.dumps(fallback, ensure_ascii=False, indent=2)

        except Exception as e:
            raise LLMServiceError(f"브리핑 생성 실패: {str(e)}")


def get_llm_service(api_key: Optional[str] = None) -> LLMService:
    """LLM 서비스 인스턴스 생성"""
    return LLMService(api_key=api_key)

