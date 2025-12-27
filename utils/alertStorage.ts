import { AlertSettings, AlertHistory } from '@/types';
import { safeGetStorage, safeSetStorage } from './storage';
import { logger } from './logger';

const ALERT_STORAGE_KEY = 'stock_alerts';
const ALERT_HISTORY_KEY = 'alert_history';
const FAVORITE_STOCKS_KEY = 'favorite_stocks';
const RECENT_SEARCHES_KEY = 'recent_searches';

export interface StorageOperationResult {
  success: boolean;
  error?: string;
}

export function getAlerts(): AlertSettings[] {
  const result = safeGetStorage<AlertSettings[]>(ALERT_STORAGE_KEY, []);
  return result.data ?? [];
}

export function saveAlert(alert: AlertSettings): StorageOperationResult {
  try {
    const alerts = getAlerts();
    const index = alerts.findIndex((a) => a.id === alert.id);
    if (index >= 0) {
      alerts[index] = alert;
    } else {
      alerts.push(alert);
    }
    const result = safeSetStorage(ALERT_STORAGE_KEY, alerts);
    return { success: result.success, error: result.error };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to save alert:', message);
    return { success: false, error: message };
  }
}

export function deleteAlert(alertId: string): StorageOperationResult {
  try {
    const alerts = getAlerts().filter((a) => a.id !== alertId);
    const result = safeSetStorage(ALERT_STORAGE_KEY, alerts);
    return { success: result.success, error: result.error };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to delete alert:', message);
    return { success: false, error: message };
  }
}

export function toggleAlert(alertId: string): StorageOperationResult {
  try {
    const alerts = getAlerts();
    const alert = alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.enabled = !alert.enabled;
      const result = safeSetStorage(ALERT_STORAGE_KEY, alerts);
      return { success: result.success, error: result.error };
    }
    return { success: false, error: 'Alert not found' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to toggle alert:', message);
    return { success: false, error: message };
  }
}

export function getAlertHistory(): AlertHistory[] {
  const result = safeGetStorage<AlertHistory[]>(ALERT_HISTORY_KEY, []);
  const history = result.data ?? [];
  // 최근 10개만 반환
  return history.slice(-10).reverse();
}

export function addAlertHistory(history: AlertHistory): StorageOperationResult {
  try {
    const existing = getAlertHistory().reverse();
    existing.push(history);
    // 최대 10개만 저장
    const limited = existing.slice(-10);
    const result = safeSetStorage(ALERT_HISTORY_KEY, limited);
    return { success: result.success, error: result.error };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to save alert history:', message);
    return { success: false, error: message };
  }
}

export function getFavoriteStocks(): string[] {
  const result = safeGetStorage<string[]>(FAVORITE_STOCKS_KEY, []);
  return result.data ?? [];
}

export function toggleFavoriteStock(symbol: string): StorageOperationResult {
  try {
    const favorites = getFavoriteStocks();
    const index = favorites.indexOf(symbol);
    if (index >= 0) {
      favorites.splice(index, 1);
    } else {
      favorites.push(symbol);
    }
    const result = safeSetStorage(FAVORITE_STOCKS_KEY, favorites);
    return { success: result.success, error: result.error };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to toggle favorite stock:', message);
    return { success: false, error: message };
  }
}

export function getRecentSearches(): string[] {
  const result = safeGetStorage<string[]>(RECENT_SEARCHES_KEY, []);
  return result.data ?? [];
}

export function addRecentSearch(symbol: string): StorageOperationResult {
  try {
    const recent = getRecentSearches();
    const index = recent.indexOf(symbol);
    if (index >= 0) {
      recent.splice(index, 1);
    }
    recent.unshift(symbol);
    // 최대 5개만 저장
    const limited = recent.slice(0, 5);
    const result = safeSetStorage(RECENT_SEARCHES_KEY, limited);
    return { success: result.success, error: result.error };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to save recent search:', message);
    return { success: false, error: message };
  }
}

