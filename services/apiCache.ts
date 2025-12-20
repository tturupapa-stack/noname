// 프론트엔드 API 캐시 레이어
// 메모리 캐시로 동일 세션 내 API 중복 호출 방지

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class ApiCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private pendingRequests: Map<string, Promise<unknown>> = new Map();

  // 기본 TTL: 3분 (백엔드 캐시 5분보다 짧게)
  private defaultTTL = 3 * 60 * 1000;

  /**
   * 캐시에서 데이터 조회
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // 만료 확인
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * 캐시에 데이터 저장
   */
  set<T>(key: string, data: T, ttlMs: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * 캐시 무효화
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.pendingRequests.delete(key);
  }

  /**
   * 패턴으로 캐시 무효화
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
    for (const key of this.pendingRequests.keys()) {
      if (regex.test(key)) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * 전체 캐시 클리어
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * 캐시 우선 fetch - 동일 요청 중복 방지 (Request Deduplication)
   */
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = this.defaultTTL
  ): Promise<T> {
    // 1. 캐시 확인
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // 2. 진행 중인 요청이 있으면 대기 (Request Deduplication)
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    // 3. 새 요청 시작
    const request = fetcher()
      .then((data) => {
        this.set(key, data, ttlMs);
        this.pendingRequests.delete(key);
        return data;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, request);
    return request;
  }

  /**
   * 캐시 통계
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// 싱글톤 인스턴스
export const apiCache = new ApiCache();

// 캐시 키 생성 헬퍼
export const cacheKeys = {
  trending: (type: string) => `trending:${type}`,
  topN: (type: string, count: number) => `topN:${type}:${count}`,
  briefings: (page: number, limit: number) => `briefings:${page}:${limit}`,
  briefingByDate: (date: string) => `briefing:${date}`,
  stockChart: (ticker: string, period: string) => `chart:${ticker}:${period}`,
  stockDetail: (ticker: string) => `stock:${ticker}`,
};

// TTL 상수 (밀리초)
export const cacheTTL = {
  trending: 3 * 60 * 1000, // 3분
  topN: 3 * 60 * 1000, // 3분
  briefings: 5 * 60 * 1000, // 5분
  chart: 3 * 60 * 1000, // 3분
  stockDetail: 3 * 60 * 1000, // 3분
};
