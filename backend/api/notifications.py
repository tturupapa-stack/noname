"""알림 API 엔드포인트"""

from datetime import datetime
import logging
from fastapi import APIRouter, HTTPException

from models.notification import (
    SlackNotificationRequest,
    SlackNotificationResponse
)
from services.slack_service import get_slack_service, SlackServiceError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.post("/slack", response_model=SlackNotificationResponse)
async def send_slack_notification(request: SlackNotificationRequest):
    """
    Slack으로 리포트 알림 전송

    리포트 데이터를 받아서 Slack Incoming Webhook으로 알림을 전송합니다.
    전송 실패 시 최대 3회까지 자동으로 재시도합니다.

    **Request Body:**
    - report_date: 리포트 날짜 (YYYY-MM-DD 형식)
    - summary: 리포트 요약 정보
        - total_return: 총 수익률 (%)
        - top_stock: 오늘의 화제 종목 심볼
        - top_stock_name: 오늘의 화제 종목명
        - top_stock_change: 화제 종목 변동률 (%)
        - highlights: 주요 알림 사항 리스트
    - report_url: 대시보드 URL (선택)

    **Response:**
    - success: 전송 성공 여부
    - message: 결과 메시지
    - sent_at: 전송 시각
    - retry_count: 재시도 횟수
    - error: 에러 메시지 (실패 시)
    """
    try:
        slack_service = get_slack_service()

        # Webhook URL 설정 확인
        if not slack_service.is_configured():
            logger.warning("Slack notification skipped: SLACK_WEBHOOK_URL not configured")
            return SlackNotificationResponse(
                success=False,
                message="Slack Webhook URL이 설정되지 않았습니다.",
                sent_at=datetime.now(),
                retry_count=0,
                error="SLACK_WEBHOOK_URL 환경변수를 설정해주세요."
            )

        # 알림 전송
        success, retry_count, error = await slack_service.send_notification(
            report_date=request.report_date,
            summary=request.summary,
            report_url=request.report_url
        )

        if success:
            logger.info(f"Slack notification sent for report date: {request.report_date}")
            return SlackNotificationResponse(
                success=True,
                message="Slack 알림이 성공적으로 전송되었습니다.",
                sent_at=datetime.now(),
                retry_count=retry_count
            )
        else:
            logger.error(f"Slack notification failed for report date: {request.report_date}")
            return SlackNotificationResponse(
                success=False,
                message="Slack 알림 전송에 실패했습니다.",
                sent_at=datetime.now(),
                retry_count=retry_count,
                error=error
            )

    except SlackServiceError as e:
        logger.error(f"Slack service error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in Slack notification: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Slack 알림 전송 중 오류 발생: {str(e)}"
        )


@router.get("/slack/status")
async def get_slack_status():
    """
    Slack 알림 서비스 상태 확인

    Webhook URL 설정 여부를 확인합니다.

    **Response:**
    - configured: Webhook URL 설정 여부
    - message: 상태 메시지
    """
    slack_service = get_slack_service()
    is_configured = slack_service.is_configured()

    return {
        "configured": is_configured,
        "message": (
            "Slack Webhook이 설정되어 있습니다."
            if is_configured
            else "SLACK_WEBHOOK_URL 환경변수를 설정해주세요."
        )
    }
