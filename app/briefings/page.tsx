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
    <div className="skeleton h-96 rounded-2xl"></div>
  ),
});

// 별 생성 함수
function generateStars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 60}%`,
    animationDelay: `${Math.random() * 4}s`,
    size: Math.random() * 2 + 1,
  }));
}

export default function BriefingsPage() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stars, setStars] = useState<Array<{id: number; left: string; top: string; animationDelay: string; size: number}>>([]);

  useEffect(() => {
    setStars(generateStars(40));
  }, []);

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
    <div className="min-h-screen relative bg-dawn-gradient">
      {/* 별 배경 */}
      <div className="stars-container">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: star.animationDelay,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl relative z-10">
        {/* Header */}
        <header className="mb-10 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4 group">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff7e5f] to-[#feb47b] flex items-center justify-center shadow-lg animate-glow overflow-hidden">
                  <img
                    src="/logo-main.png"
                    alt="로고"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      if (target.parentElement) {
                        target.parentElement.innerHTML = '<span class="text-xl">🌅</span>';
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <h1 className="text-display text-xl sm:text-2xl text-dawn group-hover:opacity-80 transition-opacity">
                  당신이 잠든 사이
                </h1>
                <p className="text-xs text-[#1a1a2e]/50 dark:text-[#faf8f5]/40">
                  새벽이 밝아올 때
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Navigation />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Page Title */}
        <section className="mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <div className="section-header">
            <h2 className="section-title text-2xl sm:text-3xl">브리핑 히스토리</h2>
            <p className="text-sm opacity-60 mt-2">
              과거 브리핑을 달력에서 확인하고 상세 내용을 조회하세요
            </p>
          </div>
        </section>

        {/* 브리핑 달력 */}
        <section className="mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
          <div className="section-header">
            <h3 className="section-title text-lg">브리핑 달력</h3>
          </div>
          <div className="card-glass p-4 sm:p-6">
            <BriefingCalendar briefings={briefings} />
          </div>
        </section>

        {/* 브리핑 목록 */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
          <div className="section-header">
            <h3 className="section-title text-lg">전체 브리핑 목록</h3>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton h-48 rounded-2xl"></div>
              ))}
            </div>
          ) : error ? (
            <div className="card-glass p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-500">{error}</p>
            </div>
          ) : briefings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {briefings.map((briefing, index) => (
                <BriefingCard key={briefing.briefingId} briefing={briefing} index={index} />
              ))}
            </div>
          ) : (
            <div className="card-glass p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff7e5f]/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#ff7e5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="opacity-60">브리핑 히스토리가 없습니다</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
