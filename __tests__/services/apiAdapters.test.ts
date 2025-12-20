/**
 * API Adapters Tests
 *
 * Tests for data transformation between API responses and frontend types.
 */

import {
  adaptStock,
  adaptRankedStock,
  adaptSelectionCriteria,
  adaptBriefing,
  adaptBriefings,
  adaptChartData,
  adaptStockDetail,
} from '../../services/apiAdapters';
import type { ApiBriefing, ApiRankedStock, ApiScoreBreakdown, ApiWhyHotItem, ApiStockDetail, ApiPriceDataPoint } from '../../services/api';

// Sample test data
const mockStockDetail: ApiStockDetail = {
  symbol: 'AAPL',
  name: 'Apple Inc.',
  price: 175.50,
  change: 2.50,
  change_percent: 1.45,
  volume: 50000000,
  avg_volume: 45000000,
  volume_ratio: 1.11,
  market_cap: 2800000000000,
  pe_ratio: 28.5,
  fifty_two_week_high: 200.00,
  fifty_two_week_low: 140.00,
  currency: 'USD',
};

const mockScoreBreakdown: ApiScoreBreakdown = {
  volume_score: 8,
  price_change_score: 7,
  momentum_score: 9,
  market_cap_score: 8,
  total: 32,
};

const mockWhyHot: ApiWhyHotItem[] = [
  { icon: 'check', message: 'Volume surged 1.11x above average' },
  { icon: 'check', message: 'Price increased 1.45% today' },
  { icon: 'check', message: 'Strong momentum in recent days' },
];

const mockChartData: ApiPriceDataPoint[] = [
  { date: '2024-01-10', open: 170.0, high: 172.0, low: 169.0, close: 171.5, volume: 45000000 },
  { date: '2024-01-11', open: 171.5, high: 174.0, low: 171.0, close: 173.0, volume: 48000000 },
];

describe('API Adapters', () => {
  describe('adaptStock', () => {
    it('should transform API stock to frontend Stock type', () => {
      const result = adaptStock(mockStockDetail, mockScoreBreakdown, 1);

      expect(result).toMatchObject({
        symbol: 'AAPL',
        shortName: 'Apple Inc.',
        currentPrice: 175.50,
        change: 2.50,
        changePercent: 1.45,
        volume: 50000000,
        marketCap: 2800000000000,
        compositeScore: 32,
        rank: 1,
      });
    });

    it('should handle null market cap', () => {
      const stockWithNullCap = { ...mockStockDetail, market_cap: null };
      const result = adaptStock(stockWithNullCap, mockScoreBreakdown, 1);

      expect(result.marketCap).toBe(0);
    });

    it('should set default sector and industry', () => {
      const result = adaptStock(mockStockDetail, mockScoreBreakdown, 1);

      expect(result.sector).toBe('N/A');
      expect(result.industry).toBe('N/A');
    });

    it('should include selectedAt timestamp', () => {
      const result = adaptStock(mockStockDetail, mockScoreBreakdown, 1);

      expect(result.selectedAt).toBeDefined();
      expect(new Date(result.selectedAt)).toBeInstanceOf(Date);
    });
  });

  describe('adaptRankedStock', () => {
    it('should transform ranked stock correctly', () => {
      const rankedStock: ApiRankedStock = {
        rank: 2,
        stock: mockStockDetail,
        score: mockScoreBreakdown,
      };

      const result = adaptRankedStock(rankedStock);

      expect(result.rank).toBe(2);
      expect(result.symbol).toBe('AAPL');
      expect(result.compositeScore).toBe(32);
    });
  });

  describe('adaptSelectionCriteria', () => {
    it('should transform score and why_hot to SelectionCriteria', () => {
      const result = adaptSelectionCriteria(mockScoreBreakdown, mockWhyHot);

      expect(result.type).toBe('composite');
      expect(result.rank).toBe(1);
      expect(result.description).toContain('32');
      expect(result.description).toContain('/40');
    });

    it('should include all why_hot messages', () => {
      const result = adaptSelectionCriteria(mockScoreBreakdown, mockWhyHot);

      mockWhyHot.forEach((item) => {
        expect(result.description).toContain(item.message);
      });
    });
  });

  describe('adaptBriefing', () => {
    it('should transform API briefing to frontend Briefing', () => {
      const apiBriefing: ApiBriefing = {
        id: '2024-01-15',
        date: '2024-01-15',
        created_at: '2024-01-15T09:00:00Z',
        stock: mockStockDetail,
        score: mockScoreBreakdown,
        why_hot: mockWhyHot,
        news: [],
      };

      const result = adaptBriefing(apiBriefing);

      expect(result.briefingId).toContain('20240115');
      expect(result.symbol).toBe('AAPL');
      expect(result.date).toBe('2024-01-15');
      expect(result.status).toBe('completed');
    });

    it('should include text summary with key points', () => {
      const apiBriefing: ApiBriefing = {
        id: '2024-01-15',
        date: '2024-01-15',
        created_at: '2024-01-15T09:00:00Z',
        stock: mockStockDetail,
        score: mockScoreBreakdown,
        why_hot: mockWhyHot,
        news: [],
      };

      const result = adaptBriefing(apiBriefing);

      expect(result.textSummary).toBeDefined();
      expect(result.textSummary.title).toContain('Apple Inc.');
      expect(result.textSummary.keyPoints).toHaveLength(mockWhyHot.length);
    });

    it('should include image briefing structure', () => {
      const apiBriefing: ApiBriefing = {
        id: '2024-01-15',
        date: '2024-01-15',
        created_at: '2024-01-15T09:00:00Z',
        stock: mockStockDetail,
        score: mockScoreBreakdown,
        why_hot: mockWhyHot,
        news: [],
      };

      const result = adaptBriefing(apiBriefing);

      expect(result.imageBriefing).toBeDefined();
      expect(result.imageBriefing.format).toBe('png');
      expect(result.imageBriefing.dimensions).toMatchObject({
        width: 1200,
        height: 1600,
      });
    });
  });

  describe('adaptBriefings', () => {
    it('should transform array of briefings', () => {
      const apiBriefings: ApiBriefing[] = [
        {
          id: '2024-01-15',
          date: '2024-01-15',
          created_at: '2024-01-15T09:00:00Z',
          stock: mockStockDetail,
          score: mockScoreBreakdown,
          why_hot: mockWhyHot,
          news: [],
        },
        {
          id: '2024-01-14',
          date: '2024-01-14',
          created_at: '2024-01-14T09:00:00Z',
          stock: { ...mockStockDetail, symbol: 'TSLA' },
          score: mockScoreBreakdown,
          why_hot: mockWhyHot,
          news: [],
        },
      ];

      const result = adaptBriefings(apiBriefings);

      expect(result).toHaveLength(2);
      expect(result[0].symbol).toBe('AAPL');
      expect(result[1].symbol).toBe('TSLA');
    });

    it('should handle empty array', () => {
      const result = adaptBriefings([]);

      expect(result).toHaveLength(0);
    });
  });

  describe('adaptChartData', () => {
    it('should transform API chart data to PriceData array', () => {
      const result = adaptChartData(mockChartData);

      expect(result).toHaveLength(mockChartData.length);
      result.forEach((point, index) => {
        expect(point.date).toBe(mockChartData[index].date);
        expect(point.price).toBe(mockChartData[index].close);
        expect(point.volume).toBe(mockChartData[index].volume);
      });
    });

    it('should include all OHLCV fields', () => {
      const result = adaptChartData(mockChartData);

      result.forEach((point) => {
        expect(point).toMatchObject({
          date: expect.any(String),
          price: expect.any(Number),
          volume: expect.any(Number),
          open: expect.any(Number),
          high: expect.any(Number),
          low: expect.any(Number),
          close: expect.any(Number),
        });
      });
    });

    it('should map close price to price field', () => {
      const result = adaptChartData(mockChartData);

      result.forEach((point, index) => {
        expect(point.price).toBe(mockChartData[index].close);
      });
    });
  });

  describe('adaptStockDetail', () => {
    it('should transform stock without score', () => {
      const result = adaptStockDetail(mockStockDetail);

      expect(result.symbol).toBe('AAPL');
      expect(result.compositeScore).toBe(0);
      expect(result.rank).toBe(0);
    });

    it('should handle all stock fields', () => {
      const result = adaptStockDetail(mockStockDetail);

      expect(result).toMatchObject({
        symbol: 'AAPL',
        shortName: 'Apple Inc.',
        currentPrice: 175.50,
        change: 2.50,
        changePercent: 1.45,
        volume: 50000000,
        marketCap: 2800000000000,
      });
    });
  });
});

describe('Adapter Edge Cases', () => {
  describe('Missing Data Handling', () => {
    it('should handle stock with missing optional fields', () => {
      const stockWithMissingFields: ApiStockDetail = {
        symbol: 'TEST',
        name: 'Test Stock',
        price: 100,
        change: 1,
        change_percent: 1,
        volume: 1000000,
        avg_volume: null,
        volume_ratio: null,
        market_cap: null,
        pe_ratio: null,
        fifty_two_week_high: null,
        fifty_two_week_low: null,
        currency: 'USD',
      };

      const result = adaptStock(
        stockWithMissingFields,
        { volume_score: 0, price_change_score: 0, momentum_score: 0, market_cap_score: 0, total: 0 },
        1
      );

      expect(result.marketCap).toBe(0);
    });

    it('should handle empty why_hot array', () => {
      const result = adaptSelectionCriteria(mockScoreBreakdown, []);

      expect(result.description).toContain('32');
    });
  });

  describe('Data Type Conversions', () => {
    it('should convert change_percent to percentage format', () => {
      const result = adaptStock(mockStockDetail, mockScoreBreakdown, 1);

      expect(result.changePercent).toBe(1.45);
    });

    it('should preserve date format in chart data', () => {
      const result = adaptChartData(mockChartData);

      result.forEach((point) => {
        expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });
});
