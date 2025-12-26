// 저장된 AI 브리핑 관리 서비스 (localStorage 기반)

import { AIBriefingData } from '@/components/AIBriefingModal';

const STORAGE_KEY = 'wyws_saved_briefings';
const MAX_BRIEFINGS = 50;

export interface SavedBriefing {
  id: string;
  briefingData: AIBriefingData;
  savedAt: string;
  note?: string;
}

// ============================================================
// Private Helpers
// ============================================================

/** localStorage 읽기 (SSR 안전, 에러 처리 포함) */
function readFromStorage(): SavedBriefing[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/** localStorage 쓰기 (에러 처리 포함) */
function writeToStorage(briefings: SavedBriefing[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(briefings));
    return true;
  } catch {
    console.error('Failed to save briefings to localStorage');
    return false;
  }
}

/** 브리핑 목록 수정 후 저장 (공통 패턴 추출) */
function updateBriefings(updater: (briefings: SavedBriefing[]) => SavedBriefing[]): boolean {
  const briefings = readFromStorage();
  const updated = updater(briefings);
  return writeToStorage(updated);
}

// ============================================================
// Public API
// ============================================================

/** 저장된 브리핑 목록 가져오기 */
export function getSavedBriefings(): SavedBriefing[] {
  return readFromStorage();
}

/** 브리핑 저장 */
export function saveBriefing(briefingData: AIBriefingData, note?: string): SavedBriefing {
  const newBriefing: SavedBriefing = {
    id: `${briefingData.meta.symbol}_${Date.now()}`,
    briefingData,
    savedAt: new Date().toISOString(),
    note,
  };

  updateBriefings(briefings => [newBriefing, ...briefings].slice(0, MAX_BRIEFINGS));
  return newBriefing;
}

/** 브리핑 삭제 */
export function deleteBriefing(id: string): boolean {
  const briefings = readFromStorage();
  const filtered = briefings.filter(b => b.id !== id);

  if (filtered.length === briefings.length) return false;
  return writeToStorage(filtered);
}

/** ID로 브리핑 조회 */
export function getBriefingById(id: string): SavedBriefing | null {
  return readFromStorage().find(b => b.id === id) ?? null;
}

/** 특정 종목의 브리핑 목록 조회 */
export function getBriefingsBySymbol(symbol: string): SavedBriefing[] {
  return readFromStorage().filter(b => b.briefingData.meta.symbol === symbol);
}

/** 전체 삭제 */
export function clearAllBriefings(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/** 저장된 브리핑 개수 */
export function getSavedCount(): number {
  return readFromStorage().length;
}
