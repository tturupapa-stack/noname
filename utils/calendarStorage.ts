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
      return JSON.parse(stored);
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

