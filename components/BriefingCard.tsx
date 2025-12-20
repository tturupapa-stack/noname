'use client';

import { memo } from 'react';
import { Briefing } from '@/types';
import Link from 'next/link';
import ShareButton from './ShareButton';

interface BriefingCardProps {
  briefing: Briefing;
  index?: number;
}

function BriefingCard({ briefing, index = 0 }: BriefingCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'processing':
        return 'bg-[var(--warning-light)] text-amber-600 dark:bg-[rgba(245,158,11,0.15)] dark:text-amber-400';
      case 'failed':
        return 'badge-danger';
      default:
        return 'bg-[var(--background-secondary)] text-[var(--foreground-muted)]';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return '완료';
      case 'processing':
        return '처리 중';
      case 'failed':
        return '실패';
      default:
        return status;
    }
  };

  return (
    <div
      className="card-dawn transition-smooth hover-lift animate-fade-in-up"
      style={{ animationDelay: `${index * 0.05}s`, opacity: 0 }}
    >
      {/* 공유 버튼 */}
      <div
        className="absolute top-3 right-3 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <ShareButton briefing={briefing} variant="icon" size="sm" />
      </div>

      <Link href={`/briefing/${briefing.briefingId}`}>
        <div className="p-4 sm:p-5 cursor-pointer">
          {/* 상단: 심볼 + 날짜 + 상태 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold text-[var(--foreground)]">{briefing.symbol}</span>
              <span className="text-xs text-[var(--foreground-muted)]">{formatDate(briefing.date)}</span>
            </div>
            <span className={`badge ${getStatusStyles(briefing.status)}`}>
              {getStatusLabel(briefing.status)}
            </span>
          </div>

          {/* 제목 */}
          <h4 className="font-semibold text-sm sm:text-base text-[var(--foreground)] mb-2 line-clamp-2 leading-snug">
            {briefing.textSummary.title}
          </h4>

          {/* 요약 */}
          <p className="text-sm text-[var(--foreground-muted)] line-clamp-2 leading-relaxed">
            {briefing.textSummary.summary}
          </p>

          {/* 하단: 핵심 포인트 개수 */}
          <div className="flex items-center gap-1.5 mt-3 sm:mt-4 text-xs text-[var(--foreground-muted)]">
            <svg className="w-3.5 h-3.5 text-[var(--primary-500)]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>
              {briefing.textSummary.keyPoints.length}개 핵심 포인트
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default memo(BriefingCard);
