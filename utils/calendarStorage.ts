import { CalendarSettings } from '@/types';

const CALENDAR_SETTINGS_KEY = 'calendar_settings';

export function getCalendarSettings(): CalendarSettings {
  if (typeof window === 'undefined') {
    return {
      viewMode: 'month',
      weekStartDay: 'sunday',
    };
  }
  
  try {
    const stored = localStorage.getItem(CALENDAR_SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 타입 검증: 필수 필드 존재 여부 확인
      if (parsed && typeof parsed === 'object' && 'viewMode' in parsed && 'weekStartDay' in parsed) {
        return parsed as CalendarSettings;
      }
    }
  } catch (error) {
    console.error('Failed to load calendar settings:', error);
  }
  
  return {
    viewMode: 'month',
    weekStartDay: 'sunday',
  };
}

export function saveCalendarSettings(settings: CalendarSettings): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CALENDAR_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save calendar settings:', error);
  }
}

