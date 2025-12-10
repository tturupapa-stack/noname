import { Stock } from '@/types';

/**
 * 한글 초성 추출
 */
function getInitials(text: string): string {
  const initialConsonants = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
  ];
  
  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 0xac00 && code <= 0xd7a3) {
        // 한글인 경우
        const initialIndex = Math.floor((code - 0xac00) / 588);
        return initialConsonants[initialIndex];
      }
      return char.toLowerCase();
    })
    .join('');
}

/**
 * 텍스트 하이라이트 (매칭된 부분 강조)
 */
export function highlightText(text: string, query: string): string {
  if (!query) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900/50 font-semibold">$1</mark>');
}

/**
 * 종목 검색 (초성 검색, 부분 일치 지원)
 */
export function searchStocks(stocks: Stock[], query: string, maxResults: number = 8): Stock[] {
  if (!query || query.length < 1) return [];
  
  const lowerQuery = query.toLowerCase();
  const queryInitials = getInitials(query);
  
  const results: Array<{ stock: Stock; score: number }> = [];
  
  stocks.forEach((stock) => {
    let score = 0;
    const symbol = stock.symbol.toLowerCase();
    const name = stock.shortName.toLowerCase();
    const nameInitials = getInitials(stock.shortName);
    
    // 정확한 일치 (높은 점수)
    if (symbol === lowerQuery || name === lowerQuery) {
      score += 1000;
    }
    // 심볼로 시작
    else if (symbol.startsWith(lowerQuery)) {
      score += 500;
    }
    // 이름으로 시작
    else if (name.startsWith(lowerQuery)) {
      score += 400;
    }
    // 심볼 포함
    else if (symbol.includes(lowerQuery)) {
      score += 300;
    }
    // 이름 포함
    else if (name.includes(lowerQuery)) {
      score += 200;
    }
    // 초성 일치
    else if (nameInitials.includes(queryInitials)) {
      score += 100;
    }
    
    if (score > 0) {
      results.push({ stock, score });
    }
  });
  
  // 점수 순으로 정렬하고 최대 개수만큼 반환
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((item) => item.stock);
}

/**
 * 검색어 정규화 (대소문자 구분 없음, 공백 제거)
 */
export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

