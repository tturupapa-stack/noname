'use client';

import { memo } from 'react';
import { Briefing } from '@/types';
import Link from 'next/link';
import ShareButton from './ShareButton';
import AnimatedCard from './AnimatedCard';
import AnimatedNumber from './AnimatedNumber';

interface BriefingCardProps {
  briefing: Briefing;
  index?: number;
}

function BriefingCard({ briefing, index = 0 }: BriefingCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
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
    <AnimatedCard
      direction="up"
      delay={index * 100}
      className="relative rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/50 backdrop-blur-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-900/70 hover:border-gray-400 dark:hover:border-gray-600"
    >
      {/* 공유 버튼 */}
      <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
        <ShareButton briefing={briefing} variant="icon" size="sm" />
      </div>

      <Link href={`/briefing/${briefing.briefingId}`}>
        <div className="p-4 cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 pr-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-bold text-gray-900 dark:text-white">{briefing.symbol}</span>
                <span
                  className={`text-xs px-2 py-1 rounded border ${getStatusColor(
                    briefing.status
                  )}`}
                >
                  {getStatusLabel(briefing.status)}
                </span>
              </div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                {briefing.textSummary.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {briefing.textSummary.summary}
              </p>
            </div>
            {briefing.imageBriefing && (
              <div className="ml-4 flex-shrink-0">
                <div className="w-20 h-20 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">이미지</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{formatDate(briefing.date)}</span>
            <span>
              <AnimatedNumber
                value={briefing.textSummary.keyPoints.length}
                suffix="개 핵심 포인트"
                decimals={0}
                duration={1}
              />
            </span>
          </div>
        </div>
      </Link>
    </AnimatedCard>
  );
}

export default memo(BriefingCard);

