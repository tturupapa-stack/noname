import { Briefing } from '@/types';
import { toPng, toJpeg } from 'html-to-image';

export interface ShareImageOptions {
  width?: number;
  height?: number;
  quality?: number;
}

/**
 * 웹폰트 로딩 대기
 */
async function waitForFonts(): Promise<void> {
  if (typeof document === 'undefined') return;
  
  try {
    // 시스템 폰트 사용 시 대기 불필요
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    // 추가 대기 시간 (폰트 렌더링 완료 보장)
    await new Promise((resolve) => setTimeout(resolve, 100));
  } catch (error) {
    console.warn('Font loading check failed:', error);
  }
}

/**
 * 브리핑 이미지 생성
 */
export async function generateBriefingImage(
  briefing: Briefing,
  options: ShareImageOptions = {}
): Promise<string> {
  const { width = 1080, height = 1080, quality = 0.9 } = options;

  // 웹폰트 로딩 대기
  await waitForFonts();

  // 이미지 생성용 HTML 요소 생성
  const container = document.createElement('div');
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  container.style.padding = '60px';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.justifyContent = 'space-between';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  container.style.color = '#ffffff';

  // 제목
  const titleDiv = document.createElement('div');
  titleDiv.style.fontSize = '48px';
  titleDiv.style.fontWeight = 'bold';
  titleDiv.style.marginBottom = '30px';
  titleDiv.style.lineHeight = '1.2';
  titleDiv.textContent = briefing.textSummary.title;
  container.appendChild(titleDiv);

  // 요약
  const summaryDiv = document.createElement('div');
  summaryDiv.style.fontSize = '28px';
  summaryDiv.style.opacity = '0.9';
  summaryDiv.style.lineHeight = '1.6';
  summaryDiv.style.marginBottom = '40px';
  summaryDiv.style.maxHeight = '200px';
  summaryDiv.style.overflow = 'hidden';
  summaryDiv.textContent = briefing.textSummary.summary;
  container.appendChild(summaryDiv);

  // 핵심 포인트
  if (briefing.textSummary.keyPoints.length > 0) {
    const keyPointsDiv = document.createElement('div');
    keyPointsDiv.style.marginBottom = '40px';
    
    briefing.textSummary.keyPoints.slice(0, 3).forEach((point) => {
      const pointDiv = document.createElement('div');
      pointDiv.style.fontSize = '24px';
      pointDiv.style.opacity = '0.85';
      pointDiv.style.marginBottom = '15px';
      pointDiv.style.paddingLeft = '30px';
      pointDiv.style.position = 'relative';
      pointDiv.textContent = `• ${point}`;
      keyPointsDiv.appendChild(pointDiv);
    });
    
    container.appendChild(keyPointsDiv);
  }

  // 하단 정보
  const footerDiv = document.createElement('div');
  footerDiv.style.display = 'flex';
  footerDiv.style.justifyContent = 'space-between';
  footerDiv.style.alignItems = 'flex-end';
  footerDiv.style.marginTop = 'auto';

  // 날짜
  const dateDiv = document.createElement('div');
  dateDiv.style.fontSize = '20px';
  dateDiv.style.opacity = '0.7';
  const date = new Date(briefing.date);
  dateDiv.textContent = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  footerDiv.appendChild(dateDiv);

  // 워터마크
  const watermarkDiv = document.createElement('div');
  watermarkDiv.style.fontSize = '18px';
  watermarkDiv.style.opacity = '0.5';
  watermarkDiv.textContent = '당신이 잠든 사이 | 오전 7시 브리핑';
  footerDiv.appendChild(watermarkDiv);

  container.appendChild(footerDiv);

  // DOM에 추가
  document.body.appendChild(container);

  try {
    // 이미지 생성
    const dataUrl = await toPng(container, {
      width,
      height,
      quality,
      pixelRatio: 2,
    });

    return dataUrl;
  } finally {
    // DOM에서 제거
    document.body.removeChild(container);
  }
}

/**
 * 텍스트 공유용 메시지 생성
 */
export function generateShareText(briefing: Briefing): string {
  const date = new Date(briefing.date);
  const dateStr = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `오늘의 브리핑: ${briefing.textSummary.title}\n\n${briefing.textSummary.summary}\n\n${dateStr}\n\nvia 당신이 잠든 사이`;
}

/**
 * 클립보드에 텍스트 복사
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * 이미지 다운로드
 */
export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 네이티브 공유 API 사용 가능 여부 확인
 */
export function isNativeShareSupported(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

/**
 * 네이티브 공유
 */
export async function nativeShare(
  title: string,
  text: string,
  url?: string
): Promise<boolean> {
  if (!isNativeShareSupported()) {
    return false;
  }

  try {
    const shareData: ShareData = {
      title,
      text,
      ...(url && { url }),
    };

    await navigator.share(shareData);
    return true;
  } catch (error: unknown) {
    // 사용자가 공유를 취소한 경우
    const err = error instanceof Error ? error : new Error('Unknown error');
    if (err.name === 'AbortError') {
      return false;
    }
    console.error('Failed to share:', error);
    return false;
  }
}

