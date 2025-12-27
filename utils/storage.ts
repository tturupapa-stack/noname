/**
 * 안전한 로컬스토리지 접근 유틸리티
 */

import { logger } from './logger';

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 로컬스토리지에서 안전하게 데이터 가져오기
 */
export function safeGetStorage<T>(key: string, defaultValue: T): StorageResult<T> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Client-side only', data: defaultValue };
  }
  
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) {
      return { success: true, data: defaultValue };
    }
    const parsed = JSON.parse(stored) as T;
    return { success: true, data: parsed };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to get storage for key "${key}":`, message);
    return { success: false, error: message, data: defaultValue };
  }
}

/**
 * 로컬스토리지에 안전하게 데이터 저장하기
 */
export function safeSetStorage<T>(key: string, value: T): StorageResult<void> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Client-side only' };
  }
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // QuotaExceededError 처리
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      logger.warn(`Storage quota exceeded for key "${key}". Trying sessionStorage...`);
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
        return { success: true };
      } catch (sessionError: unknown) {
        const sessionMessage = sessionError instanceof Error ? sessionError.message : 'Unknown error';
        logger.error(`Failed to save to sessionStorage:`, sessionMessage);
        return { success: false, error: `Storage quota exceeded: ${sessionMessage}` };
      }
    }

    logger.error(`Failed to set storage for key "${key}":`, message);
    return { success: false, error: message };
  }
}

/**
 * 로컬스토리지에서 안전하게 데이터 삭제하기
 */
export function safeRemoveStorage(key: string): StorageResult<void> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Client-side only' };
  }
  
  try {
    localStorage.removeItem(key);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to remove storage for key "${key}":`, message);
    return { success: false, error: message };
  }
}

