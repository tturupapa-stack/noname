const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY_ITEMS = 5;

export interface SearchHistoryItem {
  query: string;
  timestamp: string;
}

/**
 * 검색 히스토리 불러오기
 */
export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load search history:', error);
  }
  
  return [];
}

/**
 * 검색 히스토리에 추가
 */
export function addSearchHistory(query: string): void {
  if (typeof window === 'undefined' || !query.trim()) return;
  
  try {
    const history = getSearchHistory();
    const normalizedQuery = query.trim();
    
    // 중복 제거 (기존 항목 삭제)
    const filtered = history.filter((item) => item.query !== normalizedQuery);
    
    // 새 항목 추가
    const newItem: SearchHistoryItem = {
      query: normalizedQuery,
      timestamp: new Date().toISOString(),
    };
    
    // 최신 항목이 앞에 오도록
    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save search history:', error);
  }
}

/**
 * 검색 히스토리에서 항목 삭제
 */
export function removeSearchHistory(query: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getSearchHistory();
    const filtered = history.filter((item) => item.query !== query);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove search history:', error);
  }
}

/**
 * 검색 히스토리 전체 삭제
 */
export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear search history:', error);
  }
}

