import { Briefing } from '@/types';

export interface ShareHistory {
  briefingId: string;
  sharedAt: string;
  channel: string;
  count: number;
}

const SHARE_HISTORY_KEY = 'share_history';
const MAX_HISTORY_ITEMS = 100;

/**
 * 공유 히스토리 가져오기
 */
export function getShareHistory(): ShareHistory[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(SHARE_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * 공유 히스토리 저장
 */
export function saveShareHistory(briefingId: string, channel: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getShareHistory();
    const existing = history.find((h) => h.briefingId === briefingId && h.channel === channel);
    
    if (existing) {
      existing.count += 1;
      existing.sharedAt = new Date().toISOString();
    } else {
      history.push({
        briefingId,
        sharedAt: new Date().toISOString(),
        channel,
        count: 1,
      });
    }
    
    // 최신순으로 정렬하고 최대 개수 제한
    history.sort((a, b) => new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime());
    const limited = history.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(SHARE_HISTORY_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error('Failed to save share history:', error);
  }
}

/**
 * 브리핑별 공유 횟수 가져오기
 */
export function getShareCount(briefingId: string): number {
  const history = getShareHistory();
  return history
    .filter((h) => h.briefingId === briefingId)
    .reduce((sum, h) => sum + h.count, 0);
}

/**
 * 가장 많이 공유된 브리핑 TOP N 가져오기
 */
export function getTopSharedBriefings(limit: number = 5): Array<{
  briefingId: string;
  totalShares: number;
}> {
  const history = getShareHistory();
  const counts = new Map<string, number>();
  
  history.forEach((h) => {
    const current = counts.get(h.briefingId) || 0;
    counts.set(h.briefingId, current + h.count);
  });
  
  return Array.from(counts.entries())
    .map(([briefingId, totalShares]) => ({ briefingId, totalShares }))
    .sort((a, b) => b.totalShares - a.totalShares)
    .slice(0, limit);
}

