// 저장된 AI 브리핑 관리 서비스 (localStorage 기반)

import { AIBriefingData } from '@/components/AIBriefingModal';

const STORAGE_KEY = 'wyws_saved_briefings';

export interface SavedBriefing {
  id: string;
  briefingData: AIBriefingData;
  savedAt: string;
  note?: string;
}

// 저장된 브리핑 목록 가져오기
export function getSavedBriefings(): SavedBriefing[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// 브리핑 저장
export function saveBriefing(briefingData: AIBriefingData, note?: string): SavedBriefing {
  const briefings = getSavedBriefings();

  const newBriefing: SavedBriefing = {
    id: `${briefingData.meta.symbol}_${Date.now()}`,
    briefingData,
    savedAt: new Date().toISOString(),
    note,
  };

  // 최신 것이 앞에 오도록
  briefings.unshift(newBriefing);

  // 최대 50개까지만 저장
  const trimmed = briefings.slice(0, 50);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

  return newBriefing;
}

// 브리핑 삭제
export function deleteBriefing(id: string): boolean {
  const briefings = getSavedBriefings();
  const filtered = briefings.filter(b => b.id !== id);

  if (filtered.length === briefings.length) {
    return false; // 삭제할 항목 없음
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// 브리핑 가져오기
export function getBriefingById(id: string): SavedBriefing | null {
  const briefings = getSavedBriefings();
  return briefings.find(b => b.id === id) || null;
}

// 특정 종목의 브리핑 가져오기
export function getBriefingsBySymbol(symbol: string): SavedBriefing[] {
  const briefings = getSavedBriefings();
  return briefings.filter(b => b.briefingData.meta.symbol === symbol);
}

// 전체 삭제
export function clearAllBriefings(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// 저장 개수
export function getSavedCount(): number {
  return getSavedBriefings().length;
}
