"""Slack 알림 관련 모델"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SlackReportSummary(BaseModel):
    """리포트 요약 정보"""
    total_return: Optional[float] = Field(None, description="총 수익률 (%)")
    top_stock: Optional[str] = Field(None, description="오늘의 화제 종목 심볼")
    top_stock_name: Optional[str] = Field(None, description="오늘의 화제 종목명")
    top_stock_change: Optional[float] = Field(None, description="화제 종목 변동률 (%)")
    highlights: List[str] = Field(default_factory=list, description="주요 알림 사항")


class SlackNotificationRequest(BaseModel):
    """Slack 알림 전송 요청"""
    report_date: str = Field(..., description="리포트 날짜 (YYYY-MM-DD 형식)")
    summary: SlackReportSummary = Field(..., description="리포트 요약 정보")
    report_url: Optional[str] = Field(None, description="대시보드 URL")


class SlackNotificationResponse(BaseModel):
    """Slack 알림 전송 응답"""
    success: bool
    message: str
    sent_at: datetime
    retry_count: int = 0
    error: Optional[str] = None
