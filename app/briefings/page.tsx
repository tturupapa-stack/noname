'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import BriefingCard from '@/components/BriefingCard';
import ThemeToggle from '@/components/ThemeToggle';
import Logo from '@/components/Logo';
import { Briefing } from '@/types';
import { fetchBriefings } from '@/services/api';
import { adaptBriefings } from '@/services/apiAdapters';

const BriefingCalendar = dynamic(() => import('@/components/BriefingCalendar'), {
  loading: () => (
    <div className="skeleton h-96"></div>
  ),
});

export default function BriefingsPage() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBriefings() {
      setIsLoading(true);
      try {
        const response = await fetchBriefings(1, 20);
        const adapted = adaptBriefings(response.briefings);
        setBriefings(adapted);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load briefings');
      } finally {
        setIsLoading(false);
      }
    }
    loadBriefings();
  }, []);

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
          <span className="text-overline mb-4 block">ARCHIVE</span>
          <h2 className="font-bebas text-4xl sm:text-5xl lg:text-6xl leading-[0.9] text-[var(--foreground)] mb-4">
            BRIEFING<br />
            <span className="text-[var(--accent)]">HISTORY</span>
          </h2>
          <p className="text-body text-[var(--foreground-secondary)] max-w-lg">
            Browse past briefings in the calendar and explore detailed analysis for each day.
          </p>
        </section>

        {/* Divider */}
        <div className="section-divider-bold mb-12 sm:mb-16" />

        {/* Calendar Section */}
        <section className="mb-12 sm:mb-16 animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="section-caption">CALENDAR VIEW</span>
              <h3 className="section-title">Select Date</h3>
            </div>
          </div>
          <div className="border-2 border-[var(--border)] p-4 sm:p-6">
            <BriefingCalendar briefings={briefings} />
          </div>
        </section>

        {/* Briefings List */}
        <section className="animate-fade-in-up stagger-2" style={{ opacity: 0 }}>
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="section-caption">ALL BRIEFINGS</span>
              <h3 className="section-title">Full Archive</h3>
            </div>
            <span className="text-sm font-bold text-[var(--foreground-muted)] uppercase tracking-wide">
              {briefings.length} Total
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton h-48"></div>
              ))}
            </div>
          ) : error ? (
            <div className="border-2 border-[var(--danger)] p-8 sm:p-12 text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-[var(--danger)] flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[var(--danger)] font-bold uppercase tracking-wide">{error}</p>
            </div>
          ) : briefings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {briefings.map((briefing, index) => (
                <BriefingCard key={briefing.briefingId} briefing={briefing} index={index} />
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-[var(--border)] p-12 text-center">
              <div className="w-14 h-14 mx-auto mb-4 border-2 border-[var(--foreground-muted)] flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--foreground-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-[var(--foreground-muted)] text-sm font-bold uppercase tracking-wide">
                No Briefings Available
              </p>
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
    </div>
  );
}
