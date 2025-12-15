from fastapi import APIRouter, HTTPException, Query
from models.briefing import BriefingListResponse, BriefingResponse
from services.briefing_service import briefing_storage

router = APIRouter(prefix="/api/briefings", tags=["briefings"])


@router.get("", response_model=BriefingListResponse)
async def get_briefings(
    page: int = Query(default=1, ge=1, description="페이지 번호 (1부터 시작)"),
    limit: int = Query(default=10, ge=1, le=50, description="페이지당 항목 수 (최대 50)")
):
    """
    브리핑 히스토리 조회

    저장된 브리핑 목록을 페이지네이션하여 반환.
    최신순으로 정렬됨.

    **파라미터:**
    - page: 페이지 번호 (기본값 1)
    - limit: 페이지당 항목 수 (기본값 10, 최대 50)
    """
    try:
        result = briefing_storage.get_briefings(page=page, limit=limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"브리핑 조회 실패: {str(e)}")


@router.get("/{date}", response_model=BriefingResponse)
async def get_briefing_by_date(date: str):
    """
    특정 날짜 브리핑 조회

    **파라미터:**
    - date: 날짜 (YYYY-MM-DD 형식, 예: 2025-12-15)
    """
    try:
        briefing = briefing_storage.get_briefing_by_date(date)

        if briefing is None:
            raise HTTPException(
                status_code=404,
                detail=f"'{date}' 날짜의 브리핑을 찾을 수 없습니다"
            )

        return BriefingResponse(briefing=briefing)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"브리핑 조회 실패: {str(e)}")
