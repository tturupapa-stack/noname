'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import ThemeToggle from '@/components/ThemeToggle';
import Logo from '@/components/Logo';
import AIBriefingModal, { AIBriefingData } from '@/components/AIBriefingModal';
import { getSavedBriefings, deleteBriefing, SavedBriefing } from '@/services/savedBriefings';

export default function SavedBriefingsPage() {
  const [savedBriefings, setSavedBriefings] = useState<SavedBriefing[]>([]);
  const [selectedBriefing, setSelectedBriefing] = useState<AIBriefingData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedBriefings();
  }, []);

  const loadSavedBriefings = () => {
    setIsLoading(true);
    const briefings = getSavedBriefings();
    setSavedBriefings(briefings);
    setIsLoading(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('이 브리핑을 삭제하시겠습니까?')) {
      deleteBriefing(id);
      loadSavedBriefings();
    }
  };

  const handleView = (briefingData: AIBriefingData) => {
    setSelectedBriefing(briefingData);
    setModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-[var(--success)] text-white';
      case 'negative':
        return 'bg-[var(--danger)] text-white';
      default:
        return 'bg-[var(--foreground-muted)] text-white';
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'Bullish';
      case 'negative':
        return 'Bearish';
      default:
        return 'Neutral';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Top Bar - Musinsa Style */}
      <div className="border-b-[3px] border-[var(--foreground)] bg-[var(--background)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="transition-transform group-hover:scale-105">
                <Logo variant="icon" size="md" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bebas text-2xl sm:text-3xl tracking-wide text-[var(--foreground)] leading-none">
                  WHILE YOU WERE SLEEPING
                </h1>
                <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--foreground-muted)] uppercase">
                  Market Briefing Dashboard
                </p>
              </div>
              <h1 className="sm:hidden font-bebas text-xl text-[var(--foreground)]">
                WYWS
              </h1>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <Navigation />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        {/* Page Hero */}
        <section className="mb-12 sm:mb-16 animate-fade-in-up">
          <span className="text-overline mb-4 block">AI-POWERED INSIGHTS</span>
          <h2 className="font-bebas text-4xl sm:text-5xl lg:text-6xl leading-[0.9] text-[var(--foreground)] mb-4">
            MY<br />
            <span className="text-[var(--accent)]">ANALYSIS</span>
          </h2>
          <p className="text-body text-[var(--foreground-secondary)] max-w-lg">
            직접 생성한 AI 분석 리포트 모음입니다. 원하는 종목을 선택하여 상세 분석을 확인하세요.
          </p>
        </section>

        {/* Divider */}
        <div className="section-divider-bold mb-12 sm:mb-16" />

        {/* Saved Briefings List */}
        <section className="animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="section-caption">YOUR AI REPORTS</span>
              <h3 className="section-title">Saved Analysis</h3>
            </div>
            <span className="text-sm font-bold text-[var(--foreground-muted)] uppercase tracking-wide">
              {savedBriefings.length} Reports
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-48"></div>
              ))}
            </div>
          ) : savedBriefings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {savedBriefings.map((saved) => (
                <div
                  key={saved.id}
                  className="border-2 border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--foreground)] transition-colors group"
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-[var(--border)]">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-black text-lg text-[var(--foreground)] uppercase tracking-wide">
                          {saved.briefingData.meta.symbol}
                        </h4>
                        <p className="text-xs text-[var(--foreground-muted)]">
                          {saved.briefingData.meta.name}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wide ${getSentimentBadge(saved.briefingData.sentiment)}`}>
                        {getSentimentLabel(saved.briefingData.sentiment)}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--foreground-secondary)] line-clamp-2">
                      {saved.briefingData.headline}
                    </p>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm">
                        <span className={`font-bold ${saved.briefingData.meta.changePercent >= 0 ? 'price-up' : 'price-down'}`}>
                          ${saved.briefingData.meta.price.toFixed(2)}
                        </span>
                        <span className={`ml-2 ${saved.briefingData.meta.changePercent >= 0 ? 'price-up' : 'price-down'}`}>
                          {saved.briefingData.meta.changePercent >= 0 ? '+' : ''}{saved.briefingData.meta.changePercent.toFixed(2)}%
                        </span>
                      </div>
                      <div className="text-xs text-[var(--foreground-muted)]">
                        Score: {saved.briefingData.sentimentScore}
                      </div>
                    </div>

                    <p className="text-xs text-[var(--foreground-muted)] mb-4">
                      {formatDate(saved.savedAt)}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(saved.briefingData)}
                        className="flex-1 px-4 py-2 bg-[var(--foreground)] text-[var(--background)] font-bold text-xs uppercase tracking-wider hover:opacity-80 transition-opacity"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(saved.id)}
                        className="px-4 py-2 border-2 border-[var(--danger)] text-[var(--danger)] font-bold text-xs uppercase tracking-wider hover:bg-[var(--danger)] hover:text-white transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-[var(--border)] p-12 text-center">
              <div className="w-14 h-14 mx-auto mb-4 border-2 border-[var(--foreground-muted)] flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--foreground-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <p className="text-[var(--foreground-muted)] text-sm font-bold uppercase tracking-wide mb-4">
                No Saved Briefings
              </p>
              <p className="text-[var(--foreground-muted)] text-xs mb-6">
                Generate AI briefings from stock detail pages and save them here.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-white font-bold text-xs uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors"
              >
                Browse Stocks
              </Link>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-[3px] border-[var(--foreground)] mt-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-bebas text-xl tracking-wide text-[var(--foreground)]">
                WYWS
              </span>
              <span className="text-xs text-[var(--foreground-muted)]">
                While You Were Sleeping
              </span>
            </div>
            <p className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider">
              Market Data &amp; Analysis
            </p>
          </div>
        </div>
      </footer>

      {/* AI Briefing Modal - View Only */}
      <AIBriefingModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedBriefing(null);
        }}
        onRegenerate={() => {}}
        isLoading={false}
        error={null}
        briefingData={selectedBriefing}
        stockName={selectedBriefing?.meta.name}
        showSaveButton={false}
        showRegenerateButton={false}
      />
    </div>
  );
}
