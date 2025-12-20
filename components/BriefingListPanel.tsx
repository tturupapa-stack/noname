'use client';

import { useEffect, useRef } from 'react';
import { Briefing } from '@/types';
import Link from 'next/link';

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

  const dateString = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).toUpperCase();

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-[var(--color-black)]/60 modal-backdrop"
      style={{ zIndex: 'var(--z-modal-backdrop)' }}
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-2xl max-h-[80vh] bg-[var(--card-bg)] border-2 border-[var(--foreground)] shadow-2xl overflow-hidden flex flex-col modal-content animate-scale-in"
        style={{ zIndex: 'var(--z-modal)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-[var(--foreground)]">
          <div>
            <h2 className="font-bebas text-3xl tracking-wide text-[var(--foreground)]">
              {dateString}
            </h2>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--foreground-muted)] mt-1">
              {briefings.length} {briefings.length === 1 ? 'Briefing' : 'Briefings'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center border-2 border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
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

        {/* Briefing List */}
        <div className="flex-1 overflow-y-auto p-6">
          {briefings.length === 0 ? (
            <div className="border-2 border-dashed border-[var(--border)] p-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-2 border-[var(--foreground-muted)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--foreground-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-[var(--foreground-muted)] text-sm font-bold uppercase tracking-wide">
                No Briefings for This Date
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {briefings.map((briefing) => (
                <Link
                  key={briefing.briefingId}
                  href={`/briefing/${briefing.briefingId}`}
                  className="block border-2 border-[var(--border)] bg-[var(--card-bg)] p-5 hover:border-[var(--foreground)] transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-primary">
                        {briefing.symbol}
                      </span>
                      <span
                        className={`
                          text-[10px] font-black uppercase tracking-wide px-2 py-1
                          ${briefing.status === 'completed'
                            ? 'bg-[var(--success-light)] text-[var(--success)]'
                            : briefing.status === 'processing'
                              ? 'bg-[var(--warning-light)] text-[var(--warning)]'
                              : 'bg-[var(--danger-light)] text-[var(--danger)]'
                          }
                        `}
                      >
                        {briefing.status === 'completed'
                          ? 'DONE'
                          : briefing.status === 'processing'
                            ? 'PROCESSING'
                            : 'FAILED'}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[var(--foreground-muted)]">
                      {new Date(briefing.createdAt).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <h3 className="font-bold text-[var(--foreground)] mb-2 group-hover:text-[var(--accent)] transition-colors">
                    {briefing.textSummary.title}
                  </h3>
                  <p className="text-sm text-[var(--foreground-secondary)] line-clamp-2">
                    {briefing.textSummary.summary}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-[var(--foreground-muted)]">
                      {briefing.textSummary.keyPoints.length} Key Points
                    </span>
                    <svg className="w-4 h-4 text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t-2 border-[var(--foreground)]">
          <button
            onClick={onClose}
            className="w-full py-3 text-sm font-bold uppercase tracking-wide bg-[var(--foreground)] text-[var(--background)] hover:bg-transparent hover:text-[var(--foreground)] border-2 border-[var(--foreground)] transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

