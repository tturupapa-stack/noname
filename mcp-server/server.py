"""MCP 서버 - 브리핑 생성 스킬

화제 종목 정보를 받아서 최신 뉴스를 수집하고 브리핑을 생성합니다.
"""

import os
import sys
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# 백엔드 서비스 경로 추가
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

# .env 파일 로드 (프로젝트 루트와 mcp-server 디렉토리 모두 확인)
env_paths = [
    Path(__file__).parent.parent / ".env",
    Path(__file__).parent / ".env"
]
for env_path in env_paths:
    if env_path.exists():
        load_dotenv(env_path)
        break

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import asyncio

# 백엔드 서비스 임포트
from services.news_service import get_news_service, NewsServiceError

# MCP 서버 서비스 임포트
mcp_server_path = Path(__file__).parent
sys.path.insert(0, str(mcp_server_path))
from services.chart_service import chart_service
from services.llm_service import get_llm_service, LLMServiceError


# MCP 서버 인스턴스 생성
server = Server("briefing-generator")


@server.list_tools()
async def list_tools() -> list[Tool]:
    """사용 가능한 툴 목록 반환"""
    return [
        Tool(
            name="generate_briefing",
            description="화제 종목 정보를 받아서 최신 뉴스를 수집하고, LLM이 뉴스를 요약하며 종목 그래프를 참고해서 해석한 브리핑을 생성합니다.",
            inputSchema={
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "종목 심볼 (예: TSLA, AAPL)"
                    },
                    "name": {
                        "type": "string",
                        "description": "종목명 (예: Tesla, Inc.)"
                    },
                    "price": {
                        "type": "number",
                        "description": "현재 주가"
                    },
                    "change": {
                        "type": "number",
                        "description": "전일 대비 변동액"
                    },
                    "change_percent": {
                        "type": "number",
                        "description": "전일 대비 변동률 (%)"
                    },
                    "news_count": {
                        "type": "integer",
                        "description": "수집할 뉴스 개수 (기본값: 3)",
                        "default": 3,
                        "minimum": 1,
                        "maximum": 10
                    }
                },
                "required": ["symbol", "name", "price", "change", "change_percent"]
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """툴 호출 처리"""
    if name == "generate_briefing":
        return await handle_generate_briefing(arguments)
    else:
        raise ValueError(f"Unknown tool: {name}")


async def handle_generate_briefing(arguments: dict) -> list[TextContent]:
    """브리핑 생성 처리"""
    # 필수 파라미터 확인
    symbol = arguments.get("symbol", "").upper().strip()
    name = arguments.get("name", "")
    price = arguments.get("price", 0)
    change = arguments.get("change", 0)
    change_percent = arguments.get("change_percent", 0)
    news_count = arguments.get("news_count", 3)

    if not symbol or not name:
        return [TextContent(
            type="text",
            text="❌ symbol과 name은 필수 파라미터입니다."
        )]

    try:
        # 1. 뉴스 수집
        news_items = []
        try:
            news_service = get_news_service()
            news_result = news_service.search_stock_news(
                ticker=symbol,
                num_results=news_count,
                hours=24
            )
            news_items = [
                {
                    "title": item.title,
                    "url": item.url,
                    "source": item.source or "N/A"
                }
                for item in news_result.news
            ]
        except (NewsServiceError, Exception) as e:
            print(f"뉴스 수집 실패: {e}", file=sys.stderr)

        # 2. 차트 데이터 수집
        chart_data = chart_service.get_chart_data(symbol, period="5d")
        chart_text = chart_service.format_chart_for_llm(chart_data)

        # 3. LLM 서비스 초기화
        try:
            llm_service = get_llm_service()
        except LLMServiceError as e:
            return [TextContent(
                type="text",
                text=f"❌ LLM 서비스 초기화 실패: {str(e)}\n\n환경변수 ANTHROPIC_API_KEY를 확인해주세요."
            )]

        # 4. 뉴스 요약
        news_summary = ""
        if news_items:
            try:
                news_summary = llm_service.summarize_news(news_items, symbol)
            except LLMServiceError as e:
                news_summary = f"뉴스 요약 실패: {str(e)}"
        else:
            news_summary = "관련 뉴스가 없습니다."

        # 5. 차트 분석
        chart_analysis = ""
        if "error" not in chart_data:
            try:
                chart_analysis = llm_service.analyze_chart(chart_text, symbol)
            except LLMServiceError as e:
                chart_analysis = f"차트 분석 실패: {str(e)}"
        else:
            chart_analysis = "차트 데이터를 가져올 수 없습니다."

        # 6. 브리핑 생성
        stock_info = {
            "symbol": symbol,
            "name": name,
            "price": price,
            "change": change,
            "change_percent": change_percent
        }

        try:
            briefing_markdown = llm_service.generate_briefing(
                stock_info=stock_info,
                news_summary=news_summary,
                chart_analysis=chart_analysis
            )
        except LLMServiceError as e:
            return [TextContent(
                type="text",
                text=f"❌ 브리핑 생성 실패: {str(e)}"
            )]

        return [TextContent(
            type="text",
            text=briefing_markdown
        )]

    except Exception as e:
        return [TextContent(
            type="text",
            text=f"❌ 브리핑 생성 중 오류 발생: {str(e)}"
        )]


async def main():
    """MCP 서버 실행"""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())

