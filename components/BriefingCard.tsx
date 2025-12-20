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
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'processing':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'failed':
        return 'bg-red-500/10 text-red-600 dark:text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
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
      style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}
    >
      {/* 공유 버튼 */}
      <div
        className="absolute top-3 right-3 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <ShareButton briefing={briefing} variant="icon" size="sm" />
      </div>

      <Link href={`/briefing/${briefing.briefingId}`}>
        <div className="p-5 cursor-pointer">
          {/* 상단: 심볼 + 날짜 + 상태 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{briefing.symbol}</span>
              <span className="text-xs opacity-50">{formatDate(briefing.date)}</span>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusStyles(briefing.status)}`}
            >
              {getStatusLabel(briefing.status)}
            </span>
          </div>

          {/* 제목 */}
          <h4 className="font-semibold mb-2 line-clamp-2 leading-snug">
            {briefing.textSummary.title}
          </h4>

          {/* 요약 */}
          <p className="text-sm opacity-60 line-clamp-2 leading-relaxed">
            {briefing.textSummary.summary}
          </p>

          {/* 하단: 핵심 포인트 개수 */}
          <div className="flex items-center gap-1.5 mt-4 text-xs">
            <svg className="w-3.5 h-3.5 text-[#ff7e5f]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="opacity-50">
              {briefing.textSummary.keyPoints.length}개 핵심 포인트
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default memo(BriefingCard);
