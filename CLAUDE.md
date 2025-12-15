# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # 개발 서버 실행 (http://localhost:3000)
npm run build        # 프로덕션 빌드
npm run lint         # ESLint 검사
npm run generate-icons  # PWA 아이콘 생성 (public/icon.svg 기반)
```

## Architecture

Next.js 16 App Router 기반의 PWA 대시보드 애플리케이션 (React 19, TypeScript, Tailwind CSS 4).

### 주요 구조

- **app/**: Next.js App Router 페이지
  - `page.tsx`: 메인 대시보드
  - `briefing/[id]/`: 브리핑 상세
  - `stock/[symbol]/`: 종목 상세
  - `offline/`: 오프라인 페이지
- **components/**: React 컴포넌트 (30개)
- **contexts/**: ThemeContext (light/dark/system 지원)
- **hooks/**: useCountUp, useScrollAnimation, useDebounce
- **utils/**: 로컬스토리지 관리 유틸리티 (알림, 즐겨찾기, 검색 기록, 캘린더 등)
- **types/**: TypeScript 타입 정의
- **data/mockData.ts**: 목업 데이터

### 테마 시스템

`ThemeProvider`가 `app/layout.tsx`에서 앱 전체를 감싸며, `useTheme()` 훅으로 테마 접근. 다크 모드는 `dark:` Tailwind 클래스 사용.

### 로컬스토리지 패턴

각 기능별 `*Storage.ts` 유틸리티가 로컬스토리지 접근을 관리:
- `alertStorage.ts`: 알림 설정
- `favoriteStorage.ts`: 관심 종목
- `calendarStorage.ts`: 캘린더 설정
- `searchHistoryStorage.ts`: 검색 기록

### Path Alias

`@/*`는 프로젝트 루트를 가리킴 (예: `@/components/StockCard`)

## 개발일지

**모든 개발 단계마다** `개발일지/` 폴더에 마크다운 파일 작성 필수. 형식: `YYYY-MM-DD-기능명.md`

기록 내용:
- 작성 시각
- 해결하고자 한 문제
- 해결된 것
- 해결되지 않은 것
- 향후 개발을 위한 컨텍스트 정리

## 백엔드 개발 규칙

API 함수, 클래스 등 백엔드 로직 구현 시:
1. 구현 완료 후 철저한 테스트 수행
2. 테스트 검증 완료 후에만 다음 단계로 진행

## 코드 스타일

- 컴포넌트: PascalCase (`StockCard.tsx`)
- 함수/변수: camelCase
- 모든 컴포넌트는 다크 모드 지원 필수 (`dark:` 클래스)
- 모바일 우선 반응형 디자인 (`sm:`, `md:`, `lg:`)
- 목업 데이터는 `data/mockData.ts`에서 관리
