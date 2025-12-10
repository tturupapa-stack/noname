# 당신이 잠든 사이 - 대시보드

매일 아침 7시, 증시·환율·뉴스 브리핑을 제공하는 대시보드 애플리케이션입니다.

## 주요 기능

- 📊 **주가 차트**: 5일간 주가 추이 및 거래량 시각화
- 🔔 **알림 설정**: 종목별 가격/변동률/거래량 알림
- 📅 **브리핑 달력**: 과거 브리핑 조회 (월간/주간/목록 뷰)
- ⭐ **관심 종목**: 즐겨찾기 기능 및 정렬
- 🔍 **실시간 검색**: 종목 검색 자동완성 (초성 검색 지원)
- 📱 **PWA 지원**: 모바일 앱처럼 설치 가능
- 🌓 **다크 모드**: 라이트/다크 모드 전환
- 🎨 **애니메이션**: 숫자 카운팅 및 카드 전환 효과
- 📤 **SNS 공유**: 브리핑 이미지 생성 및 공유

## 기술 스택

- **Next.js 16.0.8**: React 프레임워크
- **React 19.2.1**: UI 라이브러리
- **TypeScript**: 타입 안정성
- **Tailwind CSS 4**: 스타일링
- **Framer Motion**: 애니메이션
- **recharts**: 차트 라이브러리
- **next-pwa**: PWA 플러그인
- **countup.js**: 숫자 카운팅
- **html-to-image**: 이미지 생성

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 프로덕션 빌드

```bash
npm run build
npm start
```

## PWA 설치

### Android (Chrome)

1. 브라우저에서 사이트 방문
2. 주소창에 설치 아이콘 표시 또는 설치 프롬프트 표시
3. "설치" 버튼 클릭

### iOS (Safari)

1. Safari에서 사이트 방문
2. 공유 버튼(⬆️) 클릭
3. "홈 화면에 추가" 선택

### Desktop (Chrome/Edge)

1. 주소창에 설치 아이콘 표시
2. 클릭하여 설치

## 프로젝트 구조

```
├── app/                    # Next.js App Router 페이지
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 메인 대시보드
│   ├── briefing/[id]/     # 브리핑 상세 페이지
│   ├── stock/[symbol]/    # 종목 상세 페이지
│   └── offline/           # 오프라인 페이지
├── components/            # React 컴포넌트
│   ├── StockCard.tsx      # 주가 카드
│   ├── StockChart.tsx     # 주가 차트
│   ├── BriefingCalendar.tsx # 브리핑 달력
│   ├── PWAInstallPrompt.tsx # PWA 설치 프롬프트
│   └── ...
├── contexts/              # React Context
│   └── ThemeContext.tsx   # 테마 컨텍스트
├── hooks/                 # 커스텀 훅
│   ├── useCountUp.ts      # 숫자 카운팅 훅
│   └── useScrollAnimation.ts # 스크롤 애니메이션 훅
├── utils/                 # 유틸리티 함수
│   ├── alertStorage.ts    # 알림 저장소
│   ├── favoriteStorage.ts # 즐겨찾기 저장소
│   └── ...
├── types/                 # TypeScript 타입 정의
│   └── index.ts
├── data/                  # 목업 데이터
│   └── mockData.ts
└── public/                # 정적 파일
    ├── manifest.json       # PWA 매니페스트
    ├── icon-*.png         # PWA 아이콘
    └── sw.js              # Service Worker (빌드 시 생성)
```

## 주요 기능 상세

### 알림 설정
- 종목별 가격/변동률/거래량 알림
- 복합 조건 설정 (최대 3개, AND/OR)
- 브라우저 푸시, 소리, 진동 설정
- 알림 히스토리 (최근 10개)

### 브리핑 달력
- 월간/주간/목록 뷰 모드
- 날짜별 브리핑 표시
- 필터링 (카테고리, 키워드)
- 로컬스토리지에 설정 저장

### 관심 종목
- 종목별 즐겨찾기 추가/제거
- 정렬 기능 (추가일, 이름, 변동률, 거래량)
- 최대 50개 제한

### PWA 기능
- 오프라인 지원
- Service Worker 자동 등록
- 설치 프롬프트 (플랫폼별 맞춤)
- 업데이트 알림

## 개발 가이드

### 아이콘 생성

PWA 아이콘을 변경하려면:

1. `public/icon.svg` 수정
2. 아이콘 생성 스크립트 실행:
   ```bash
   npm run generate-icons
   ```

### 타입 체크

```bash
npm run lint
```

### 빌드

```bash
npm run build
```

## 환경 변수

현재는 환경 변수가 필요하지 않습니다. 향후 API 연동 시 추가될 수 있습니다.

## 브라우저 지원

- Chrome (최신 버전)
- Safari (최신 버전)
- Firefox (최신 버전)
- Edge (최신 버전)

## 라이선스

이 프로젝트는 개인 프로젝트입니다.

## 개발일지

자세한 개발 과정은 [`개발일지/`](./개발일지/) 폴더를 참고하세요.
