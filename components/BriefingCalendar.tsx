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
        {/* List View Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bebas text-3xl tracking-wide text-[var(--foreground)]">
            BRIEFING LIST
          </h2>
          <div className="flex items-center gap-3">
            <CalendarFilters
              briefings={briefings}
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleFilterReset}
            />
            <button
              onClick={() => handleViewModeChange('month')}
              className="btn btn-secondary btn-sm"
            >
              CALENDAR
            </button>
          </div>
        </div>

        {/* List Items */}
        <div className="space-y-3">
          {sortedBriefings.length === 0 ? (
            <div className="border-2 border-dashed border-[var(--border)] p-12 text-center">
              <p className="text-[var(--foreground-muted)] text-sm font-bold uppercase tracking-wide">
                No Briefings Available
              </p>
            </div>
          ) : (
            sortedBriefings.map((briefing) => (
              <div
                key={briefing.briefingId}
                className="border-2 border-[var(--border)] bg-[var(--card-bg)] p-5 cursor-pointer transition-all hover:border-[var(--foreground)]"
                onClick={() => {
                  setSelectedDate(parseDateKey(briefing.date));
                  setIsPanelOpen(true);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="badge badge-primary">
                        {briefing.symbol}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wide text-[var(--foreground-muted)]">
                        {new Date(briefing.date).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <h3 className="font-bold text-[var(--foreground)] mb-2">
                      {briefing.textSummary.title}
                    </h3>
                    <p className="text-sm text-[var(--foreground-secondary)] line-clamp-2">
                      {briefing.textSummary.summary}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-[var(--foreground-muted)] flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
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
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          {/* Month/Year Title */}
          <h2 className="font-bebas text-3xl sm:text-4xl tracking-wide text-[var(--foreground)]">
            {viewMode === 'week'
              ? `${currentDate.getFullYear()}.${String(currentDate.getMonth() + 1).padStart(2, '0')}`
              : getMonthName(currentDate.getFullYear(), currentDate.getMonth()).toUpperCase().replace('년 ', '.').replace('월', '')
            }
          </h2>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="w-10 h-10 flex items-center justify-center border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all"
              aria-label={viewMode === 'week' ? '이전 주' : '이전 달'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleToday}
              className="h-10 px-4 text-xs font-bold uppercase tracking-wide border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="w-10 h-10 flex items-center justify-center border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all"
              aria-label={viewMode === 'week' ? '다음 주' : '다음 달'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* View Mode & Filters */}
        <div className="flex items-center gap-3">
          <CalendarFilters
            briefings={briefings}
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleFilterReset}
          />
          <select
            value={viewMode}
            onChange={(e) => handleViewModeChange(e.target.value as CalendarViewMode)}
            className="h-10 px-4 text-xs font-bold uppercase tracking-wide border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] cursor-pointer appearance-none bg-no-repeat select"
            style={{ paddingRight: '2.5rem' }}
          >
            <option value="month">MONTH</option>
            <option value="week">WEEK</option>
            <option value="list">LIST</option>
          </select>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border-2 border-[var(--foreground)] bg-[var(--card-bg)]">
        {/* Weekday Header */}
        <div className="grid grid-cols-7 border-b-2 border-[var(--foreground)]">
          {getWeekdayNames(weekStartDay).map((day, index) => (
            <div
              key={day}
              className={`
                text-center text-xs font-bold uppercase tracking-wider py-3
                text-[var(--foreground)]
                ${index < 6 ? 'border-r border-[var(--border)]' : ''}
              `}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Date Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            const dateKey = formatDateKey(date);
            const isCurrentMonth = viewMode === 'week' ? true : isSameMonth(date, currentDate);
            const isCurrentWeek = viewMode === 'week' ? isSameWeek(date, currentDate, weekStartDay) : true;
            const isTodayDate = isToday(date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const briefingCount = getBriefingCountForDate(briefingsByDate, date);
            const rowIndex = Math.floor(index / 7);
            const isLastRow = rowIndex === Math.floor((calendarDays.length - 1) / 7);

            return (
              <button
                key={`${dateKey}-${index}`}
                onClick={() => handleDateClick(date)}
                className={`
                  relative text-sm transition-all
                  ${viewMode === 'week' ? 'min-h-[100px]' : 'min-h-[72px] sm:min-h-[80px]'}
                  ${index % 7 < 6 ? 'border-r border-[var(--border)]' : ''}
                  ${!isLastRow ? 'border-b border-[var(--border)]' : ''}
                  ${!isCurrentMonth ? 'text-[var(--foreground-muted)] bg-[var(--background-secondary)]' : 'text-[var(--foreground)] bg-[var(--card-bg)]'}
                  ${viewMode === 'week' && !isCurrentWeek ? 'opacity-50' : ''}
                  ${isTodayDate ? 'bg-[var(--foreground)] text-[var(--background)]' : ''}
                  ${isSelected && !isTodayDate ? 'bg-[var(--accent-light)]' : ''}
                  ${isCurrentMonth && isCurrentWeek && !isTodayDate ? 'hover:bg-[var(--background-tertiary)]' : ''}
                `}
                aria-label={`${dateKey} ${briefingCount > 0 ? `${briefingCount}개 브리핑` : ''}`}
              >
                <div className="flex flex-col items-center justify-start h-full pt-2 gap-1">
                  {/* Date Number */}
                  <span className={`
                    font-bold text-base
                    ${isTodayDate ? 'text-[var(--background)]' : ''}
                  `}>
                    {date.getDate()}
                  </span>

                  {/* Briefing Indicator */}
                  {briefingCount > 0 && (
                    <div className="flex flex-col items-center gap-1">
                      {briefingCount === 1 ? (
                        <span
                          className={`w-2 h-2 ${isTodayDate ? 'bg-[var(--background)]' : 'bg-[var(--accent)]'}`}
                          title="1 briefing"
                        />
                      ) : (
                        <span className={`
                          text-[10px] font-black min-w-[18px] h-[18px] flex items-center justify-center
                          ${isTodayDate ? 'bg-[var(--background)] text-[var(--foreground)]' : 'bg-[var(--accent)] text-white'}
                        `}>
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

      {/* Briefing List Panel */}
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

