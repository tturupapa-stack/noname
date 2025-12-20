'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import BriefingCard from '@/components/BriefingCard';
import ThemeToggle from '@/components/ThemeToggle';
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
        setError(err instanceof Error ? err.message : '브리핑 로드 실패');
      } finally {
        setIsLoading(false);
      }
    }
    loadBriefings();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <header className="mb-8 sm:mb-10 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 sm:gap-4 group">
              <div className="relative">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[var(--primary-500)] flex items-center justify-center overflow-hidden">
                  <img
                    src="/logo-main.png"
                    alt="로고"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      if (target.parentElement) {
                        target.parentElement.innerHTML = '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>';
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-[var(--foreground)] tracking-tight group-hover:text-[var(--primary-500)] transition-colors">
                  당신이 잠든 사이
                </h1>
                <p className="text-xs text-[var(--foreground-muted)]">
                  오늘의 시장 브리핑
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <Navigation />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Page Title */}
        <section className="mb-8 sm:mb-10 animate-fade-in-up" style={{ animationDelay: '0.05s', opacity: 0 }}>
          <div className="section-header">
            <h2 className="section-title text-xl sm:text-2xl">브리핑 히스토리</h2>
          </div>
          <p className="text-sm text-[var(--foreground-secondary)] mt-2">
            과거 브리핑을 달력에서 확인하고 상세 내용을 조회하세요
          </p>
        </section>

        {/* 브리핑 달력 */}
        <section className="mb-10 sm:mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <div className="section-header">
            <h3 className="section-title text-base sm:text-lg">브리핑 달력</h3>
          </div>
          <div className="card-glass p-4 sm:p-6">
            <BriefingCalendar briefings={briefings} />
          </div>
        </section>

        {/* 브리핑 목록 */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
          <div className="section-header">
            <h3 className="section-title text-base sm:text-lg">전체 브리핑 목록</h3>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton h-44 sm:h-48"></div>
              ))}
            </div>
          ) : error ? (
            <div className="card-glass p-6 sm:p-8 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--danger-light)] flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--danger)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[var(--danger)] font-medium">{error}</p>
            </div>
          ) : briefings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {briefings.map((briefing, index) => (
                <BriefingCard key={briefing.briefingId} briefing={briefing} index={index} />
              ))}
            </div>
          ) : (
            <div className="card-glass p-10 sm:p-12 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--primary-100)] dark:bg-[rgba(255,107,77,0.15)] flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--primary-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-[var(--foreground-muted)]">브리핑 히스토리가 없습니다</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
