'use client';

import { useState, useEffect, useMemo } from 'react';
import { Briefing, CalendarViewMode, WeekStartDay } from '@/types';
import {
  getCalendarDays,
  getWeekDays,
  formatDateKey,
  parseDateKey,
  isToday,
  isSameMonth,
  isSameDay,
  isSameWeek,
  getMonthName,
  getWeekdayNames,
  groupBriefingsByDate,
  getBriefingCountForDate,
} from '@/utils/calendarUtils';
import {
  getCalendarSettings,
  saveCalendarSettings,
} from '@/utils/calendarStorage';
import BriefingListPanel from './BriefingListPanel';
import CalendarFilters from './CalendarFilters';

interface BriefingCalendarProps {
  briefings: Briefing[];
}

export default function BriefingCalendar({ briefings }: BriefingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [weekStartDay, setWeekStartDay] = useState<WeekStartDay>('sunday');
  const [filters, setFilters] = useState<{ categories?: string[]; keyword?: string }>({});
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // 로컬 스토리지에서 설정 불러오기
  useEffect(() => {
    const settings = getCalendarSettings();
    setViewMode(settings.viewMode);
    setWeekStartDay(settings.weekStartDay);
    if (settings.lastViewedDate) {
      setCurrentDate(new Date(settings.lastViewedDate));
    }
    if (settings.filters) {
      setFilters(settings.filters);
    }
  }, []);

  // 설정 저장
  useEffect(() => {
    saveCalendarSettings({
      viewMode,
      weekStartDay,
      lastViewedDate: currentDate.toISOString(),
      filters,
    });
  }, [viewMode, weekStartDay, currentDate, filters]);

  // 브리핑 데이터 그룹화
  const briefingsByDate = useMemo(() => {
    let filtered = briefings;

    // 키워드 필터
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.textSummary.title.toLowerCase().includes(keyword) ||
          b.textSummary.summary.toLowerCase().includes(keyword) ||
          b.symbol.toLowerCase().includes(keyword)
      );
    }

    // 카테고리 필터 (현재는 심볼 기반, 추후 확장 가능)
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter((b) => filters.categories!.includes(b.symbol));
    }

    return groupBriefingsByDate(filtered);
  }, [briefings, filters]);

  // 현재 달의 날짜들 (월간 뷰) 또는 주간 날짜들 (주간 뷰)
  const calendarDays = useMemo(() => {
    if (viewMode === 'week') {
      return getWeekDays(currentDate, weekStartDay);
    }
    return getCalendarDays(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      weekStartDay
    );
  }, [currentDate, weekStartDay, viewMode]);

  const handleDateClick = (date: Date) => {
    if (!isSameMonth(date, currentDate)) {
      setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
    }
    setSelectedDate(date);
    setIsPanelOpen(true);
  };

  const handlePrevMonth = () => {
    if (viewMode === 'week') {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(currentDate.getDate() - 7);
      setCurrentDate(prevWeek);
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const handleNextMonth = () => {
    if (viewMode === 'week') {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(currentDate.getDate() + 7);
      setCurrentDate(nextWeek);
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleViewModeChange = (mode: CalendarViewMode) => {
    setViewMode(mode);
  };

  const handleWeekStartDayChange = (day: WeekStartDay) => {
    setWeekStartDay(day);
  };

  const handleFilterChange = (newFilters: { categories?: string[]; keyword?: string }) => {
    setFilters(newFilters);
  };

  const handleFilterReset = () => {
    setFilters({});
  };

  const selectedBriefings = selectedDate
    ? briefingsByDate.get(formatDateKey(selectedDate)) || []
    : [];

  if (viewMode === 'list') {
    // 리스트 뷰
    const sortedBriefings = [...briefings].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">브리핑 목록</h2>
          <div className="flex items-center gap-2">
            <CalendarFilters
              briefings={briefings}
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleFilterReset}
            />
            <button
              onClick={() => handleViewModeChange('month')}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              달력 보기
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {sortedBriefings.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              브리핑이 없습니다
            </div>
          ) : (
            sortedBriefings.map((briefing) => (
              <div
                key={briefing.briefingId}
                className="p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => {
                  setSelectedDate(parseDateKey(briefing.date));
                  setIsPanelOpen(true);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {briefing.symbol}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(briefing.date).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {briefing.textSummary.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {briefing.textSummary.summary}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {viewMode === 'week' 
              ? `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일 주`
              : getMonthName(currentDate.getFullYear(), currentDate.getMonth())
            }
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={viewMode === 'week' ? '이전 주' : '이전 달'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleToday}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
            >
              오늘
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={viewMode === 'week' ? '다음 주' : '다음 달'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CalendarFilters
            briefings={briefings}
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleFilterReset}
          />
          <select
            value={viewMode}
            onChange={(e) => handleViewModeChange(e.target.value as CalendarViewMode)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            <option value="month">월간</option>
            <option value="week">주간</option>
            <option value="list">목록</option>
          </select>
        </div>
      </div>

      {/* 달력 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 p-4">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {getWeekdayNames(weekStartDay).map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const dateKey = formatDateKey(date);
            const isCurrentMonth = viewMode === 'week' ? true : isSameMonth(date, currentDate);
            const isCurrentWeek = viewMode === 'week' ? isSameWeek(date, currentDate, weekStartDay) : true;
            const isTodayDate = isToday(date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const briefingCount = getBriefingCountForDate(briefingsByDate, date);

            return (
              <button
                key={`${dateKey}-${index}`}
                onClick={() => handleDateClick(date)}
                className={`
                  relative p-2 rounded-lg text-sm transition-colors
                  ${viewMode === 'week' ? 'min-h-[80px]' : ''}
                  ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white'}
                  ${viewMode === 'week' && !isCurrentWeek ? 'opacity-50' : ''}
                  ${isTodayDate ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
                  ${isSelected ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
                  ${isCurrentMonth && isCurrentWeek ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : ''}
                `}
                aria-label={`${dateKey} ${briefingCount > 0 ? `${briefingCount}개 브리핑` : ''}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="font-medium">{date.getDate()}</span>
                  {briefingCount > 0 && (
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`
                          w-1.5 h-1.5 rounded-full
                          ${briefingCount === 1 ? 'bg-blue-500' : 'bg-green-500'}
                        `}
                        title={`${briefingCount}개 브리핑`}
                      />
                      {briefingCount > 1 && (
                        <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {briefingCount}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 브리핑 목록 패널 */}
      {isPanelOpen && selectedDate && (
        <BriefingListPanel
          date={selectedDate}
          briefings={selectedBriefings}
          onClose={() => setIsPanelOpen(false)}
        />
      )}
    </div>
  );
}

