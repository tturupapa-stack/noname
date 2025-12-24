'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { saveBriefing } from '@/services/savedBriefings';

// 뉴스 소스 타입
export interface NewsSource {
  title: string;
  url: string;
  source: string;
}

// AI 브리핑 데이터 타입
export interface AIBriefingData {
  headline: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  newsSummary: {
    mainPoint: string;
    details: string[];
  };
  technicalAnalysis: {
    trend: string;
    support: number;
    resistance: number;
    summary: string;
  };
  investmentInsight: {
    outlook: string;
    points: string[];
    risks: string[];
    conclusion: string;
  };
  newsSources?: NewsSource[]; // 참고한 뉴스 소스
  meta: {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    date: string;
    time: string;
    generatedAt: string;
  };
}

interface AIBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
  error: string | null;
  briefingData: AIBriefingData | null;
  stockName?: string;
  showSaveButton?: boolean;
}

// JSON 문자열을 파싱하는 유틸리티
export function parseAIBriefing(jsonString: string): AIBriefingData | null {
  try {
    const parsed = JSON.parse(jsonString);
    return parsed as AIBriefingData;
  } catch {
    return null;
  }
}

export default function AIBriefingModal({
  isOpen,
  onClose,
  onRegenerate,
  isLoading,
  error,
  briefingData,
  stockName,
  showSaveButton = true,
}: AIBriefingModalProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // 모달이 열릴 때마다 저장 상태 리셋
  useEffect(() => {
    if (isOpen) {
      setIsSaved(false);
      setSaveMessage(null);
    }
  }, [isOpen, briefingData]);

  const handleSave = () => {
    if (!briefingData) return;

    try {
      saveBriefing(briefingData);
      setIsSaved(true);
      setSaveMessage('저장되었습니다');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch {
      setSaveMessage('저장 실패');
      setTimeout(() => setSaveMessage(null), 2000);
    }
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // 센티멘트 색상 계산
  const sentimentConfig = useMemo(() => {
    if (!briefingData) return { color: 'var(--foreground-muted)', bg: 'var(--background-secondary)', label: '-' };

    switch (briefingData.sentiment) {
      case 'positive':
        return { color: 'var(--success)', bg: 'var(--success-light)', label: 'BULLISH' };
      case 'negative':
        return { color: 'var(--danger)', bg: 'var(--danger-light)', label: 'BEARISH' };
      default:
        return { color: 'var(--foreground-muted)', bg: 'var(--background-secondary)', label: 'NEUTRAL' };
    }
  }, [briefingData]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm modal-backdrop"
      style={{ zIndex: 'var(--z-modal-backdrop)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-[var(--background)] border-[3px] border-[var(--foreground)] overflow-hidden flex flex-col modal-content"
        style={{ zIndex: 'var(--z-modal)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-[var(--foreground)] bg-[var(--foreground)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--background)] flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bebas text-xl text-[var(--background)] tracking-wide leading-none">
                AI BRIEFING
              </h3>
              <p className="text-[10px] font-bold tracking-wider text-[var(--background)]/70 uppercase">
                While You Were Sleeping
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--background)] hover:bg-[var(--background)]/20 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <LoadingState stockName={stockName} />
          ) : error ? (
            <ErrorState error={error} onRetry={onRegenerate} />
          ) : briefingData ? (
            <BriefingContent data={briefingData} sentimentConfig={sentimentConfig} onClose={onClose} />
          ) : null}
        </div>

        {/* Footer */}
        {!isLoading && briefingData && (
          <div className="px-6 py-4 border-t-[3px] border-[var(--foreground)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-xs text-[var(--foreground-muted)]">
                {briefingData.meta.date} {briefingData.meta.time} 기준
              </p>
              {saveMessage && (
                <span className={`text-xs font-bold ${isSaved ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                  {saveMessage}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              {showSaveButton && (
                <button
                  onClick={handleSave}
                  disabled={isSaved}
                  className={`px-4 py-2 border-2 font-bold text-xs uppercase tracking-wide transition-colors flex items-center gap-2
                    ${isSaved
                      ? 'border-[var(--success)] text-[var(--success)] cursor-default'
                      : 'border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white'
                    }`}
                >
                  {isSaved ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Saved
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      Save
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate();
                }}
                className="px-4 py-2 border-2 border-[var(--foreground)] font-bold text-xs uppercase tracking-wide hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
              >
                Regenerate
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] font-bold text-xs uppercase tracking-wide hover:bg-[var(--foreground)]/80 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Loading State Component
function LoadingState({ stockName }: { stockName?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 border-[3px] border-[var(--foreground)]/20"></div>
        <div className="absolute inset-0 border-[3px] border-[var(--foreground)] border-t-transparent animate-spin"></div>
      </div>
      <p className="text-lg font-bold text-[var(--foreground)] uppercase tracking-wide mb-2">
        Generating Briefing
      </p>
      {stockName && (
        <p className="text-sm text-[var(--foreground-muted)] mb-4">{stockName}</p>
      )}
      <div className="flex gap-2 text-xs text-[var(--foreground-muted)]">
        <span className="animate-pulse">Collecting news</span>
        <span>|</span>
        <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>Analyzing charts</span>
        <span>|</span>
        <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>Writing briefing</span>
      </div>
    </div>
  );
}

// Error State Component
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      <div className="w-16 h-16 bg-[var(--danger)] flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-lg font-bold text-[var(--danger)] uppercase tracking-wide mb-2">
        Generation Failed
      </p>
      <p className="text-sm text-[var(--foreground-muted)] text-center max-w-md mb-6">
        {error}
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-3 border-2 border-[var(--foreground)] font-bold text-sm uppercase tracking-wide hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

// Briefing Content Component
function BriefingContent({
  data,
  sentimentConfig,
  onClose,
}: {
  data: AIBriefingData;
  sentimentConfig: { color: string; bg: string; label: string };
  onClose: () => void;
}) {
  const isPositive = data.meta.changePercent >= 0;

  return (
    <div className="p-6 space-y-6">
      {/* Hero Section - Stock Info + Headline */}
      <section className="border-b-2 border-[var(--border)] pb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          {/* Stock Info */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold tracking-wider text-[var(--foreground-muted)] uppercase">
                Today&apos;s Pick
              </span>
              <span
                className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ backgroundColor: sentimentConfig.bg, color: sentimentConfig.color }}
              >
                {sentimentConfig.label}
              </span>
            </div>
            <Link
              href={`/stock/${data.meta.symbol}`}
              onClick={onClose}
              className="group block"
            >
              <h2 className="font-bebas text-3xl sm:text-4xl text-[var(--foreground)] tracking-wide leading-none group-hover:text-[var(--accent)] transition-colors">
                {data.meta.symbol}
              </h2>
              <p className="text-sm text-[var(--foreground-secondary)] group-hover:text-[var(--accent)] transition-colors">{data.meta.name}</p>
            </Link>
          </div>

          {/* Price Box */}
          <div className="flex items-end gap-4">
            <div className="text-right">
              <p className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tabular-nums">
                ${data.meta.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p
                className={`text-lg font-bold tabular-nums ${isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}
              >
                {isPositive ? '+' : ''}{data.meta.changePercent.toFixed(2)}%
                <span className="text-sm ml-1">
                  ({isPositive ? '+' : ''}${data.meta.change.toFixed(2)})
                </span>
              </p>
            </div>
            {/* Sentiment Score Gauge */}
            <div className="w-14 h-14 relative">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={sentimentConfig.color}
                  strokeWidth="3"
                  strokeDasharray={`${data.sentimentScore}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black" style={{ color: sentimentConfig.color }}>
                  {data.sentimentScore}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="bg-[var(--background-secondary)] border-l-4 border-[var(--foreground)] p-4">
          <p className="text-lg sm:text-xl font-bold text-[var(--foreground)] leading-snug">
            {data.headline}
          </p>
        </div>
      </section>

      {/* Two Column Layout for Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* News Summary */}
        <section>
          <SectionHeader title="NEWS" subtitle="Latest Updates" />
          <div className="space-y-3">
            <p className="text-[var(--foreground)] font-medium leading-relaxed">
              {data.newsSummary.mainPoint}
            </p>
            {data.newsSummary.details.length > 0 && (
              <ul className="space-y-2">
                {data.newsSummary.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-[var(--foreground-secondary)]">
                    <span className="w-1.5 h-1.5 bg-[var(--foreground)] mt-2 flex-shrink-0"></span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Technical Analysis */}
        <section>
          <SectionHeader title="TECHNICAL" subtitle="Chart Analysis" />
          <div className="space-y-4">
            {/* Trend + Levels */}
            <div className="grid grid-cols-3 gap-3">
              <MetricCard
                label="Trend"
                value={data.technicalAnalysis.trend}
                valueColor={
                  data.technicalAnalysis.trend === '상승'
                    ? 'var(--success)'
                    : data.technicalAnalysis.trend === '하락'
                    ? 'var(--danger)'
                    : 'var(--foreground)'
                }
              />
              <MetricCard
                label="Support"
                value={`$${data.technicalAnalysis.support.toLocaleString()}`}
              />
              <MetricCard
                label="Resistance"
                value={`$${data.technicalAnalysis.resistance.toLocaleString()}`}
              />
            </div>
            <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
              {data.technicalAnalysis.summary}
            </p>
          </div>
        </section>
      </div>

      {/* Investment Insight - Full Width */}
      <section className="border-t-2 border-[var(--border)] pt-6">
        <SectionHeader title="INSIGHT" subtitle="Investment Analysis" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Points */}
          <div className="bg-[var(--success-light)] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--success)] mb-2">
              Opportunities
            </p>
            <ul className="space-y-1.5">
              {data.investmentInsight.points.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                  <svg className="w-4 h-4 text-[var(--success)] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Risks */}
          <div className="bg-[var(--danger-light)] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--danger)] mb-2">
              Risks
            </p>
            <ul className="space-y-1.5">
              {data.investmentInsight.risks.map((risk, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                  <svg className="w-4 h-4 text-[var(--danger)] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Conclusion */}
        <div className="bg-[var(--foreground)] text-[var(--background)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-70">Outlook</span>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[var(--background)] text-[var(--foreground)]">
              {data.investmentInsight.outlook}
            </span>
          </div>
          <p className="font-medium leading-relaxed">
            {data.investmentInsight.conclusion}
          </p>
        </div>
      </section>

      {/* News Sources Section */}
      {data.newsSources && data.newsSources.length > 0 && (
        <section className="border-t-2 border-[var(--border)] pt-4">
          <SectionHeader title="SOURCES" subtitle="News References" />
          <div className="space-y-2">
            {data.newsSources.slice(0, 5).map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 p-2 -mx-2 hover:bg-[var(--background-secondary)] transition-colors"
              >
                <span className="flex-shrink-0 w-5 h-5 bg-[var(--foreground)]/10 flex items-center justify-center text-[10px] font-bold text-[var(--foreground-muted)]">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--foreground)] font-medium leading-snug group-hover:text-[var(--accent)] transition-colors truncate">
                    {source.title}
                  </p>
                  <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider mt-0.5">
                    {source.source}
                  </p>
                </div>
                <svg
                  className="flex-shrink-0 w-4 h-4 text-[var(--foreground-muted)] group-hover:text-[var(--accent)] transition-colors mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <div className="text-xs text-[var(--foreground-muted)] text-center pt-4 border-t border-[var(--border)]">
        This briefing is for informational purposes only and does not constitute investment advice.
      </div>
    </div>
  );
}

// Section Header Component
function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-end gap-2 mb-4">
      <h3 className="font-bebas text-xl text-[var(--foreground)] tracking-wide leading-none">
        {title}
      </h3>
      <span className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider pb-0.5">
        {subtitle}
      </span>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  label,
  value,
  valueColor = 'var(--foreground)',
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-[var(--background-secondary)] p-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-1">
        {label}
      </p>
      <p className="text-sm font-bold" style={{ color: valueColor }}>
        {value}
      </p>
    </div>
  );
}
