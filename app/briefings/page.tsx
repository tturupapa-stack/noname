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
    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-96"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50/30 dark:from-black dark:via-gray-900 dark:to-blue-900/20 text-gray-900 dark:text-white transition-colors duration-300">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-dark flex items-center justify-center">
              <span className="text-lg">🌙</span>
            </div>
            <span className="text-xl font-bold gradient-text bg-clip-text text-transparent">
              당신이 잠든 사이
            </span>
          </Link>
          <Navigation />
          <ThemeToggle />
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text bg-clip-text text-transparent mb-2">
            브리핑 히스토리
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            과거 브리핑을 달력에서 확인하고 상세 내용을 조회하세요
          </p>
        </div>

        {/* 브리핑 달력 */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">브리핑 달력</h2>
          <BriefingCalendar briefings={briefings} />
        </div>

        {/* 브리핑 목록 */}
        <div>
          <h2 className="text-xl font-semibold mb-4">전체 브리핑 목록</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-48"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : briefings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {briefings.map((briefing, index) => (
                <BriefingCard key={briefing.briefingId} briefing={briefing} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              브리핑 히스토리가 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
