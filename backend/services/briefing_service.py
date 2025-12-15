import json
import os
from datetime import datetime
from typing import List, Optional, Tuple
from pathlib import Path

from models.briefing import Briefing, BriefingListResponse
from models.stock import StockDetail, ScoreBreakdown, WhyHotItem
from models.news import NewsItem


class BriefingServiceError(Exception):
    """브리핑 서비스 에러"""
    pass


class BriefingStorage:
    """브리핑 히스토리 저장소"""

    def __init__(self, storage_path: str = None):
        """
        Args:
            storage_path: 저장 경로. 기본값은 backend/data/briefings.json
        """
        if storage_path is None:
            base_dir = Path(__file__).parent.parent
            self.storage_path = base_dir / "data" / "briefings.json"
        else:
            self.storage_path = Path(storage_path)

        # 디렉토리 생성
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)

        # 파일이 없으면 빈 배열로 초기화
        if not self.storage_path.exists():
            self._save_data([])

    def _load_data(self) -> List[dict]:
        """JSON 파일에서 데이터 로드"""
        try:
            with open(self.storage_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return []

    def _save_data(self, data: List[dict]) -> None:
        """JSON 파일에 데이터 저장"""
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=str)

    def save_briefing(
        self,
        stock: StockDetail,
        score: ScoreBreakdown,
        why_hot: List[WhyHotItem],
        news: List[NewsItem] = None
    ) -> Briefing:
        """
        브리핑 저장

        Args:
            stock: 종목 정보
            score: 점수 정보
            why_hot: WHY HOT 항목들
            news: 뉴스 목록

        Returns:
            Briefing: 저장된 브리핑
        """
        today = datetime.now().strftime("%Y-%m-%d")
        now = datetime.now()

        briefing = Briefing(
            id=today,
            date=today,
            created_at=now,
            stock=stock,
            score=score,
            why_hot=why_hot,
            news=news or []
        )

        # 기존 데이터 로드
        data = self._load_data()

        # 같은 날짜 브리핑이 있으면 업데이트, 없으면 추가
        updated = False
        for i, item in enumerate(data):
            if item.get("id") == today:
                data[i] = briefing.model_dump()
                updated = True
                break

        if not updated:
            data.append(briefing.model_dump())

        # 날짜순 정렬 (최신순)
        data.sort(key=lambda x: x.get("date", ""), reverse=True)

        # 저장
        self._save_data(data)

        return briefing

    def get_briefings(
        self,
        page: int = 1,
        limit: int = 10
    ) -> BriefingListResponse:
        """
        브리핑 리스트 조회 (페이지네이션)

        Args:
            page: 페이지 번호 (1부터 시작)
            limit: 페이지당 항목 수

        Returns:
            BriefingListResponse: 브리핑 리스트
        """
        data = self._load_data()
        total = len(data)

        # 페이지네이션 계산
        total_pages = (total + limit - 1) // limit if total > 0 else 1
        page = max(1, min(page, total_pages))

        start_idx = (page - 1) * limit
        end_idx = start_idx + limit

        # 슬라이싱
        page_data = data[start_idx:end_idx]

        # Briefing 객체로 변환
        briefings = []
        for item in page_data:
            try:
                briefings.append(Briefing(**item))
            except Exception:
                continue

        return BriefingListResponse(
            briefings=briefings,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )

    def get_briefing_by_date(self, date: str) -> Optional[Briefing]:
        """
        특정 날짜 브리핑 조회

        Args:
            date: 날짜 (YYYY-MM-DD 형식)

        Returns:
            Briefing or None: 브리핑 데이터
        """
        data = self._load_data()

        for item in data:
            if item.get("id") == date or item.get("date") == date:
                try:
                    return Briefing(**item)
                except Exception:
                    return None

        return None

    def delete_briefing(self, date: str) -> bool:
        """
        브리핑 삭제

        Args:
            date: 날짜 (YYYY-MM-DD 형식)

        Returns:
            bool: 삭제 성공 여부
        """
        data = self._load_data()
        original_len = len(data)

        data = [item for item in data if item.get("id") != date and item.get("date") != date]

        if len(data) < original_len:
            self._save_data(data)
            return True

        return False


# 싱글톤 인스턴스
briefing_storage = BriefingStorage()
