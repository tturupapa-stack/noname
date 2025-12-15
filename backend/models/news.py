from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class NewsItem(BaseModel):
    """뉴스 아이템"""
    title: str
    url: str
    published_date: Optional[datetime] = None
    source: Optional[str] = None


class NewsSearchResponse(BaseModel):
    """뉴스 검색 응답"""
    ticker: str
    query: str
    news: List[NewsItem]
    total_count: int
