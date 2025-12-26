"""Slack Webhook 알림 서비스"""

import os
import logging
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any

import httpx

from models.notification import SlackReportSummary

logger = logging.getLogger(__name__)


class SlackServiceError(Exception):
    """Slack 서비스 에러"""
    pass


class SlackNotificationService:
    """Slack Incoming Webhook을 사용한 알림 서비스"""

    MAX_RETRIES = 3
    RETRY_DELAY_SECONDS = 2

    def __init__(self, webhook_url: Optional[str] = None):
        """
        Args:
            webhook_url: Slack Webhook URL. 없으면 환경변수 SLACK_WEBHOOK_URL 사용
        """
        self.webhook_url = webhook_url or os.environ.get("SLACK_WEBHOOK_URL")

    def is_configured(self) -> bool:
        """Webhook URL이 설정되어 있는지 확인"""
        return bool(self.webhook_url)

    def _build_block_kit_message(
        self,
        report_date: str,
        summary: SlackReportSummary,
        report_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Block Kit 포맷의 Slack 메시지 생성

        Args:
            report_date: 리포트 날짜 (YYYY-MM-DD)
            summary: 리포트 요약 정보
            report_url: 대시보드 URL

        Returns:
            Block Kit 메시지 페이로드
        """
        blocks: List[Dict[str, Any]] = []

        # 헤더 블록
        blocks.append({
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "Daily Report - While You Were Sleeping",
                "emoji": True
            }
        })

        # 구분선
        blocks.append({"type": "divider"})

        # 날짜 섹션
        blocks.append({
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": f"*Date:*\n{report_date}"
                }
            ]
        })

        # 수익률 정보 (있는 경우)
        if summary.total_return is not None:
            sign = "+" if summary.total_return >= 0 else ""
            emoji = ":chart_with_upwards_trend:" if summary.total_return >= 0 else ":chart_with_downwards_trend:"
            blocks.append({
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Total Return:*\n{emoji} {sign}{summary.total_return:.2f}%"
                    }
                ]
            })

        # 화제 종목 정보 (있는 경우)
        if summary.top_stock:
            stock_info = f"*{summary.top_stock}*"
            if summary.top_stock_name:
                stock_info += f" ({summary.top_stock_name})"
            if summary.top_stock_change is not None:
                sign = "+" if summary.top_stock_change >= 0 else ""
                stock_info += f"\n{sign}{summary.top_stock_change:.2f}%"

            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f":fire: *Hot Stock Today:*\n{stock_info}"
                }
            })

        # 주요 알림 사항 (있는 경우)
        if summary.highlights:
            highlights_text = "\n".join([f"- {h}" for h in summary.highlights])
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f":bell: *Highlights:*\n{highlights_text}"
                }
            })

        # 구분선
        blocks.append({"type": "divider"})

        # 대시보드 링크 버튼 (URL이 있는 경우)
        if report_url:
            blocks.append({
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "View Dashboard",
                            "emoji": True
                        },
                        "url": report_url,
                        "style": "primary"
                    }
                ]
            })

        # 푸터
        blocks.append({
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": f":robot_face: Generated at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                }
            ]
        })

        return {"blocks": blocks}

    async def send_notification(
        self,
        report_date: str,
        summary: SlackReportSummary,
        report_url: Optional[str] = None
    ) -> tuple[bool, int, Optional[str]]:
        """
        Slack으로 알림 전송 (최대 3회 재시도)

        Args:
            report_date: 리포트 날짜 (YYYY-MM-DD)
            summary: 리포트 요약 정보
            report_url: 대시보드 URL

        Returns:
            tuple[bool, int, Optional[str]]: (성공 여부, 재시도 횟수, 에러 메시지)

        Raises:
            SlackServiceError: Webhook URL이 설정되지 않은 경우
        """
        if not self.is_configured():
            raise SlackServiceError(
                "SLACK_WEBHOOK_URL이 설정되지 않았습니다. "
                "환경변수를 설정하거나 webhook_url 파라미터를 전달하세요."
            )

        payload = self._build_block_kit_message(report_date, summary, report_url)
        retry_count = 0
        last_error: Optional[str] = None

        for attempt in range(self.MAX_RETRIES):
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        self.webhook_url,
                        json=payload,
                        headers={"Content-Type": "application/json"}
                    )

                    if response.status_code == 200:
                        logger.info(
                            f"Slack notification sent successfully "
                            f"(date={report_date}, attempts={attempt + 1})"
                        )
                        return True, retry_count, None

                    # Slack API 에러 처리
                    last_error = f"Slack API error: {response.status_code} - {response.text}"
                    logger.warning(
                        f"Slack notification failed (attempt {attempt + 1}/{self.MAX_RETRIES}): "
                        f"{last_error}"
                    )

            except httpx.TimeoutException:
                last_error = "Request timeout"
                logger.warning(
                    f"Slack notification timeout (attempt {attempt + 1}/{self.MAX_RETRIES})"
                )
            except httpx.RequestError as e:
                last_error = f"Request error: {str(e)}"
                logger.warning(
                    f"Slack notification request error (attempt {attempt + 1}/{self.MAX_RETRIES}): "
                    f"{last_error}"
                )
            except Exception as e:
                last_error = f"Unexpected error: {str(e)}"
                logger.error(
                    f"Slack notification unexpected error (attempt {attempt + 1}/{self.MAX_RETRIES}): "
                    f"{last_error}"
                )

            retry_count += 1

            # 마지막 시도가 아니면 대기
            if attempt < self.MAX_RETRIES - 1:
                await asyncio.sleep(self.RETRY_DELAY_SECONDS)

        logger.error(
            f"Slack notification failed after {self.MAX_RETRIES} attempts: {last_error}"
        )
        return False, retry_count, last_error


# 싱글톤 인스턴스
slack_service = SlackNotificationService()


def get_slack_service(webhook_url: Optional[str] = None) -> SlackNotificationService:
    """Slack 서비스 인스턴스 반환"""
    if webhook_url:
        return SlackNotificationService(webhook_url=webhook_url)
    return slack_service
