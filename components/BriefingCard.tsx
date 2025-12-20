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
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }).toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--success)] text-white text-[10px] font-bold uppercase tracking-wider">
            Done
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--warning)] text-white text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Processing
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--danger)] text-white text-[10px] font-bold uppercase tracking-wider">
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--foreground-muted)] text-white text-[10px] font-bold uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  return (
    <div
      className="group relative border-2 border-[var(--border)] hover:border-[var(--foreground)] transition-all animate-fade-in-up overflow-hidden"
      style={{ animationDelay: `${index * 0.05}s`, opacity: 0 }}
    >
      {/* Top Line Animation */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--foreground)] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

      {/* Share Button */}
      <div
        className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <ShareButton briefing={briefing} variant="icon" size="sm" />
      </div>

      <Link href={`/briefing/${briefing.briefingId}`}>
        <div className="p-5 cursor-pointer">
          {/* Header: Date Block + Symbol */}
          <div className="flex items-start gap-4 mb-4">
            {/* Date Block - Musinsa Calendar Style */}
            <div className="flex-shrink-0 w-14 border border-[var(--border)] text-center">
              <div className="bg-[var(--foreground)] text-[var(--background)] text-[10px] font-bold py-0.5 uppercase tracking-wider">
                {formatDate(briefing.date).split(' ')[0]}
              </div>
              <div className="text-2xl font-black py-1 text-[var(--foreground)]">
                {formatDate(briefing.date).split(' ')[1]}
              </div>
            </div>

            {/* Symbol & Status */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-black text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                  {briefing.symbol}
                </h3>
                {getStatusBadge(briefing.status)}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">
                Market Briefing
              </p>
            </div>
          </div>

          {/* Title */}
          <h4 className="font-bold text-base text-[var(--foreground)] mb-2 line-clamp-2 leading-snug">
            {briefing.textSummary.title}
          </h4>

          {/* Summary */}
          <p className="text-sm text-[var(--foreground-secondary)] line-clamp-2 leading-relaxed mb-4">
            {briefing.textSummary.summary}
          </p>

          {/* Footer: Key Points Count */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[var(--foreground)] flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-[var(--background)]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wide">
                {briefing.textSummary.keyPoints.length} Key Points
              </span>
            </div>
            <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wide group-hover:translate-x-1 transition-transform">
              Read More
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default memo(BriefingCard);
