# 당신이 잠든 사이 (While You Were Sleeping)

> 매일 아침 7시, 주식 시장 브리핑을 제공하는 대시보드 애플리케이션

![Next.js](https://img.shields.io/badge/Next.js-16.0.8-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2.1-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688?logo=fastapi)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)

---

## 📖 목차

- [프로젝트 소개](#-프로젝트-소개)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [시작하기](#-시작하기)
  - [사전 요구사항](#사전-요구사항)
  - [Frontend 설치](#frontend-설치)
  - [Backend 설치](#backend-설치)
- [사용 방법](#-사용-방법)
  - [개발 서버 실행](#개발-서버-실행)
  - [테스트](#테스트)
  - [프로덕션 빌드](#프로덕션-빌드)
- [API 문서](#-api-문서)
- [환경 변수 설정](#-환경-변수-설정)
- [프로젝트 구조](#-프로젝트-구조)
- [개발 가이드](#-개발-가이드)

---

## 🎯 프로젝트 소개

"당신이 잠든 사이"는 매일 아침 7시에 전날 미국 주식 시장의 핵심 정보를 브리핑 형태로 제공하는 대시보드입니다.

### 핵심 가치
- **시간 절약**: 복잡한 시장 정보를 한눈에 파악
- **스마트 선정**: Yahoo Finance 데이터를 기반으로 화제 종목 자동 선정
- **AI 브리핑**: Claude LLM을 활용한 인사이트 생성
- **접근성**: PWA 지원으로 모바일에서도 편리하게 사용

---

## ✨ 주요 기능

### 📊 대시보드
- **화제 종목 선정**: 거래량, 가격 변동, 모멘텀, 시가총액 기반 점수 시스템 (40점 만점)
- **TOP 3 비교**: 인기 종목 3개를 한눈에 비교
- **실시간 차트**: 5일간 주가 추이 및 거래량 시각화

### 🤖 AI 브리핑
- **뉴스 요약**: Exa API로 수집한 뉴스를 Claude가 요약
- **차트 분석**: 주가 그래프를 참고한 기술적 분석
- **마크다운 출력**: 깔끔한 브리핑 리포트 생성

### 📅 브리핑 관리
- **브리핑 달력**: 월간/주간/목록 뷰로 과거 브리핑 조회
- **브리핑 저장**: 자동으로 일별 브리핑 히스토리 저장
- **이미지 공유**: 브리핑을 이미지로 생성하여 SNS 공유

### 🔔 알림 & 즐겨찾기
- **종목 알림**: 가격/변동률/거래량 조건 알림
- **복합 조건**: AND/OR로 최대 3개 조건 조합
- **관심 종목**: 즐겨찾기 및 정렬 기능

### 📱 PWA 지원
- **오프라인 지원**: Service Worker로 오프라인 접근 가능
- **앱 설치**: 홈 화면에 앱처럼 설치
- **업데이트 알림**: 새 버전 자동 감지

### 🌓 UI/UX
- **다크 모드**: 라이트/다크 모드 전환
- **반응형 디자인**: 모바일-퍼스트 설계
- **애니메이션**: Framer Motion 기반 부드러운 전환 효과

---

## 🛠 기술 스택

### Frontend
| 기술 | 버전 | 설명 |
|------|------|------|
| Next.js | 16.0.8 | React 프레임워크 (App Router) |
| React | 19.2.1 | UI 라이브러리 |
| TypeScript | 5 | 정적 타입 |
| Tailwind CSS | 4 | 유틸리티-퍼스트 CSS |
| Framer Motion | 12.x | 애니메이션 |
| Recharts | 3.x | 차트 라이브러리 |
| next-pwa | 5.6.0 | PWA 플러그인 |

### Backend
| 기술 | 버전 | 설명 |
|------|------|------|
| FastAPI | 0.115.0+ | Python 웹 프레임워크 |
| yahooquery | 2.3.7+ | Yahoo Finance 데이터 |
| exa-py | 1.0.0+ | 뉴스 검색 API |
| Redis | 5.0.0+ | 캐시 저장소 (선택) |
| uvicorn | 0.32.0+ | ASGI 서버 |

### 테스팅
| 기술 | 설명 |
|------|------|
| Jest | JavaScript 테스트 프레임워크 |
| React Testing Library | React 컴포넌트 테스트 |
| MSW | API 모킹 |
| pytest | Python 테스트 프레임워크 |

---

## 🚀 시작하기

### 사전 요구사항

- **Node.js** 18.x 이상
- **Python** 3.10 이상
- **npm** 또는 **yarn**
- (선택) **Redis** - 프로덕션 캐시용

### Frontend 설치

```bash
# 1. 프로젝트 루트에서 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일 수정 (아래 환경 변수 섹션 참고)
```

### Backend 설치

```bash
# 1. backend 디렉토리로 이동
cd backend

# 2. 가상환경 생성 (권장)
python -m venv venv

# macOS/Linux
source venv/bin/activate

# Windows
.\venv\Scripts\activate

# 3. 의존성 설치
pip install -r requirements.txt

# 4. 환경 변수 설정
cp .env.example .env
# .env 파일 수정 (아래 환경 변수 섹션 참고)
```

---

## 💻 사용 방법

### 개발 서버 실행

#### Frontend (Next.js)

```bash
# 프로젝트 루트에서 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

#### Backend (FastAPI)

```bash
# backend 디렉토리에서 실행
cd backend
uvicorn main:app --reload
```

API 서버: [http://localhost:8000](http://localhost:8000)
API 문서: [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)

### 테스트

```bash
# Frontend 테스트
npm test              # 전체 테스트 실행
npm run test:watch    # 감시 모드
npm run test:coverage # 커버리지 리포트

# Backend 테스트
cd backend
pytest                # 전체 테스트 실행
pytest -v             # 상세 출력
pytest --cov          # 커버리지 리포트
```

### 프로덕션 빌드

```bash
# Frontend 빌드
npm run build
npm start

# Backend 실행 (프로덕션)
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 기타 명령어

```bash
# ESLint 실행
npm run lint

# PWA 아이콘 재생성
npm run generate-icons
```

---

## 📡 API 문서

### Base URL
```
http://localhost:8000/api
```

### 주식 API (`/api/stocks`)

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| `GET` | `/stocks/trending` | 화제 종목 조회 (TOP 1 + 뉴스) |
| `GET` | `/stocks/trending/top?count=N` | TOP N 종목 조회 (1~10) |
| `GET` | `/stocks/{symbol}` | 종목 상세 정보 + 뉴스 |
| `GET` | `/stocks/{symbol}/chart?period=5d` | 차트 데이터 (5d/1mo/3mo/6mo/1y) |
| `POST` | `/stocks/compare` | 여러 종목 비교 (최대 5개) |

#### 예시: 화제 종목 조회

```bash
curl http://localhost:8000/api/stocks/trending
```

```json
{
  "stock": {
    "symbol": "NVDA",
    "name": "NVIDIA Corporation",
    "price": 140.25,
    "change": 5.30,
    "change_percent": 3.93,
    "volume": 45000000,
    "market_cap": 3450000000000
  },
  "score": {
    "volume_score": 10,
    "price_change_score": 7,
    "momentum_score": 8,
    "market_cap_score": 7,
    "total": 32
  },
  "why_hot": [
    {"icon": "✅", "message": "거래량 급증 (평소 대비 2.5배)"},
    {"icon": "✅", "message": "당일 3.9% 상승"}
  ],
  "news": [...]
}
```

### 브리핑 API (`/api/briefings`)

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| `GET` | `/briefings` | 브리핑 히스토리 (페이지네이션) |
| `GET` | `/briefings/{date}` | 특정 날짜 브리핑 (YYYY-MM-DD) |

### 브리핑 생성 API (`/api/briefing`)

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| `POST` | `/briefing/generate` | 마크다운 브리핑 생성 |
| `POST` | `/briefing/ai-generate` | AI 브리핑 생성 (Claude LLM) |

#### 예시: AI 브리핑 생성

```bash
curl -X POST http://localhost:8000/api/briefing/ai-generate \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "TSLA",
    "name": "Tesla, Inc.",
    "price": 250.50,
    "change": 12.30,
    "change_percent": 5.17,
    "news_count": 3
  }'
```

### 캐시 관리 API (`/api/cache`)

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| `GET` | `/cache/stats` | 캐시 통계 조회 |
| `DELETE` | `/cache/clear` | 캐시 전체 초기화 |

### 헬스 체크

```bash
curl http://localhost:8000/health
```

---

## 🔧 환경 변수 설정

### Frontend (`.env`)

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (`backend/.env`)

```bash
# ===== 필수 =====
# Exa API Key (https://dashboard.exa.ai/api-keys)
EXA_API_KEY=your_exa_api_key_here

# ===== 캐시 설정 =====
# 캐시 백엔드: memory (개발), redis (프로덕션), layered (L1+L2)
CACHE_BACKEND=memory

# Redis 설정 (CACHE_BACKEND가 redis 또는 layered일 때)
CACHE_REDIS_URL=redis://localhost:6379/0
CACHE_REDIS_MAX_CONNECTIONS=10
CACHE_REDIS_SOCKET_TIMEOUT=5.0
CACHE_REDIS_RETRY_ON_TIMEOUT=true

# L1 메모리 캐시 설정
CACHE_L1_MAX_ENTRIES=1000
CACHE_L1_MAX_MEMORY_MB=100

# ===== 기능 플래그 =====
CACHE_ENABLE_STAMPEDE_PREVENTION=true
CACHE_ENABLE_STATS=true

# ===== Rate Limit =====
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=60

# ===== CORS =====
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### MCP 서버 (`mcp-server/.env`)

```bash
# Claude AI 브리핑 생성용 (선택)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

---

## 📁 프로젝트 구조

```
while-you-were-sleeping-dashboard/
├── app/                          # Next.js App Router 페이지
│   ├── layout.tsx                # 루트 레이아웃
│   ├── page.tsx                  # 메인 대시보드
│   ├── briefing/[id]/page.tsx    # 브리핑 상세
│   ├── stock/[symbol]/page.tsx   # 종목 상세
│   └── offline/page.tsx          # 오프라인 페이지
│
├── backend/                      # Python FastAPI 백엔드
│   ├── main.py                   # 앱 엔트리포인트
│   ├── config.py                 # 환경 변수 설정
│   ├── api/                      # API 라우터
│   │   ├── stock.py              # 주식 API
│   │   ├── briefing.py           # 브리핑 조회 API
│   │   ├── briefing_generate.py  # 브리핑 생성 API
│   │   └── cache.py              # 캐시 관리 API
│   ├── services/                 # 비즈니스 로직
│   │   ├── screener_service.py   # 화제 종목 선정
│   │   ├── news_service.py       # 뉴스 수집
│   │   ├── cache_service.py      # 캐시 관리
│   │   └── briefing_service.py   # 브리핑 저장
│   ├── models/                   # Pydantic 모델
│   ├── middleware/               # 미들웨어 (Rate Limit)
│   └── tests/                    # 테스트
│
├── components/                   # React 컴포넌트
│   ├── StockCard.tsx             # 주가 카드
│   ├── StockChart.tsx            # 주가 차트
│   ├── Top3Comparison.tsx        # TOP 3 비교
│   ├── BriefingCalendar.tsx      # 브리핑 달력
│   ├── AIBriefingModal.tsx       # AI 브리핑 모달
│   ├── ShareModal.tsx            # 공유 모달
│   └── ...
│
├── services/                     # Frontend API 서비스
│   ├── api.ts                    # Backend API 호출
│   ├── apiCache.ts               # 클라이언트 캐시
│   └── apiAdapters.ts            # 데이터 변환
│
├── contexts/                     # React Context
│   └── ThemeContext.tsx          # 테마 (다크모드)
│
├── hooks/                        # 커스텀 훅
│   ├── useCountUp.ts             # 숫자 카운팅
│   └── useScrollAnimation.ts     # 스크롤 애니메이션
│
├── utils/                        # 유틸리티
│   ├── alertStorage.ts           # 알림 저장소
│   ├── favoriteStorage.ts        # 즐겨찾기 저장소
│   └── calendarStorage.ts        # 달력 설정 저장소
│
├── types/                        # TypeScript 타입
│   └── index.ts
│
├── mcp-server/                   # MCP 서버 (Claude Desktop 연동)
│   └── services/
│       ├── llm_service.py        # Claude LLM 서비스
│       └── chart_service.py      # 차트 데이터 서비스
│
├── public/                       # 정적 파일
│   ├── manifest.json             # PWA 매니페스트
│   └── icon-*.png                # PWA 아이콘
│
├── __tests__/                    # Frontend 테스트
│
├── docs/                         # 프로젝트 문서
│   ├── API-명세서.md
│   ├── 서비스-기획서.md
│   ├── PWA-설정-가이드.md
│   └── 발표-자료.md
│
├── 개발일지/                      # 개발 로그
│   └── YYYY-MM-DD-기능명.md
│
├── 과제/                         # 과제 관련 자료
│   ├── 1주차/
│   └── 2주차/
│
└── output/                       # 생성된 출력물
    ├── canvas/                   # 캔버스 이미지
    └── images/                   # 기타 이미지
```

---

## 🎨 개발 가이드

### 코드 컨벤션

#### 네이밍
- **컴포넌트**: PascalCase (`StockCard.tsx`)
- **함수/변수**: camelCase (`getStockData`)
- **타입/인터페이스**: PascalCase (`StockDetail`)

#### 스타일링
- **다크 모드 필수**: 모든 컴포넌트에 `dark:` 클래스 적용
- **모바일 우선**: `sm:`, `md:`, `lg:` 반응형 클래스 사용
- **접근성**: ARIA 레이블, 키보드 네비게이션 지원

### PWA 아이콘 생성

```bash
# public/icon.svg 수정 후 실행
npm run generate-icons
```

### 개발 로그

주요 기능 개발 시 `개발일지/` 폴더에 기록:
- 파일명: `YYYY-MM-DD-기능명.md`
- 내용: 기능 설명, 구현 방법, 이슈 해결

---

## 🌐 브라우저 지원

| 브라우저 | 지원 버전 |
|---------|----------|
| Chrome | 최신 2개 버전 |
| Safari | 최신 2개 버전 |
| Firefox | 최신 2개 버전 |
| Edge | 최신 2개 버전 |

---

## 📱 PWA 설치

### Android (Chrome)
1. 브라우저에서 사이트 방문
2. 주소창의 설치 아이콘 또는 설치 프롬프트 클릭
3. "설치" 선택

### iOS (Safari)
1. Safari에서 사이트 방문
2. 공유 버튼 탭
3. "홈 화면에 추가" 선택

### Desktop (Chrome/Edge)
1. 주소창의 설치 아이콘 클릭
2. "설치" 선택

---

## 📄 라이선스

이 프로젝트는 개인 프로젝트입니다.

---

## 📚 추가 자료

- [개발일지](./개발일지/) - 상세한 개발 과정
- [PWA 가이드](./docs/PWA-설정-가이드.md) - PWA 설정 상세
- [발표 자료](./docs/발표-자료.md) - 프로젝트 발표 자료
- [API 문서 (Swagger)](http://localhost:8000/docs) - 백엔드 실행 후 접근
