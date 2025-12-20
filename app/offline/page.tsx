'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// 별 생성 함수
function generateStars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 4}s`,
    size: Math.random() * 2 + 1,
  }));
}

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [stars, setStars] = useState<Array<{id: number; left: string; top: string; animationDelay: string; size: number}>>([]);

  useEffect(() => {
    setStars(generateStars(60));
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen relative bg-dawn-gradient flex items-center justify-center p-4">
      {/* 별 배경 - 오프라인 페이지는 더 많은 별로 밤하늘 느낌 강조 */}
      <div className="stars-container" style={{ opacity: 1 }}>
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
        {/* 유성들 */}
        <div className="shooting-star" style={{ top: '20%', left: '80%', animationDelay: '1s' }} />
        <div className="shooting-star" style={{ top: '40%', left: '30%', animationDelay: '4s' }} />
        <div className="shooting-star" style={{ top: '60%', left: '60%', animationDelay: '7s' }} />
      </div>

      <div className="text-center max-w-md relative z-10 animate-fade-in-up">
        {/* 달/구름 일러스트 */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 mx-auto relative">
            {/* 달 */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#faf8f5] to-[#e8e0d8] shadow-xl animate-glow">
              {/* 달 크레이터 */}
              <div className="absolute top-6 left-8 w-4 h-4 rounded-full bg-[#d8d0c8]/30"></div>
              <div className="absolute top-12 left-16 w-3 h-3 rounded-full bg-[#d8d0c8]/20"></div>
              <div className="absolute bottom-8 left-10 w-5 h-5 rounded-full bg-[#d8d0c8]/25"></div>
            </div>
            {/* 구름 */}
            <div className="absolute -bottom-4 -left-8 w-24 h-10 bg-[#1a1a2e]/10 dark:bg-white/10 rounded-full blur-sm"></div>
            <div className="absolute -bottom-2 left-4 w-20 h-8 bg-[#1a1a2e]/10 dark:bg-white/10 rounded-full blur-sm"></div>
          </div>
        </div>

        <h1 className="text-display text-3xl sm:text-4xl text-dawn mb-4">
          연결이 끊어졌어요
        </h1>
        <p className="opacity-60 mb-8 leading-relaxed">
          인터넷 연결을 확인해주세요.<br />
          오프라인 상태에서도 최근 브리핑을 확인할 수 있습니다.
        </p>

        {isOnline ? (
          <div className="space-y-4 animate-fade-in-up">
            <div className="card p-4 border-l-4 border-l-[var(--success)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[var(--success)] flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-[var(--success)] font-bold text-sm">
                  연결이 복구되었습니다. 잠시 후 이동합니다...
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="btn btn-primary inline-flex items-center gap-2"
            >
              지금 이동하기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <Link
              href="/"
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              캐시된 브리핑 보기
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-secondary block w-full"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                다시 시도
              </span>
            </button>
          </div>
        )}

        {/* 하단 장식 */}
        <div className="mt-12 flex items-center justify-center gap-2 opacity-40">
          <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-[var(--foreground)]"></div>
          <span className="text-xs">밤이 깊어가고 있어요</span>
          <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-[var(--foreground)]"></div>
        </div>
      </div>
    </div>
  );
}
