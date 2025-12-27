# GitHub Actions 워크플로우 구현

## 개요
매일 한국시간 아침 7시(UTC 22:00)에 자동으로 화제 종목을 조회하고 브리핑을 생성한 후 Slack으로 알림을 전송하는 GitHub Actions 워크플로우를 구현했습니다.

## 구현 일자
2025-12-26

## 구현 내용

### 1. CLI 진입점 스크립트 (`backend/scripts/daily_briefing.py`)
기존 서비스 파일들은 모듈 형태로 설계되어 있어 standalone 실행이 불가능했습니다. 이를 해결하기 위해 CLI 진입점 스크립트를 생성했습니다.

**주요 기능:**
- 전체 실행 또는 개별 단계별 실행 지원
- 드라이런 모드 지원 (실제 알림 전송 없이 테스트)
- 상세 로깅

**사용법:**
```bash
# 전체 실행
python -m scripts.daily_briefing

# 개별 단계 실행
python -m scripts.daily_briefing --step screener   # 화제 종목만 조회
python -m scripts.daily_briefing --step briefing   # 브리핑 생성
python -m scripts.daily_briefing --step notify     # Slack 알림만 전송

# 드라이런 모드
python -m scripts.daily_briefing --dry-run
```

**실행 흐름:**
1. **화제 종목 조회** (screener_service.py)
   - Yahoo Finance에서 거래량 급증, 상승률, 하락률 상위 종목 수집
   - 복합 점수 계산으로 TOP 1 선정

2. **뉴스 수집** (news_service.py) - 선택적
   - Exa API로 관련 뉴스 5개 수집
   - 실패해도 전체 프로세스 계속 진행

3. **브리핑 생성** (briefing_service.py, briefing_generator.py)
   - 마크다운 형식의 브리핑 콘텐츠 생성
   - JSON 파일에 저장 (`backend/data/briefings.json`)

4. **Slack 알림** (slack_service.py)
   - Block Kit 포맷으로 메시지 구성
   - 최대 3회 재시도

### 2. GitHub Actions 워크플로우 (`.github/workflows/daily-briefing.yml`)

**스케줄:**
- 매일 UTC 22:00 (한국시간 07:00) 실행
- cron: `0 22 * * *`

**수동 실행 옵션:**
- `dry_run`: 드라이런 모드 (true/false)
- `step`: 실행 단계 (all/screener/briefing/notify)

**환경 설정:**
- Python 3.12
- pip 캐싱으로 빌드 시간 단축
- 메모리 기반 캐시 사용 (Redis 불필요)

**실패 알림:**
- 워크플로우 실패 시 Slack으로 알림 전송
- 워크플로우 URL 포함

### 3. 환경변수 설정

**GitHub Secrets 설정 필요:**
| Secret 이름 | 설명 | 필수 |
|------------|------|------|
| `EXA_API_KEY` | Exa API 키 (뉴스 수집) | 권장 |
| `SLACK_WEBHOOK_URL` | Slack Webhook URL | 선택 |

**설정 방법:**
1. GitHub 저장소 > Settings > Secrets and variables > Actions
2. "New repository secret" 클릭
3. Name과 Secret 입력 후 저장

## 파일 구조

```
.github/
  workflows/
    daily-briefing.yml    # GitHub Actions 워크플로우

backend/
  scripts/
    __init__.py
    daily_briefing.py     # CLI 진입점 스크립트
  .env.example            # 환경변수 예시 (GitHub Actions 설정 안내 추가)
```

## 테스트

로컬에서 스크립트 테스트:
```bash
cd backend
python3 -m scripts.daily_briefing --step screener --dry-run
```

실행 결과:
```
2025-12-26 22:37:26,523 - daily_briefing - INFO - ==================================================
2025-12-26 22:37:26,523 - daily_briefing - INFO - Step 1: 화제 종목 조회 시작
2025-12-26 22:37:26,523 - daily_briefing - INFO - ==================================================
2025-12-26 22:37:34,394 - daily_briefing - INFO - 화제 종목 선정: HYMC (Hycroft Mining Holding Corporat)
2025-12-26 22:37:34,394 - daily_briefing - INFO -   - 현재가: $24.96
2025-12-26 22:37:34,394 - daily_briefing - INFO -   - 변동률: -8.03%
2025-12-26 22:37:34,394 - daily_briefing - INFO -   - 거래량: 6,470,663
2025-12-26 22:37:34,394 - daily_briefing - INFO -   - 복합 점수: 37/40
```

## 주의사항

1. **주말 실행 제외**: 미국 주식시장 휴장일(토/일)에는 스케줄 실행이 의미가 없으므로 조건부 실행을 고려할 수 있습니다.

2. **Artifact 보관**: 생성된 브리핑 데이터는 30일간 Artifact로 보관됩니다.

3. **이메일 서비스**: 이메일 발송 기능이 추가되었습니다 (2025-12-27). GitHub Secrets에 `GMAIL_ADDRESS`, `GMAIL_APP_PASSWORD`, `EMAIL_RECIPIENTS` 설정이 필요합니다.

## 향후 개선 사항

- [ ] 미국 공휴일 휴장일 체크 로직 추가
- [x] 이메일 알림 서비스 구현 (2025-12-27 완료)
- [ ] 대시보드 URL 자동 생성 및 포함
- [ ] 실패 시 자동 재시도 로직 강화
