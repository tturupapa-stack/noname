// 백엔드 API 연동 서비스

import { apiCache, cacheKeys, cacheTTL } from './apiCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 한국 주식 코드를 Yahoo Finance 형식으로 변환
// 6자리 숫자 코드는 코스피(.KS) 형식으로 변환
function toYahooSymbol(ticker: string): string {
  // 6자리 숫자인 경우 한국 주식으로 간주하고 .KS 추가
  if (/^\d{6}$/.test(ticker)) {
    return `${ticker}.KS`;
  }
  return ticker;
}

// 백엔드 응답 타입
export interface ApiStockDetail {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  avg_volume: number | null;
  volume_ratio: number | null;
  market_cap: number | null;
  pe_ratio: number | null;
  fifty_two_week_high: number | null;
  fifty_two_week_low: number | null;
  currency: string;
}

export interface ApiScoreBreakdown {
  volume_score: number;
  price_change_score: number;
  momentum_score: number;
  market_cap_score: number;
  total: number;
}

export interface ApiWhyHotItem {
  icon: string;
  message: string;
}

export interface ApiNewsItem {
  title: string;
  url: string;
  published_date: string;
  source: string;
}

export interface ApiTrendingResponse {
  stock: ApiStockDetail;
  score: ApiScoreBreakdown;
  why_hot: ApiWhyHotItem[];
  news: ApiNewsItem[];
}

export interface ApiRankedStock {
  rank: number;
  stock: ApiStockDetail;
  score: ApiScoreBreakdown;
}

export interface ApiTopNResponse {
  screener_type: string;
  count: number;
  stocks: ApiRankedStock[];
}

export interface ApiBriefing {
  id: string;
  date: string;
  created_at: string;
  stock: ApiStockDetail;
  score: ApiScoreBreakdown;
  why_hot: ApiWhyHotItem[];
  news: ApiNewsItem[];
}

export interface ApiBriefingListResponse {
  briefings: ApiBriefing[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// API 호출 함수들 (캐시 적용)
export async function fetchTrendingStock(type: string = 'most_actives'): Promise<ApiTrendingResponse> {
  const cacheKey = cacheKeys.trending(type);

  return apiCache.fetchWithCache(
    cacheKey,
    async () => {
      const response = await fetch(`${API_BASE_URL}/api/stocks/trending?type=${type}`);
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }
      return response.json();
    },
    cacheTTL.trending
  );
}

export async function fetchTopNStocks(type: string = 'most_actives', count: number = 5): Promise<ApiTopNResponse> {
  const cacheKey = cacheKeys.topN(type, count);

  return apiCache.fetchWithCache(
    cacheKey,
    async () => {
      const response = await fetch(`${API_BASE_URL}/api/stocks/trending/top?type=${type}&count=${count}`);
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }
      return response.json();
    },
    cacheTTL.topN
  );
}

export async function fetchBriefings(page: number = 1, limit: number = 10): Promise<ApiBriefingListResponse> {
  const cacheKey = cacheKeys.briefings(page, limit);

  return apiCache.fetchWithCache(
    cacheKey,
    async () => {
      const response = await fetch(`${API_BASE_URL}/api/briefings?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }
      return response.json();
    },
    cacheTTL.briefings
  );
}

export async function fetchBriefingByDate(date: string): Promise<{ briefing: ApiBriefing }> {
  const cacheKey = cacheKeys.briefingByDate(date);

  return apiCache.fetchWithCache(
    cacheKey,
    async () => {
      const response = await fetch(`${API_BASE_URL}/api/briefings/${date}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`${date} 날짜의 브리핑을 찾을 수 없습니다`);
        }
        throw new Error(`API 호출 실패: ${response.status}`);
      }
      return response.json();
    },
    cacheTTL.briefings
  );
}

// 차트 데이터 타입
export interface ApiPriceDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ApiChartDataResponse {
  symbol: string;
  name: string;
  period: string;
  data: ApiPriceDataPoint[];
}

export async function fetchStockChart(ticker: string, period: string = '5d'): Promise<ApiChartDataResponse> {
  const yahooTicker = toYahooSymbol(ticker);
  const cacheKey = cacheKeys.stockChart(yahooTicker, period);

  return apiCache.fetchWithCache(
    cacheKey,
    async () => {
      const response = await fetch(`${API_BASE_URL}/api/stocks/${yahooTicker}/chart?period=${period}`);
      if (!response.ok) {
        throw new Error(`차트 조회 실패: ${response.status}`);
      }
      return response.json();
    },
    cacheTTL.chart
  );
}

// 종목 상세 정보 응답
export interface ApiStockDetailResponse {
  stock: ApiStockDetail;
  news: ApiNewsItem[];
}

export async function fetchStockDetail(ticker: string): Promise<ApiStockDetailResponse> {
  const yahooTicker = toYahooSymbol(ticker);
  const cacheKey = cacheKeys.stockDetail(yahooTicker);

  return apiCache.fetchWithCache(
    cacheKey,
    async () => {
      const response = await fetch(`${API_BASE_URL}/api/stocks/${yahooTicker}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`종목 '${ticker}'를 찾을 수 없습니다`);
        }
        throw new Error(`종목 조회 실패: ${response.status}`);
      }
      return response.json();
    },
    cacheTTL.stockDetail
  );
}

// 캐시 무효화 유틸리티 (필요시 사용)
export function invalidateCache(pattern?: string): void {
  if (pattern) {
    apiCache.invalidatePattern(pattern);
  } else {
    apiCache.clear();
  }
}

// AI 브리핑 생성 요청/응답 타입
export interface AIBriefingRequest {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  news_count?: number;
}

export interface AIBriefingResponse {
  symbol: string;
  name: string;
  markdown: string;
  generated_at: string;
  success: boolean;
  error?: string;
}

// AI 브리핑 생성 API (캐시 없음 - 매번 새로 생성)
export async function generateAIBriefing(request: AIBriefingRequest): Promise<AIBriefingResponse> {
  const response = await fetch(`${API_BASE_URL}/api/briefing/ai-generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`AI 브리핑 생성 실패: ${response.status}`);
  }

  return response.json();
}
