/**
 * API Service Tests
 *
 * Tests for frontend API service functions using fetch mocking.
 */

import {
  fetchTrendingStock,
  fetchTopNStocks,
  fetchBriefings,
  fetchBriefingByDate,
  fetchStockDetail,
  fetchStockChart,
} from '../../services/api';

// Sample test data
const mockStockDetail = {
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

const mockScoreBreakdown = {
  volume_score: 8,
  price_change_score: 7,
  momentum_score: 9,
  market_cap_score: 8,
  total: 32,
};

const mockWhyHot = [
  { icon: 'check', message: 'Volume surged 1.11x above average' },
  { icon: 'check', message: 'Price increased 1.45% today' },
  { icon: 'check', message: 'Strong momentum in recent days' },
];

const mockTrendingResponse = {
  stock: mockStockDetail,
  score: mockScoreBreakdown,
  why_hot: mockWhyHot,
  news: [
    {
      title: 'Apple announces new product',
      url: 'https://example.com/news/1',
      published_date: '2024-01-15T10:00:00Z',
      source: 'TechNews',
    },
  ],
};

const mockTopNResponse = {
  screener_type: 'most_actives',
  count: 3,
  stocks: [
    { rank: 1, stock: { ...mockStockDetail, symbol: 'NVDA', name: 'NVIDIA' }, score: mockScoreBreakdown },
    { rank: 2, stock: { ...mockStockDetail, symbol: 'TSLA', name: 'Tesla' }, score: { ...mockScoreBreakdown, total: 30 } },
    { rank: 3, stock: { ...mockStockDetail, symbol: 'AAPL', name: 'Apple' }, score: { ...mockScoreBreakdown, total: 28 } },
  ],
};

const mockBriefingListResponse = {
  briefings: [
    {
      id: '2024-01-15',
      date: '2024-01-15',
      created_at: '2024-01-15T09:00:00Z',
      stock: mockStockDetail,
      score: mockScoreBreakdown,
      why_hot: mockWhyHot,
      news: [],
    },
  ],
  total: 1,
  page: 1,
  limit: 10,
  total_pages: 1,
};

const mockChartResponse = {
  symbol: 'AAPL',
  name: 'Apple Inc.',
  period: '5d',
  data: [
    { date: '2024-01-10', open: 170.0, high: 172.0, low: 169.0, close: 171.5, volume: 45000000 },
    { date: '2024-01-11', open: 171.5, high: 174.0, low: 171.0, close: 173.0, volume: 48000000 },
  ],
};

// Helper to create mock fetch response
function mockFetchResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response);
}

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchTrendingStock', () => {
    it('should fetch trending stock successfully', async () => {
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse(mockTrendingResponse));

      const result = await fetchTrendingStock('most_actives');

      expect(result).toBeDefined();
      expect(result.stock.symbol).toBe('AAPL');
      expect(result.score.total).toBe(32);
      expect(result.why_hot).toHaveLength(3);
    });

    it('should call correct API endpoint', async () => {
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse(mockTrendingResponse));

      await fetchTrendingStock('day_gainers');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/stocks/trending?type=day_gainers')
      );
    });

    it('should throw error on API failure', async () => {
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse({ detail: 'Error' }, 500));

      await expect(fetchTrendingStock('most_actives')).rejects.toThrow('500');
    });
  });

  describe('fetchTopNStocks', () => {
    it('should fetch top N stocks with default count', async () => {
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse(mockTopNResponse));

      const result = await fetchTopNStocks('most_actives');

      expect(result).toBeDefined();
      expect(result.stocks.length).toBeGreaterThan(0);
    });

    it('should call API with correct count parameter', async () => {
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse(mockTopNResponse));

      await fetchTopNStocks('most_actives', 3);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('count=3')
      );
    });

    it('should include rank for each stock', async () => {
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse(mockTopNResponse));

      const result = await fetchTopNStocks('most_actives', 3);

      result.stocks.forEach((rankedStock, index) => {
        expect(rankedStock.rank).toBe(index + 1);
      });
    });
  });

  describe('fetchBriefings', () => {
    it('should fetch briefings with pagination', async () => {
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse(mockBriefingListResponse));

      const result = await fetchBriefings(1, 10);

      expect(result).toBeDefined();
      expect(result.briefings).toBeInstanceOf(Array);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should call API with pagination parameters', async () => {
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse(mockBriefingListResponse));

      await fetchBriefings(2, 5);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=5')
      );
    });
  });

  describe('fetchBriefingByDate', () => {
    it('should fetch briefing for specific date', async () => {
      const mockResponse = { briefing: mockBriefingListResponse.briefings[0] };
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse(mockResponse));

      const result = await fetchBriefingByDate('2024-01-15');

      expect(result).toBeDefined();
      expect(result.briefing.date).toBe('2024-01-15');
    });

    it('should throw error for non-existent date', async () => {
      (global.fetch as jest.Mock).mockReturnValue(
        mockFetchResponse({ detail: '2099-12-31 날짜의 브리핑을 찾을 수 없습니다' }, 404)
      );

      await expect(fetchBriefingByDate('2099-12-31')).rejects.toThrow('2099-12-31');
    });
  });

  describe('fetchStockDetail', () => {
    it('should fetch stock detail for valid ticker', async () => {
      const mockResponse = { stock: mockStockDetail, news: [] };
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse(mockResponse));

      const result = await fetchStockDetail('AAPL');

      expect(result).toBeDefined();
      expect(result.stock.symbol).toBe('AAPL');
      expect(result.news).toBeInstanceOf(Array);
    });

    it('should call API with ticker in URL', async () => {
      const mockResponse = { stock: mockStockDetail, news: [] };
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse(mockResponse));

      await fetchStockDetail('AAPL');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/stocks/AAPL')
      );
    });

    it('should throw 404 for invalid ticker', async () => {
      (global.fetch as jest.Mock).mockReturnValue(
        mockFetchResponse({ detail: "종목 'INVALID'를 찾을 수 없습니다" }, 404)
      );

      await expect(fetchStockDetail('INVALID')).rejects.toThrow('INVALID');
    });
  });

  describe('fetchStockChart', () => {
    it('should fetch chart data with default period', async () => {
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse(mockChartResponse));

      const result = await fetchStockChart('AAPL');

      expect(result).toBeDefined();
      expect(result.symbol).toBe('AAPL');
      expect(result.period).toBe('5d');
      expect(result.data).toBeInstanceOf(Array);
    });

    it('should accept custom period', async () => {
      const customResponse = { ...mockChartResponse, period: '1mo' };
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse(customResponse));

      const result = await fetchStockChart('AAPL', '1mo');

      expect(result.period).toBe('1mo');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('period=1mo')
      );
    });

    it('should return OHLCV data points', async () => {
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse(mockChartResponse));

      const result = await fetchStockChart('AAPL', '5d');

      result.data.forEach((point) => {
        expect(point).toMatchObject({
          date: expect.any(String),
          open: expect.any(Number),
          high: expect.any(Number),
          low: expect.any(Number),
          close: expect.any(Number),
          volume: expect.any(Number),
        });
      });
    });
  });
});

describe('API Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('HTTP Errors', () => {
    it('should throw on 500 server error', async () => {
      (global.fetch as jest.Mock).mockReturnValue(
        mockFetchResponse({ detail: 'Internal Server Error' }, 500)
      );

      await expect(fetchTrendingStock('most_actives')).rejects.toThrow('500');
    });

    it('should throw on 404 not found', async () => {
      (global.fetch as jest.Mock).mockReturnValue(
        mockFetchResponse({ detail: 'Not found' }, 404)
      );

      await expect(fetchStockDetail('NOTFOUND')).rejects.toThrow();
    });

    it('should throw on 429 rate limit', async () => {
      (global.fetch as jest.Mock).mockReturnValue(
        mockFetchResponse({
          error: 'rate_limit_exceeded',
          message: '요청 한도를 초과했습니다',
        }, 429)
      );

      await expect(fetchTrendingStock('most_actives')).rejects.toThrow('429');
    });
  });

  describe('Network Errors', () => {
    it('should throw on network failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(fetchTrendingStock('most_actives')).rejects.toThrow('Network error');
    });
  });
});

describe('API Response Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stock Response Structure', () => {
    it('should have valid trending response structure', async () => {
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse(mockTrendingResponse));

      const result = await fetchTrendingStock('most_actives');

      expect(result).toHaveProperty('stock');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('why_hot');
      expect(result).toHaveProperty('news');
    });

    it('should have valid score breakdown', async () => {
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse(mockTrendingResponse));

      const result = await fetchTrendingStock('most_actives');

      expect(result.score).toMatchObject({
        volume_score: expect.any(Number),
        price_change_score: expect.any(Number),
        momentum_score: expect.any(Number),
        market_cap_score: expect.any(Number),
        total: expect.any(Number),
      });
    });
  });

  describe('Briefing Response Structure', () => {
    it('should have valid briefing list response', async () => {
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse(mockBriefingListResponse));

      const result = await fetchBriefings(1, 10);

      expect(result).toMatchObject({
        briefings: expect.any(Array),
        total: expect.any(Number),
        page: expect.any(Number),
        limit: expect.any(Number),
        total_pages: expect.any(Number),
      });
    });
  });
});
