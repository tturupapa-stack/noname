'use client';

import { memo } from 'react';
import { SelectionCriteria } from '@/types';

interface SelectionCriteriaCardProps {
  criteria: SelectionCriteria;
  stockSymbol: string;
}

function SelectionCriteriaCard({
  criteria,
  stockSymbol,
}: SelectionCriteriaCardProps) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'volume':
        return 'VOLUME';
      case 'gain':
        return 'GAIN';
      case 'composite':
        return 'COMPOSITE';
      default:
        return type.toUpperCase();
    }
  };

  return (
    <div className="group border-2 border-[var(--border)] hover:border-[var(--foreground)] transition-all h-full relative isolate overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-[var(--border)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-1">
              Selection Criteria
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl sm:text-2xl font-black text-[var(--foreground)]">
                {getTypeLabel(criteria.type)}
              </span>
              <span className="inline-flex items-center justify-center w-8 h-8 bg-[var(--foreground)] text-[var(--background)] font-black text-sm">
                #{criteria.rank}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-1">
              Symbol
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
              {stockSymbol}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="p-5 sm:p-6">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-3">
          Why This Stock?
        </div>
        <p className="text-sm sm:text-base text-[var(--foreground-secondary)] leading-relaxed">
          {criteria.description}
        </p>

        {/* Visual Indicator */}
        <div className="mt-6 pt-6 border-t border-[var(--border)]">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">
                  Ranking Position
                </span>
                <span className="text-sm font-bold text-[var(--foreground)]">
                  Top {criteria.rank}
                </span>
              </div>
              <div className="h-1 bg-[var(--border)] overflow-hidden">
                <div
                  className="h-full bg-[var(--foreground)] transition-all duration-1000"
                  style={{ width: `${Math.max(100 - (criteria.rank - 1) * 20, 20)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(SelectionCriteriaCard);
