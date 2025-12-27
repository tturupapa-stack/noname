import { FavoriteStock, FavoriteData, FavoriteSortBy, FavoriteSettings } from '@/types';
import { safeGetStorage, safeSetStorage } from './storage';
import { logger } from './logger';

const FAVORITE_STORAGE_KEY = 'favorite_stocks_data';
const DEFAULT_MAX_ITEMS = 50;
const DEFAULT_SETTINGS: FavoriteSettings = {
  sortBy: 'order',
  maxItems: DEFAULT_MAX_ITEMS,
};
const DEFAULT_DATA: FavoriteData = { favorites: [], settings: DEFAULT_SETTINGS };

/**
 * 로컬스토리지에서 즐겨찾기 데이터 불러오기
 */
export function getFavoriteData(): FavoriteData {
  const result = safeGetStorage<FavoriteData>(FAVORITE_STORAGE_KEY, DEFAULT_DATA);
  const data = result.data ?? DEFAULT_DATA;
  
  // 설정이 없으면 기본값 사용
  if (!data.settings) {
    data.settings = DEFAULT_SETTINGS;
  }
  
  return data;
}

/**
 * 즐겨찾기 데이터 저장
 */
export function saveFavoriteData(data: FavoriteData): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const json = JSON.stringify(data);
    localStorage.setItem(FAVORITE_STORAGE_KEY, json);
    return true;
  } catch (error: unknown) {
    // 용량 초과 시 경고
    const err = error instanceof Error ? error : new Error('Unknown error');
    if (err.name === 'QuotaExceededError') {
      logger.warn('LocalStorage quota exceeded. Trying sessionStorage...');
      try {
        sessionStorage.setItem(FAVORITE_STORAGE_KEY, JSON.stringify(data));
        alert('로컬스토리지 용량이 부족합니다. 세션스토리지에 저장되었습니다.');
        return true;
      } catch (sessionError: unknown) {
        const sessionMessage = sessionError instanceof Error ? sessionError.message : 'Unknown error';
        logger.error('Failed to save to sessionStorage:', sessionMessage);
        alert('저장에 실패했습니다. 데이터를 정리해주세요.');
        return false;
      }
    }
    logger.error('Failed to save favorite data:', error);
    return false;
  }
}

/**
 * 즐겨찾기 목록 가져오기
 */
export function getFavorites(): FavoriteStock[] {
  return getFavoriteData().favorites;
}

/**
 * 즐겨찾기 추가
 */
export function addFavorite(symbol: string, name: string, group: string = '기본'): boolean {
  const data = getFavoriteData();
  const { favorites, settings } = data;

  // 중복 확인
  if (favorites.some((f) => f.id === symbol)) {
    return false;
  }

  // 최대 개수 확인
  if (favorites.length >= settings.maxItems) {
    alert(`최대 ${settings.maxItems}개까지만 등록할 수 있습니다.`);
    return false;
  }

  // 새 즐겨찾기 추가
  const newFavorite: FavoriteStock = {
    id: symbol,
    name,
    addedAt: new Date().toISOString(),
    order: favorites.length + 1,
    group,
  };

  favorites.push(newFavorite);
  return saveFavoriteData({ favorites, settings });
}

/**
 * 즐겨찾기 제거
 */
export function removeFavorite(symbol: string): boolean {
  const data = getFavoriteData();
  const { favorites, settings } = data;

  const index = favorites.findIndex((f) => f.id === symbol);
  if (index === -1) return false;

  favorites.splice(index, 1);
  // order 재정렬
  favorites.forEach((f, i) => {
    f.order = i + 1;
  });

  return saveFavoriteData({ favorites, settings });
}

/**
 * 즐겨찾기 순서 변경
 */
export function reorderFavorites(newOrder: string[]): boolean {
  const data = getFavoriteData();
  const { favorites, settings } = data;

  // 새로운 순서에 맞게 재정렬
  const reordered = newOrder
    .map((symbol) => favorites.find((f) => f.id === symbol))
    .filter((f): f is FavoriteStock => f !== undefined);

  // order 업데이트
  reordered.forEach((f, i) => {
    f.order = i + 1;
  });

  // 나머지 항목도 order 업데이트
  const remaining = favorites.filter((f) => !newOrder.includes(f.id));
  remaining.forEach((f, i) => {
    f.order = reordered.length + i + 1;
  });

  return saveFavoriteData({ favorites: [...reordered, ...remaining], settings });
}

/**
 * 즐겨찾기 그룹 변경
 */
export function changeFavoriteGroup(symbol: string, newGroup: string): boolean {
  const data = getFavoriteData();
  const { favorites, settings } = data;

  const favorite = favorites.find((f) => f.id === symbol);
  if (!favorite) return false;

  favorite.group = newGroup;
  return saveFavoriteData({ favorites, settings });
}

/**
 * 여러 즐겨찾기 일괄 삭제
 */
export function removeFavorites(symbols: string[]): boolean {
  const data = getFavoriteData();
  const { favorites, settings } = data;

  const filtered = favorites.filter((f) => !symbols.includes(f.id));
  
  // order 재정렬
  filtered.forEach((f, i) => {
    f.order = i + 1;
  });

  return saveFavoriteData({ favorites: filtered, settings });
}

/**
 * 설정 업데이트
 */
export function updateFavoriteSettings(settings: Partial<FavoriteSettings>): boolean {
  const data = getFavoriteData();
  const newSettings = { ...data.settings, ...settings };
  return saveFavoriteData({ favorites: data.favorites, settings: newSettings });
}

/**
 * 즐겨찾기인지 확인
 */
export function isFavorite(symbol: string): boolean {
  return getFavorites().some((f) => f.id === symbol);
}

/**
 * 즐겨찾기 개수 가져오기
 */
export function getFavoriteCount(): number {
  return getFavorites().length;
}

/**
 * JSON으로 내보내기
 */
export function exportFavorites(): string {
  const data = getFavoriteData();
  return JSON.stringify(data, null, 2);
}

/**
 * JSON으로 가져오기
 */
export function importFavorites(json: string): boolean {
  try {
    const data: FavoriteData = JSON.parse(json);
    // 유효성 검사
    if (!data.favorites || !Array.isArray(data.favorites)) {
      throw new Error('Invalid data format');
    }
    if (!data.settings) {
      data.settings = DEFAULT_SETTINGS;
    }
    return saveFavoriteData(data);
  } catch (error: unknown) {
    logger.error('Failed to import favorites:', error);
    return false;
  }
}

/**
 * 클립보드에 종목 코드 리스트 복사
 */
export async function copySymbolsToClipboard(): Promise<boolean> {
  const favorites = getFavorites();
  const symbols = favorites.map((f) => f.id).join(', ');

  try {
    await navigator.clipboard.writeText(symbols);
    return true;
  } catch (error: unknown) {
    logger.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * 전체 삭제
 */
export function clearAllFavorites(): boolean {
  const data = getFavoriteData();
  return saveFavoriteData({ favorites: [], settings: data.settings });
}

