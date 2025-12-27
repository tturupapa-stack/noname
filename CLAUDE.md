# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"당신이 잠든 사이" (While You Were Sleeping) - A stock market briefing dashboard that provides daily morning briefings at 7 AM with market data, exchange rates, and news summaries.

## Commands

```bash
# Development
npm run dev          # Start Next.js development server (localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint

# Testing
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report

# Backend (Python FastAPI)
cd backend && uvicorn main:app --reload  # Start backend API (localhost:8000)
pip install -r backend/requirements.txt  # Install backend dependencies

# Utilities
npm run generate-icons  # Regenerate PWA icons from public/icon.svg
```

## Architecture

### Dual Stack Application
- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Python FastAPI with Yahoo Finance data + Exa API for news
- **MCP Server**: Claude Desktop integration for AI-powered briefing generation

### Frontend-Backend Communication
- Frontend services in `services/` call the Python backend at `localhost:8000`
- `services/api.ts` handles all backend API calls with caching via `services/apiCache.ts`
- `services/apiAdapters.ts` transforms backend responses to frontend data structures

### Key Data Flow
1. Backend `backend/services/screener_service.py` fetches trending stocks from Yahoo Finance
2. `backend/services/news_service.py` collects related news via Exa API
3. Frontend receives data through `services/api.ts` and displays via components
4. AI briefings generated through MCP server or `backend/api/briefing_generate.py`

### State Management
- React Context for theme (`contexts/ThemeContext.tsx`)
- LocalStorage utilities in `utils/` for alerts, favorites, calendar settings, search history
- Client-side caching in `services/apiCache.ts`

## Code Conventions (from .cursorrules)

### Required Practices
- **Dark mode**: All components must support dark mode using `dark:` Tailwind classes
- **Mobile-first**: Use responsive classes (`sm:`, `md:`, `lg:`)
- **Accessibility**: Keyboard navigation, ARIA labels, focus management

### Naming
- Components: PascalCase (`StockCard.tsx`)
- Functions/variables: camelCase
- Types/interfaces: PascalCase

### File Organization
- Components: `components/`
- Utilities: `utils/`
- Types: `types/`
- Mock data: `data/mockData.ts`

### Development Logs (개발일지) - REQUIRED

**중요**: 모든 개발 작업 완료 후 반드시 개발일지를 작성해야 한다.

#### 작성 시점
- 새 기능 개발 완료
- 버그 수정 완료
- 리팩토링 완료
- 설정 변경 완료

#### 파일 형식
```
개발일지/YYYY-MM-DD-기능명.md
```

#### 필수 섹션
```markdown
# 개발일지 - {기능명}

**작성 시각**: YYYY-MM-DD
**작업자**: {에이전트 역할}

## 해결하고자 한 문제
{요구사항 및 배경}

## 해결된 것
✅ **카테고리** (`파일경로`)
- 세부 내용

## 해결되지 않은 것
⚠️ 이슈 또는 "없음"

## 향후 개발을 위한 컨텍스트 정리
### 사용법
### 파일 구조
### 다음 개선 사항
```

#### 상세 템플릿
전체 템플릿은 `skills/dev-log/references/template.md` 참조.

## Environment Variables

```bash
# Frontend (.env)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend (backend/.env)
EXA_API_KEY=xxx          # For news collection
ANTHROPIC_API_KEY=xxx    # For AI briefing generation (MCP server)
```

## Testing

Jest with React Testing Library. Test files go in `__tests__/` with pattern `*.test.ts` or `*.test.tsx`. MSW is available for API mocking.

## Backend API Endpoints

- `GET /api/stocks/trending` - Trending stock with analysis
- `GET /api/stocks/trending/top?count=N` - Top N trending stocks
- `GET /api/stocks/{symbol}` - Stock details
- `GET /api/stocks/{symbol}/chart?period=5d` - Chart data
- `GET /api/briefings` - List saved briefings
- `POST /api/briefing/ai-generate` - Generate AI briefing
