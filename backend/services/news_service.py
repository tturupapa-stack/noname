import os
from datetime import datetime, timedelta
from typing import List, Optional
from exa_py import Exa
from models.news import NewsItem, NewsSearchResponse


class NewsServiceError(Exception):
    """뉴스 서비스 에러"""
    pass


class ExaNewsService:
    """Exa API를 사용한 뉴스 수집 서비스"""

    def __init__(self, api_key: Optional[str] = None):
        """
        Args:
            api_key: Exa API 키. 없으면 환경변수 EXA_API_KEY 사용
        """
        self.api_key = api_key or os.environ.get("EXA_API_KEY")
        if not self.api_key:
            raise NewsServiceError(
                "EXA_API_KEY가 설정되지 않았습니다. "
                "환경변수를 설정하거나 api_key 파라미터를 전달하세요."
            )
        self.client = Exa(api_key=self.api_key)

    def search_stock_news(
        self,
        ticker: str,
        num_results: int = 5,
        hours: int = 24
    ) -> NewsSearchResponse:
        """
        주식 관련 뉴스 검색

        Args:
            ticker: 종목 심볼 (예: NVDA, AAPL)
            num_results: 반환할 결과 수 (기본값: 5)
            hours: 최근 N시간 이내 뉴스만 검색 (기본값: 24)

        Returns:
            NewsSearchResponse: 뉴스 검색 결과

        Raises:
            NewsServiceError: API 호출 실패 시
        """
        query = f"{ticker} stock news"

        # 최근 N시간 기준 날짜 계산
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(hours=hours)

        try:
            results = self.client.search(
                query=query,
                num_results=num_results,
                start_published_date=start_date.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
                end_published_date=end_date.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
                type="auto"
            )

            news_items = self._parse_results(results)

            return NewsSearchResponse(
                ticker=ticker,
                query=query,
                news=news_items,
                total_count=len(news_items)
            )

        except Exception as e:
            raise NewsServiceError(f"뉴스 검색 실패: {str(e)}")

    def _parse_results(self, results) -> List[NewsItem]:
        """Exa 검색 결과를 NewsItem 리스트로 변환"""
        news_items = []

        if not hasattr(results, "results"):
            return news_items

        for result in results.results:
            try:
                # 발행일 파싱
                published_date = None
                if hasattr(result, "published_date") and result.published_date:
                    try:
                        published_date = datetime.fromisoformat(
                            result.published_date.replace("Z", "+00:00")
                        )
                    except (ValueError, AttributeError):
                        pass

                # URL에서 소스 추출
                source = None
                if hasattr(result, "url") and result.url:
                    try:
                        from urllib.parse import urlparse
                        parsed = urlparse(result.url)
                        source = parsed.netloc.replace("www.", "")
                    except Exception:
                        pass

                news_items.append(NewsItem(
                    title=getattr(result, "title", "제목 없음"),
                    url=getattr(result, "url", ""),
                    published_date=published_date,
                    source=source
                ))

            except Exception:
                continue

        return news_items


def get_news_service(api_key: Optional[str] = None) -> ExaNewsService:
    """뉴스 서비스 인스턴스 생성"""
    return ExaNewsService(api_key=api_key)
