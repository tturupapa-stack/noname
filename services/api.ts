// 백엔드 API 연동 서비스

import { apiCache, cacheKeys, cacheTTL } from './apiCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============================================================
// 유틸리티 함수
// ============================================================

/** 한국 주식 코드를 Yahoo Finance 형식으로 변환 (6자리 숫자 → .KS 추가) */
function toYahooSymbol(ticker: string): string {
  return /^\d{6}$/.test(ticker) ? `${ticker}.KS` : ticker;
}

/** API 응답 검증 및 에러 처리 */
async function handleResponse<T>(response: Response, errorContext: string): Promise<T> {
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`${errorContext}: 찾을 수 없습니다`);
    }
    throw new Error(`${errorContext}: ${response.status}`);
  }
  return response.json();
}

/** 캐시 적용 GET 요청 (중복 패턴 제거) */
async function cachedGet<T>(
  endpoint: string,
  cacheKey: string,
  ttl: number,
  errorContext: string
): Promise<T> {
  return apiCache.fetchWithCache(
    cacheKey,
    async () => {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      return handleResponse<T>(response, errorContext);
    },
    ttl
  );
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

// ============================================================
// API 호출 함수들 (캐시 적용)
// ============================================================

export function fetchTrendingStock(type: string = 'most_actives'): Promise<ApiTrendingResponse> {
  return cachedGet(
    `/api/stocks/trending?type=${type}`,
    cacheKeys.trending(type),
    cacheTTL.trending,
    '화제종목 조회 실패'
  );
}

export function fetchTopNStocks(type: string = 'most_actives', count: number = 5): Promise<ApiTopNResponse> {
  return cachedGet(
    `/api/stocks/trending/top?type=${type}&count=${count}`,
    cacheKeys.topN(type, count),
    cacheTTL.topN,
    'Top N 종목 조회 실패'
  );
}

export function fetchBriefings(page: number = 1, limit: number = 10): Promise<ApiBriefingListResponse> {
  return cachedGet(
    `/api/briefings?page=${page}&limit=${limit}`,
    cacheKeys.briefings(page, limit),
    cacheTTL.briefings,
    '브리핑 목록 조회 실패'
  );
}

export function fetchBriefingByDate(date: string): Promise<{ briefing: ApiBriefing }> {
  return cachedGet(
    `/api/briefings/${date}`,
    cacheKeys.briefingByDate(date),
    cacheTTL.briefings,
    `${date} 브리핑 조회 실패`
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

export function fetchStockChart(ticker: string, period: string = '5d'): Promise<ApiChartDataResponse> {
  const symbol = toYahooSymbol(ticker);
  return cachedGet(
    `/api/stocks/${symbol}/chart?period=${period}`,
    cacheKeys.stockChart(symbol, period),
    cacheTTL.chart,
    `${ticker} 차트 조회 실패`
  );
}

// 종목 상세 정보 응답
export interface ApiStockDetailResponse {
  stock: ApiStockDetail;
  news: ApiNewsItem[];
}

export function fetchStockDetail(ticker: string): Promise<ApiStockDetailResponse> {
  const symbol = toYahooSymbol(ticker);
  return cachedGet(
    `/api/stocks/${symbol}`,
    cacheKeys.stockDetail(symbol),
    cacheTTL.stockDetail,
    `${ticker} 종목 조회 실패`
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
