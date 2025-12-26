// API 응답을 프론트엔드 타입으로 변환하는 어댑터

import { Stock, SelectionCriteria, Briefing, PriceData } from '@/types';
import {
  ApiTrendingResponse,
  ApiRankedStock,
  ApiBriefing,
  ApiScoreBreakdown,
  ApiWhyHotItem,
  ApiPriceDataPoint,
} from './api';

// ============================================================
// 섹터 추론 로직
// ============================================================

/** 섹터별 키워드 매핑 (룩업 테이블) */
const SECTOR_KEYWORDS: Record<string, string[]> = {
  Healthcare: [
    'therapeutics', 'pharma', 'biotech', 'medical', 'health',
    'drug', 'fda', 'clinical', 'vaccine', 'oncology', 'bioscience', 'genomics'
  ],
  Technology: [
    'technology', 'software', 'semiconductor', 'chip', 'nvidia', 'amd', 'intel',
    'ai ', 'artificial intelligence', 'cloud', 'computing', 'data', 'cyber'
  ],
  Finance: [
    'bank', 'financial', 'capital', 'investment', 'insurance', 'credit', 'mortgage'
  ],
  Energy: [
    'energy', 'oil', 'gas', 'petroleum', 'solar', 'renewable', 'battery',
    'electric vehicle', 'ev '
  ],
};

/** 종목명/키워드 기반으로 섹터 추론 */
function inferSectorFromName(name: string, whyHot: string[]): string {
  const text = [name, ...whyHot].join(' ').toLowerCase();

  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return sector;
    }
  }

  return '';
}

// ============================================================
// Stock 변환
// ============================================================

/** API 종목 데이터를 Stock 타입으로 변환하는 기본 함수 */
function createStock(
  apiStock: ApiTrendingResponse['stock'],
  options: { score?: number; rank?: number } = {}
): Stock {
  const { score = 0, rank = 0 } = options;
  return {
    symbol: apiStock.symbol,
    shortName: apiStock.name,
    currentPrice: apiStock.price,
    change: apiStock.change,
    changePercent: apiStock.change_percent,
    volume: apiStock.volume,
    marketCap: apiStock.market_cap || 0,
    sector: 'N/A',
    industry: 'N/A',
    compositeScore: score,
    rank,
    selectedAt: new Date().toISOString(),
  };
}

/** API 종목을 프론트엔드 Stock 타입으로 변환 (점수 포함) */
export function adaptStock(
  apiStock: ApiTrendingResponse['stock'],
  score: ApiScoreBreakdown,
  rank: number = 1
): Stock {
  return createStock(apiStock, { score: score.total, rank });
}

/** API 랭킹 종목을 프론트엔드 Stock 타입으로 변환 */
export function adaptRankedStock(rankedStock: ApiRankedStock): Stock {
  return adaptStock(rankedStock.stock, rankedStock.score, rankedStock.rank);
}

/** API 종목 상세를 프론트엔드 Stock 타입으로 변환 (점수 없이) */
export function adaptStockDetail(apiStock: ApiTrendingResponse['stock']): Stock {
  return createStock(apiStock);
}

// API WHY HOT을 SelectionCriteria로 변환
export function adaptSelectionCriteria(
  score: ApiScoreBreakdown,
  whyHot: ApiWhyHotItem[]
): SelectionCriteria {
  const description = whyHot.map(item => item.message).join(' | ');

  return {
    type: 'composite',
    rank: 1,
    description: `복합 점수 ${score.total}/40점 - ${description}`,
  };
}

// API 브리핑을 프론트엔드 Briefing 타입으로 변환
export function adaptBriefing(apiBriefing: ApiBriefing): Briefing {
  const whyHotText = apiBriefing.why_hot.map(item => item.message);
  const newsText = apiBriefing.news
    .filter(n => n.title)
    .slice(0, 3)
    .map(n => n.title)
    .join(', ');

  // 종목명과 why_hot 메시지를 기반으로 섹터 추론
  const inferredSector = inferSectorFromName(apiBriefing.stock.name, whyHotText);

  return {
    briefingId: `brief_${apiBriefing.date.replace(/-/g, '')}_${apiBriefing.stock.symbol}_001`,
    symbol: apiBriefing.stock.symbol,
    shortName: apiBriefing.stock.name,
    date: apiBriefing.date,
    price: apiBriefing.stock.price,
    priceChange: apiBriefing.stock.change_percent,
    score: apiBriefing.score.total,
    sector: inferredSector || undefined,  // 빈 문자열이면 undefined
    status: 'completed',
    textSummary: {
      title: `${apiBriefing.stock.name}(${apiBriefing.stock.symbol}), 복합 점수 ${apiBriefing.score.total}점으로 화제`,
      summary: `${apiBriefing.stock.name} 주식이 오늘 화제의 종목으로 선정되었습니다. ${whyHotText.join(' ')} 현재 주가는 $${apiBriefing.stock.price.toFixed(2)}이며, 전일 대비 ${apiBriefing.stock.change_percent.toFixed(2)}% ${apiBriefing.stock.change_percent >= 0 ? '상승' : '하락'}했습니다.`,
      keyPoints: whyHotText,
      investmentInsight: newsText || '관련 뉴스를 확인해 주세요.',
      generatedAt: apiBriefing.created_at,
    },
    imageBriefing: {
      imageUrl: '/images/briefing-placeholder.png',
      thumbnailUrl: '/images/briefing-placeholder-thumb.png',
      format: 'png',
      dimensions: { width: 1200, height: 1600 },
      fileSize: 0,
      generatedAt: apiBriefing.created_at,
    },
    createdAt: apiBriefing.created_at,
  };
}

// API 브리핑 리스트를 프론트엔드 Briefing[] 타입으로 변환
export function adaptBriefings(apiBriefings: ApiBriefing[]): Briefing[] {
  return apiBriefings.map(adaptBriefing);
}

// API 차트 데이터를 프론트엔드 PriceData[] 타입으로 변환
export function adaptChartData(apiData: ApiPriceDataPoint[]): PriceData[] {
  return apiData.map(point => ({
    date: point.date,
    price: point.close,
    volume: point.volume,
    open: point.open,
    high: point.high,
    low: point.low,
    close: point.close,
  }));
}

