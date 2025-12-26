import { Briefing, BriefingByDate } from '@/types';

/**
 * 브리핑 배열을 날짜별로 그룹화
 */
export function groupBriefingsByDate(briefings: Briefing[]): Map<string, Briefing[]> {
  const grouped = new Map<string, Briefing[]>();
  
  briefings.forEach((briefing) => {
    const dateKey = briefing.date; // YYYY-MM-DD 형식
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(briefing);
  });
  
  return grouped;
}

/**
 * 특정 날짜의 브리핑 개수 반환
 */
export function getBriefingCountForDate(
  briefingsByDate: Map<string, Briefing[]>,
  date: Date
): number {
  const dateKey = formatDateKey(date);
  return briefingsByDate.get(dateKey)?.length || 0;
}

/**
 * 특정 날짜의 브리핑 목록 반환
 */
export function getBriefingsForDate(
  briefingsByDate: Map<string, Briefing[]>,
  date: Date
): Briefing[] {
  const dateKey = formatDateKey(date);
  return briefingsByDate.get(dateKey) || [];
}

/**
 * Date 객체를 YYYY-MM-DD 형식의 문자열로 변환
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * YYYY-MM-DD 형식의 문자열을 Date 객체로 변환
 * 로컬 타임존 기준으로 해당 날짜의 자정(00:00:00)을 반환
 *
 * 주의: new Date('YYYY-MM-DD')는 UTC로 파싱되어 타임존에 따라
 * 날짜가 하루 전으로 표시될 수 있음. 명시적으로 로컬 날짜 생성.
 */
export function parseDateKey(dateKey: string): Date {
  // 유효성 검사
  if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    console.warn(`Invalid date format: ${dateKey}, expected YYYY-MM-DD`);
    return new Date(); // 잘못된 형식일 경우 현재 날짜 반환
  }

  const parts = dateKey.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Date 생성자는 0-indexed month
  const day = parseInt(parts[2], 10);

  // 유효한 날짜인지 검증
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date values: ${dateKey}`);
    return new Date();
  }

  return date;
}

/**
 * 달력의 한 달에 해당하는 날짜 배열 생성
 */
export function getCalendarDays(year: number, month: number, weekStartDay: 'sunday' | 'monday' = 'sunday'): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // 첫 주의 시작일 계산
  const startDay = firstDay.getDay(); // 0 (일요일) ~ 6 (토요일)
  const offset = weekStartDay === 'sunday' ? startDay : startDay === 0 ? 6 : startDay - 1;
  
  const days: Date[] = [];
  
  // 이전 달의 마지막 날들 추가
  for (let i = offset - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push(date);
  }
  
  // 현재 달의 날들 추가
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }
  
  // 다음 달의 첫 날들 추가 (총 42일 또는 35일로 맞춤)
  const totalDays = days.length;
  const weeks = Math.ceil(totalDays / 7);
  const remainingDays = weeks * 7 - totalDays;
  
  for (let day = 1; day <= remainingDays; day++) {
    days.push(new Date(year, month + 1, day));
  }
  
  return days;
}

/**
 * 오늘 날짜인지 확인
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * 같은 달인지 확인
 */
export function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

/**
 * 같은 날인지 확인
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * 월 이름 반환 (한국어)
 */
export function getMonthName(year: number, month: number): string {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
}

/**
 * 요일 이름 반환 (한국어)
 */
export function getWeekdayNames(weekStartDay: 'sunday' | 'monday' = 'sunday'): string[] {
  if (weekStartDay === 'sunday') {
    return ['일', '월', '화', '수', '목', '금', '토'];
  } else {
    return ['월', '화', '수', '목', '금', '토', '일'];
  }
}

/**
 * 특정 날짜가 포함된 주의 날짜 배열 반환
 */
export function getWeekDays(date: Date, weekStartDay: 'sunday' | 'monday' = 'sunday'): Date[] {
  const dayOfWeek = date.getDay(); // 0 (일요일) ~ 6 (토요일)
  
  // 주의 시작일까지의 오프셋 계산
  let offset: number;
  if (weekStartDay === 'sunday') {
    offset = dayOfWeek; // 일요일이 시작이면 그대로
  } else {
    // 월요일이 시작이면 일요일(0)을 6으로 변환
    offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  }
  
  const weekDays: Date[] = [];
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - offset);
  
  // 7일 추가
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    weekDays.push(currentDate);
  }
  
  return weekDays;
}

/**
 * 같은 주인지 확인
 */
export function isSameWeek(date1: Date, date2: Date, weekStartDay: 'sunday' | 'monday' = 'sunday'): boolean {
  const week1 = getWeekDays(date1, weekStartDay);
  const week2 = getWeekDays(date2, weekStartDay);
  
  return week1[0].getTime() === week2[0].getTime();
}

