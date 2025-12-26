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

### Development Logs
Development logs are written to `개발일지/` folder in format `YYYY-MM-DD-기능명.md` for major features, bug fixes, and refactoring work.

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
