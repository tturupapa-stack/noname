'use client';

import { useEffect, useRef } from 'react';
import { Briefing } from '@/types';
import Link from 'next/link';
import { formatDateKey } from '@/utils/calendarUtils';

interface BriefingListPanelProps {
  date: Date;
  briefings: Briefing[];
  onClose: () => void;
}

export default function BriefingListPanel({
  date,
  briefings,
  onClose,
}: BriefingListPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const dateString = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm modal-backdrop"
      style={{ zIndex: 'var(--z-modal-backdrop)' }}
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-2xl max-h-[80vh] bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col modal-content"
        style={{ zIndex: 'var(--z-modal)' }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {dateString}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {briefings.length}개의 브리핑
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="닫기"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 브리핑 목록 */}
        <div className="flex-1 overflow-y-auto p-6">
          {briefings.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              이 날짜에는 브리핑이 없습니다
            </div>
          ) : (
            <div className="space-y-4">
              {briefings.map((briefing) => (
                <Link
                  key={briefing.briefingId}
                  href={`/briefing/${briefing.briefingId}`}
                  className="block p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {briefing.symbol}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          briefing.status === 'completed'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : briefing.status === 'processing'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}
                      >
                        {briefing.status === 'completed'
                          ? '완료'
                          : briefing.status === 'processing'
                            ? '처리 중'
                            : '실패'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(briefing.createdAt).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {briefing.textSummary.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {briefing.textSummary.summary}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{briefing.textSummary.keyPoints.length}개 핵심 포인트</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t border-gray-300 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

