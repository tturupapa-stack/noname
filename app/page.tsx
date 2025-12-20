'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import StockCard from '@/components/StockCard';
import SelectionCriteriaCard from '@/components/SelectionCriteriaCard';
import BriefingCard from '@/components/BriefingCard';
import CreateBriefingButton from '@/components/CreateBriefingButton';
import Top3Comparison from '@/components/Top3Comparison';
import ThemeToggle from '@/components/ThemeToggle';
import Navigation from '@/components/Navigation';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt';
import StockSearchBar from '@/components/StockSearchBar';
import FavoriteIcon from '@/components/FavoriteIcon';
import { Stock, SelectionCriteria, Briefing, PriceData } from '@/types';
import { getFavorites } from '@/utils/favoriteStorage';
import { mockAllStocks } from '@/data/mockData';
import { fetchTrendingStock, fetchTopNStocks, fetchBriefings, fetchStockChart } from '@/services/api';
import { adaptStock, adaptRankedStock, adaptSelectionCriteria, adaptBriefings, adaptChartData } from '@/services/apiAdapters';

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

export default function Home() {
  // API 데이터 상태
  const [topStock, setTopStock] = useState<Stock | null>(null);
  const [selectionCriteria, setSelectionCriteria] = useState<SelectionCriteria | null>(null);
  const [trendingStocks, setTrendingStocks] = useState<Stock[]>([]);
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [chartData, setChartData] = useState<PriceData[]>([]);
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 별 데이터 (클라이언트에서만 생성하여 hydration 에러 방지)
  const [stars, setStars] = useState<Array<{id: number; left: string; top: string; animationDelay: string; size: number}>>([]);

  useEffect(() => {
    setStars(generateStars(50));
  }, []);

  // API 데이터 로드
  useEffect(() => {
    setFavoriteSymbols(getFavorites().map(f => f.id));

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const [trendingRes, topNRes, briefingsRes] = await Promise.all([
          fetchTrendingStock('most_actives'),
          fetchTopNStocks('most_actives', 3),
          fetchBriefings(1, 3),
        ]);

        const adaptedTopStock = adaptStock(trendingRes.stock, trendingRes.score, 1);
        setTopStock(adaptedTopStock);

        const adaptedCriteria = adaptSelectionCriteria(trendingRes.score, trendingRes.why_hot);
        setSelectionCriteria(adaptedCriteria);

        const adaptedTrendingStocks = topNRes.stocks.map(adaptRankedStock);
        setTrendingStocks(adaptedTrendingStocks);

        const adaptedBriefings = adaptBriefings(briefingsRes.briefings);
        setBriefings(adaptedBriefings);

        if (adaptedTopStock) {
          try {
            const chartRes = await fetchStockChart(adaptedTopStock.symbol, '5d');
            const adaptedChartData = adaptChartData(chartRes.data);
            setChartData(adaptedChartData);
          } catch (chartErr) {
            console.error('차트 데이터 로드 실패:', chartErr);
          }
        }
      } catch (err) {
        console.error('API 호출 실패:', err);
        setError(err instanceof Error ? err.message : 'API 호출 실패');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();

    const handleStorage = () => {
      setFavoriteSymbols(getFavorites().map(f => f.id));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // 모든 종목 목록
  const allStocks = useMemo(() => {
    if (trendingStocks.length > 0) {
      return [...trendingStocks, ...mockAllStocks.filter(s => !trendingStocks.find(t => t.symbol === s.symbol))];
    }
    return mockAllStocks;
  }, [trendingStocks]);

  // 관심 종목 미리보기
  const favoriteStocksPreview = useMemo(() => {
    return favoriteSymbols
      .slice(0, 5)
      .map(symbol => allStocks.find(s => s.symbol === symbol))
      .filter((s): s is Stock => s !== undefined);
  }, [favoriteSymbols, allStocks]);

  return (
    <div className="min-h-screen relative bg-dawn-gradient">
      {/* 별 배경 (다크모드에서만 표시) */}
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
        {/* 유성 */}
        <div className="shooting-star" style={{ top: '15%', left: '70%', animationDelay: '2s' }} />
        <div className="shooting-star" style={{ top: '25%', left: '20%', animationDelay: '8s' }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl relative z-10">
        {/* Header */}
        <header className="mb-12 animate-fade-in-up">
          <div className="flex flex-col gap-8">
            {/* 상단 네비게이션 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                {/* 로고 */}
                <div className="relative group">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff7e5f] to-[#feb47b] flex items-center justify-center shadow-lg animate-glow overflow-hidden">
                    <img
                      src="/logo-main.png"
                      alt="로고"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        if (target.parentElement) {
                          target.parentElement.innerHTML = '<span class="text-2xl">🌅</span>';
                        }
                      }}
                    />
                  </div>
                  {/* 활성 표시 */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-[#0a0a12]" />
                </div>

                {/* 타이틀 */}
                <div>
                  <h1 className="text-display text-2xl sm:text-3xl text-dawn">
                    당신이 잠든 사이
                  </h1>
                  <p className="text-sm text-[#1a1a2e]/60 dark:text-[#faf8f5]/50 mt-0.5">
                    새벽이 밝아올 때, 시장의 이야기를 전합니다
                  </p>
                </div>
              </div>

              {/* 우측 컨트롤 */}
              <div className="flex items-center gap-3">
                <Navigation />
                <ThemeToggle />
                <CreateBriefingButton />
              </div>
            </div>

            {/* 검색바 */}
            <div className="flex justify-center">
              <StockSearchBar stocks={allStocks} />
            </div>
          </div>
        </header>

        {/* TOP 3 화제 종목 */}
        <section className="mb-16 animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
          <div className="section-header">
            <h2 className="section-title">오늘의 화제 종목</h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-52 rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <div className="card-glass p-8 text-center">
              <p className="text-red-500">데이터 로드 실패: {error}</p>
            </div>
          ) : (
            <Top3Comparison stocks={trendingStocks} />
          )}
        </section>

        {/* 복합점수 산정 기준 */}
        <section className="mb-16 animate-fade-in-up stagger-2" style={{ opacity: 0 }}>
          <div className="card-glass p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff7e5f]/20 to-[#feb47b]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#ff7e5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-3">복합점수 산정 기준</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff7e5f]" />
                    <span className="opacity-70">거래량 (10점)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="opacity-70">가격변동 (10점)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4ecdc4]" />
                    <span className="opacity-70">모멘텀 (10점)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#feb47b]" />
                    <span className="opacity-70">시가총액 (10점)</span>
                  </div>
                </div>
                <p className="text-xs opacity-50 mt-3">
                  거래량 급증, 당일 가격 변동률, 5일/10일 수익률 추세, 적정 시가총액 구간을 종합 평가하여 최대 40점 만점으로 산정
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 오늘의 화제 종목 상세 */}
        <section className="mb-16 animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
          <div className="section-header">
            <h2 className="section-title">상세 분석</h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="skeleton h-80 rounded-2xl" />
              <div className="skeleton h-80 rounded-2xl" />
            </div>
          ) : topStock && selectionCriteria ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StockCard stock={topStock} isLarge={true} chartData={chartData} />
              <SelectionCriteriaCard criteria={selectionCriteria} stockSymbol={topStock.symbol} />
            </div>
          ) : (
            <div className="card-glass p-8 text-center">
              <p className="opacity-60">화제 종목 데이터가 없습니다</p>
            </div>
          )}
        </section>

        {/* 관심 종목 */}
        <section className="mb-16 animate-fade-in-up stagger-4" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div className="section-header mb-0">
              <h2 className="section-title">관심 종목</h2>
            </div>
            <Link
              href="/favorites"
              className="group flex items-center gap-1 text-sm font-medium text-[#ff7e5f] hover:text-[#feb47b] transition-colors"
            >
              전체보기
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {favoriteStocksPreview.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {favoriteStocksPreview.map((stock) => {
                const isPositive = stock.change >= 0;
                return (
                  <div
                    key={stock.symbol}
                    className="flex-shrink-0 card-dawn p-4 min-w-[180px] hover-lift transition-smooth"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg">{stock.symbol}</span>
                      <FavoriteIcon stock={stock} size="sm" />
                    </div>
                    <p className={`text-xl font-semibold ${isPositive ? 'price-up' : 'price-down'}`}>
                      ${stock.currentPrice.toFixed(2)}
                    </p>
                    <p className={`text-sm ${isPositive ? 'price-up' : 'price-down'}`}>
                      {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card-glass p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#ff7e5f]/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-[#ff7e5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <p className="opacity-60 text-sm">
                관심 종목이 없습니다<br />
                종목 검색에서 ⭐를 눌러 추가하세요
              </p>
            </div>
          )}
        </section>

        {/* 최근 브리핑 */}
        <section className="mb-8 animate-fade-in-up stagger-5" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div className="section-header mb-0">
              <h2 className="section-title">최근 브리핑</h2>
            </div>
            <Link
              href="/briefings"
              className="group flex items-center gap-1 text-sm font-medium text-[#ff7e5f] hover:text-[#feb47b] transition-colors"
            >
              전체보기
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-40 rounded-2xl" />
              ))}
            </div>
          ) : briefings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {briefings.slice(0, 3).map((briefing, index) => (
                <BriefingCard key={briefing.briefingId} briefing={briefing} index={index} />
              ))}
            </div>
          ) : (
            <div className="card-glass p-8 text-center">
              <p className="opacity-60 text-sm">브리핑 히스토리가 없습니다</p>
            </div>
          )}
        </section>
      </div>

      <PWAInstallPrompt />
      <PWAUpdatePrompt />
    </div>
  );
}
