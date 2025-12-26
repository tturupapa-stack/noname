#!/usr/bin/env python3
"""
Daily Briefing CLI Script

매일 아침 실행되어 화제 종목을 조회하고 브리핑을 생성한 후 Slack으로 전송합니다.
GitHub Actions 또는 로컬에서 standalone으로 실행 가능합니다.

사용법:
    # 전체 실행 (조회 + 브리핑 + 알림)
    python -m scripts.daily_briefing

    # 개별 단계 실행
    python -m scripts.daily_briefing --step screener
    python -m scripts.daily_briefing --step briefing
    python -m scripts.daily_briefing --step notify

    # 드라이런 (실제 알림 전송 없이 테스트)
    python -m scripts.daily_briefing --dry-run
"""

import argparse
import asyncio
import logging
import sys
from datetime import datetime
from pathlib import Path

# backend 디렉토리를 sys.path에 추가
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv

# .env 파일 로드
load_dotenv(backend_dir / ".env")

from services.screener_service import hot_stock_screener, ScreenerServiceError
from services.news_service import get_news_service, NewsServiceError
from services.briefing_service import briefing_storage, BriefingServiceError
from services.briefing_generator import briefing_generator
from services.slack_service import get_slack_service, SlackServiceError
from models.notification import SlackReportSummary


# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("daily_briefing")


class DailyBriefingRunner:
    """일일 브리핑 실행기"""

    def __init__(self, dry_run: bool = False):
        """
        Args:
            dry_run: True면 실제 알림 전송 없이 테스트만 수행
        """
        self.dry_run = dry_run
        self._hot_stock_data = None
        self._news_items = []
        self._briefing = None

    def run_screener(self) -> bool:
        """
        Step 1: 화제 종목 조회

        Returns:
            bool: 성공 여부
        """
        logger.info("=" * 50)
        logger.info("Step 1: 화제 종목 조회 시작")
        logger.info("=" * 50)

        try:
            self._hot_stock_data = hot_stock_screener.get_daily_hot_stock()

            stock = self._hot_stock_data.stock
            score = self._hot_stock_data.score

            logger.info(f"화제 종목 선정: {stock.symbol} ({stock.name})")
            logger.info(f"  - 현재가: ${stock.price:,.2f}")
            logger.info(f"  - 변동률: {stock.change_percent:+.2f}%")
            logger.info(f"  - 거래량: {stock.volume:,}")
            logger.info(f"  - 복합 점수: {score.total}/40")

            return True

        except ScreenerServiceError as e:
            logger.error(f"화제 종목 조회 실패: {e}")
            return False
        except Exception as e:
            logger.exception(f"예기치 않은 오류: {e}")
            return False

    def run_news_collection(self) -> bool:
        """
        Step 1.5: 관련 뉴스 수집 (선택적)

        Returns:
            bool: 성공 여부
        """
        if not self._hot_stock_data:
            logger.warning("화제 종목 데이터가 없습니다. screener를 먼저 실행하세요.")
            return False

        logger.info("-" * 50)
        logger.info("뉴스 수집 시작")

        try:
            news_service = get_news_service()
            symbol = self._hot_stock_data.stock.symbol

            news_response = news_service.search_stock_news(
                ticker=symbol,
                num_results=5,
                hours=24
            )

            self._news_items = news_response.news
            logger.info(f"뉴스 {len(self._news_items)}개 수집 완료")

            for i, news in enumerate(self._news_items[:3], 1):
                logger.info(f"  {i}. {news.title[:50]}...")

            return True

        except NewsServiceError as e:
            logger.warning(f"뉴스 수집 실패 (계속 진행): {e}")
            return True  # 뉴스 실패해도 계속 진행
        except Exception as e:
            logger.warning(f"뉴스 수집 중 오류 (계속 진행): {e}")
            return True

    def run_briefing(self) -> bool:
        """
        Step 2: 브리핑 생성 및 저장

        Returns:
            bool: 성공 여부
        """
        logger.info("=" * 50)
        logger.info("Step 2: 브리핑 생성 시작")
        logger.info("=" * 50)

        if not self._hot_stock_data:
            logger.error("화제 종목 데이터가 없습니다. screener를 먼저 실행하세요.")
            return False

        try:
            stock = self._hot_stock_data.stock
            score = self._hot_stock_data.score
            why_hot = self._hot_stock_data.why_hot

            # 브리핑 저장
            self._briefing = briefing_storage.save_briefing(
                stock=stock,
                score=score,
                why_hot=why_hot,
                news=self._news_items
            )

            logger.info(f"브리핑 저장 완료: {self._briefing.id}")

            # 마크다운 콘텐츠 생성 (로그용)
            markdown = briefing_generator.generate_markdown(
                stock=stock,
                score=score,
                why_hot=why_hot,
                news=self._news_items
            )

            logger.info("-" * 50)
            logger.info("생성된 브리핑 미리보기:")
            logger.info("-" * 50)
            # 처음 500자만 출력
            preview = markdown[:500] + "..." if len(markdown) > 500 else markdown
            print(preview)

            return True

        except BriefingServiceError as e:
            logger.error(f"브리핑 저장 실패: {e}")
            return False
        except Exception as e:
            logger.exception(f"브리핑 생성 중 오류: {e}")
            return False

    async def run_notify(self) -> bool:
        """
        Step 3: Slack 알림 전송

        Returns:
            bool: 성공 여부
        """
        logger.info("=" * 50)
        logger.info("Step 3: Slack 알림 전송")
        logger.info("=" * 50)

        if not self._hot_stock_data:
            logger.error("화제 종목 데이터가 없습니다. screener를 먼저 실행하세요.")
            return False

        try:
            slack_service = get_slack_service()

            if not slack_service.is_configured():
                logger.warning("SLACK_WEBHOOK_URL이 설정되지 않아 알림을 건너뜁니다.")
                return True

            stock = self._hot_stock_data.stock
            why_hot = self._hot_stock_data.why_hot

            # 요약 정보 생성
            highlights = [item.message for item in why_hot[:3]]
            summary = SlackReportSummary(
                top_stock=stock.symbol,
                top_stock_name=stock.name,
                top_stock_change=stock.change_percent,
                highlights=highlights
            )

            report_date = datetime.now().strftime("%Y-%m-%d")

            if self.dry_run:
                logger.info("[DRY RUN] Slack 알림 전송 스킵")
                logger.info(f"  - 날짜: {report_date}")
                logger.info(f"  - 종목: {stock.symbol} ({stock.name})")
                logger.info(f"  - 변동률: {stock.change_percent:+.2f}%")
                return True

            success, retry_count, error = await slack_service.send_notification(
                report_date=report_date,
                summary=summary,
                report_url=None  # 대시보드 URL (선택)
            )

            if success:
                logger.info(f"Slack 알림 전송 성공 (재시도: {retry_count}회)")
                return True
            else:
                logger.error(f"Slack 알림 전송 실패: {error}")
                return False

        except SlackServiceError as e:
            logger.error(f"Slack 서비스 오류: {e}")
            return False
        except Exception as e:
            logger.exception(f"알림 전송 중 오류: {e}")
            return False

    async def run_all(self) -> bool:
        """
        전체 단계 실행

        Returns:
            bool: 모든 단계 성공 여부
        """
        logger.info("=" * 60)
        logger.info(" Daily Briefing - 전체 실행")
        logger.info(f" 실행 시각: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info(f" 모드: {'DRY RUN' if self.dry_run else 'PRODUCTION'}")
        logger.info("=" * 60)

        # Step 1: 화제 종목 조회
        if not self.run_screener():
            logger.error("화제 종목 조회 실패로 중단")
            return False

        # Step 1.5: 뉴스 수집 (실패해도 계속)
        self.run_news_collection()

        # Step 2: 브리핑 생성
        if not self.run_briefing():
            logger.error("브리핑 생성 실패로 중단")
            return False

        # Step 3: 알림 전송
        if not await self.run_notify():
            logger.error("알림 전송 실패")
            return False

        logger.info("=" * 60)
        logger.info(" Daily Briefing 완료!")
        logger.info("=" * 60)
        return True


def parse_args():
    """커맨드라인 인자 파싱"""
    parser = argparse.ArgumentParser(
        description="Daily Briefing CLI - 매일 아침 브리핑 생성 및 전송",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예시:
  python -m scripts.daily_briefing              # 전체 실행
  python -m scripts.daily_briefing --step screener  # 화제 종목만 조회
  python -m scripts.daily_briefing --step briefing  # 브리핑만 생성
  python -m scripts.daily_briefing --step notify    # 알림만 전송
  python -m scripts.daily_briefing --dry-run        # 드라이런 모드
        """
    )

    parser.add_argument(
        "--step",
        choices=["screener", "briefing", "notify", "all"],
        default="all",
        help="실행할 단계 (기본값: all)"
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="드라이런 모드 (실제 알림 전송 없이 테스트)"
    )

    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="상세 로그 출력"
    )

    return parser.parse_args()


async def main():
    """메인 함수"""
    args = parse_args()

    # 로그 레벨 설정
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    runner = DailyBriefingRunner(dry_run=args.dry_run)

    try:
        if args.step == "all":
            success = await runner.run_all()
        elif args.step == "screener":
            success = runner.run_screener()
        elif args.step == "briefing":
            # briefing은 screener가 먼저 필요
            if not runner.run_screener():
                sys.exit(1)
            runner.run_news_collection()
            success = runner.run_briefing()
        elif args.step == "notify":
            # notify는 screener가 먼저 필요
            if not runner.run_screener():
                sys.exit(1)
            success = await runner.run_notify()
        else:
            logger.error(f"알 수 없는 단계: {args.step}")
            sys.exit(1)

        sys.exit(0 if success else 1)

    except KeyboardInterrupt:
        logger.info("사용자에 의해 중단됨")
        sys.exit(130)
    except Exception as e:
        logger.exception(f"실행 중 오류 발생: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
