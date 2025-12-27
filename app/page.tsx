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
import Logo from '@/components/Logo';
import { Stock, SelectionCriteria, Briefing, PriceData } from '@/types';
import { getFavorites } from '@/utils/favoriteStorage';
import { mockAllStocks } from '@/data/mockData';
import { fetchTrendingStock, fetchTopNStocks, fetchBriefings, fetchStockChart } from '@/services/api';
import { adaptStock, adaptRankedStock, adaptSelectionCriteria, adaptBriefings, adaptChartData } from '@/services/apiAdapters';
import { logger } from '@/utils/logger';

export default function Home() {
  // API 데이터 상태
  const [topStock, setTopStock] = useState<Stock | null>(null);
  const [selectionCriteria, setSelectionCriteria] = useState<SelectionCriteria | null>(null);
  const [trendingStocks, setTrendingStocks] = useState<Stock[]>([]);
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [chartData, setChartData] = useState<PriceData[]>([]);
  const [chartError, setChartError] = useState<string | null>(null);
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API 데이터 로드 (최적화: 모든 API 병렬 호출)
  useEffect(() => {
    setFavoriteSymbols(getFavorites().map(f => f.id));

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        // 1단계: 핵심 데이터 병렬 로드 (TOP 종목 + TOP N + 브리핑)
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

        // 2단계: 로딩 완료 표시 (차트는 백그라운드에서 로드)
        setIsLoading(false);

        // 3단계: 차트 데이터 비동기 로드 (UI 블로킹 없음)
        if (adaptedTopStock) {
          setChartError(null); // 이전 에러 초기화
          fetchStockChart(adaptedTopStock.symbol, '5d')
            .then((chartRes) => {
              const adaptedChartData = adaptChartData(chartRes.data);
              setChartData(adaptedChartData);
              setChartError(null);
            })
            .catch((chartErr) => {
              logger.error('차트 데이터 로드 실패:', chartErr);
              setChartError(chartErr instanceof Error ? chartErr.message : '차트 로드 실패');
              setChartData([]); // 에러 시 빈 배열로 설정
            });
        }
      } catch (err) {
        logger.error('API 호출 실패:', err);
        setError(err instanceof Error ? err.message : 'API 호출 실패');
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
    <div className="min-h-screen bg-[var(--background)]">
      {/* Top Bar - Musinsa Style */}
      <div className="border-b-[3px] border-[var(--foreground)] bg-[var(--background)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo & Title - Bold Typography */}
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

            {/* Right Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Navigation />
              <ThemeToggle />
              <div className="hidden sm:block">
                <CreateBriefingButton />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        {/* Hero Section - Editorial Style */}
        <section className="mb-16 sm:mb-24 animate-fade-in-up relative z-[100]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left: Big Typography */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <span className="text-overline mb-4">TODAY&apos;S MARKET</span>
              <h2 className="font-bebas text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[0.85] text-[var(--foreground)] mb-6">
                TRENDING<br />
                <span className="text-[var(--accent)]">STOCKS</span>
              </h2>
              <p className="text-body text-[var(--foreground-secondary)] max-w-md mb-8">
                밤새 시장에서 무슨 일이 있었는지, 새벽이 밝아올 때 가장 먼저 알려드립니다.
              </p>

              {/* Search Bar */}
              <div className="max-w-md relative z-[200]">
                <StockSearchBar stocks={allStocks} />
              </div>
            </div>

            {/* Right: Top 3 Cards */}
            <div className="lg:col-span-7">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border-2 border-[var(--border)] p-5 animate-pulse">
                      <div className="h-6 w-16 bg-[var(--border)] mb-4" />
                      <div className="h-8 w-24 bg-[var(--border)] mb-2" />
                      <div className="h-4 w-32 bg-[var(--border)] mb-6" />
                      <div className="h-10 w-20 bg-[var(--border)] mb-2" />
                      <div className="h-4 w-16 bg-[var(--border)]" />
                      <div className="mt-4 pt-4 border-t border-[var(--border)]">
                        <div className="h-3 w-full bg-[var(--border)] mb-2" />
                        <div className="h-3 w-3/4 bg-[var(--border)]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="border-2 border-[var(--foreground)] p-8 text-center">
                  <p className="text-[var(--danger)] font-bold uppercase tracking-wide">Data Load Failed</p>
                  <p className="text-sm text-[var(--foreground-muted)] mt-2">{error}</p>
                </div>
              ) : (
                <Top3Comparison stocks={trendingStocks} />
              )}
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="section-divider-bold mb-16 sm:mb-20" />

        {/* Score Criteria Section - Minimal Info Box */}
        <section className="mb-16 sm:mb-20 animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
          <div className="border-2 border-[var(--foreground)] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              {/* Icon */}
              <div className="flex-shrink-0 w-14 h-14 bg-[var(--foreground)] flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--background)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="font-bold text-xl text-[var(--foreground)] mb-4 uppercase tracking-wide">
                  Composite Score Criteria
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                  {[
                    { label: 'VOLUME', score: 10 },
                    { label: 'PRICE CHANGE', score: 10 },
                    { label: 'MOMENTUM', score: 10 },
                    { label: 'MARKET CAP', score: 10 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="w-8 h-8 flex items-center justify-center bg-[var(--foreground)] text-[var(--background)] text-sm font-black">
                        {item.score}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wide text-[var(--foreground-secondary)]">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[var(--foreground-muted)] mt-4 leading-relaxed">
                  거래량 급증, 당일 가격 변동률, 5일/10일 수익률 추세, 적정 시가총액 구간을 종합 평가하여 최대 40점 만점으로 산정
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Analysis Section */}
        <section className="mb-16 sm:mb-20 animate-fade-in-up stagger-2" style={{ opacity: 0 }}>
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="section-caption">DEEP DIVE</span>
              <h2 className="section-title-lg">Analysis</h2>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Stock Card Skeleton */}
              <div className="border-2 border-[var(--border)] p-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-8 w-32 bg-[var(--border)]" />
                  <div className="h-6 w-6 bg-[var(--border)]" />
                </div>
                <div className="h-6 w-48 bg-[var(--border)] mb-6" />
                <div className="h-12 w-28 bg-[var(--border)] mb-2" />
                <div className="h-5 w-20 bg-[var(--border)] mb-6" />
                <div className="h-40 w-full bg-[var(--border)] mb-4" />
                <div className="flex gap-4">
                  <div className="h-4 w-24 bg-[var(--border)]" />
                  <div className="h-4 w-24 bg-[var(--border)]" />
                </div>
              </div>
              {/* Criteria Card Skeleton */}
              <div className="border-2 border-[var(--border)] p-6 animate-pulse">
                <div className="h-8 w-48 bg-[var(--border)] mb-6" />
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-[var(--border)]" />
                      <div className="flex-1">
                        <div className="h-4 w-24 bg-[var(--border)] mb-2" />
                        <div className="h-2 w-full bg-[var(--border)]" />
                      </div>
                      <div className="h-6 w-8 bg-[var(--border)]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : topStock && selectionCriteria ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 grid-isolated">
              <div className="relative">
                <StockCard stock={topStock} isLarge={true} chartData={chartData} />
                {chartError && (
                  <div className="absolute bottom-4 left-4 right-4 bg-[var(--danger)]/10 border border-[var(--danger)]/30 px-3 py-2 text-xs text-[var(--danger)]">
                    <span className="font-medium">차트 로드 실패:</span> {chartError}
                  </div>
                )}
              </div>
              <SelectionCriteriaCard criteria={selectionCriteria} stockSymbol={topStock.symbol} />
            </div>
          ) : (
            <div className="border-2 border-[var(--border)] p-12 text-center">
              <p className="text-[var(--foreground-muted)] uppercase tracking-wide font-medium">
                No trending stock data available
              </p>
            </div>
          )}
        </section>

        {/* Watchlist Section - Horizontal Scroll */}
        <section className="mb-16 sm:mb-20 animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="section-caption">MY PICKS</span>
              <h2 className="section-title-lg">Watchlist</h2>
            </div>
            <Link href="/favorites" className="section-link hover-arrow">
              View All
            </Link>
          </div>

          {favoriteStocksPreview.length > 0 ? (
            <div className="scroll-section scrollbar-hide -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10">
              {favoriteStocksPreview.map((stock, index) => {
                const isPositive = stock.change >= 0;
                return (
                  <Link
                    key={stock.symbol}
                    href={`/stock/${stock.symbol}`}
                    className="w-[200px] sm:w-[220px] border-2 border-[var(--border)] p-5 hover:border-[var(--foreground)] transition-all group animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s`, opacity: 0 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-black text-lg text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors truncate max-w-[150px]">
                        {stock.shortName}
                      </span>
                      <div onClick={(e) => e.preventDefault()}>
                        <FavoriteIcon stock={stock} size="sm" />
                      </div>
                    </div>
                    <p className={`text-2xl font-black ${isPositive ? 'price-up' : 'price-down'}`}>
                      {/^\d{6}$/.test(stock.symbol) ? `₩${stock.currentPrice.toLocaleString()}` : `$${stock.currentPrice.toFixed(2)}`}
                    </p>
                    <p className={`text-sm font-bold mt-1 ${isPositive ? 'price-up' : 'price-down'}`}>
                      {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)] mt-3 truncate">
                      {stock.symbol}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="border-2 border-dashed border-[var(--border)] p-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-2 border-[var(--foreground-muted)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--foreground-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <p className="text-[var(--foreground-muted)] text-sm font-medium uppercase tracking-wide">
                No favorites yet
              </p>
              <p className="text-[var(--foreground-muted)] text-xs mt-2">
                Search for stocks and add them to your watchlist
              </p>
            </div>
          )}
        </section>

        {/* Divider */}
        <div className="section-divider mb-16 sm:mb-20" />

        {/* MY ANALYSIS CTA Banner */}
        <section className="mb-16 sm:mb-20 animate-fade-in-up stagger-3-5" style={{ opacity: 0 }}>
          <div className="border-2 border-dashed border-[var(--accent)]/40 hover:border-[var(--accent)] transition-colors p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-black text-lg text-[var(--foreground)] uppercase tracking-wide">
                    Want Deeper Analysis?
                  </h3>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    종목 상세 페이지에서 AI 기반 심층 분석을 생성해보세요
                  </p>
                </div>
              </div>
              <Link
                href="/saved-briefings"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--foreground)] text-[var(--background)] font-bold text-xs uppercase tracking-wider hover:opacity-80 transition-opacity whitespace-nowrap"
              >
                MY ANALYSIS
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Recent Briefings Section - Daily Hot */}
        <section className="mb-12 animate-fade-in-up stagger-4" style={{ opacity: 0 }}>
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="section-caption">AUTO-GENERATED</span>
              <h2 className="section-title-lg">Daily Hot</h2>
            </div>
            <Link href="/briefings" className="section-link hover-arrow">
              View All
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border-2 border-[var(--border)] p-5 animate-pulse">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-4 w-20 bg-[var(--border)]" />
                    <div className="h-4 w-16 bg-[var(--border)]" />
                  </div>
                  <div className="h-6 w-full bg-[var(--border)] mb-2" />
                  <div className="h-4 w-3/4 bg-[var(--border)] mb-4" />
                  <div className="h-3 w-full bg-[var(--border)] mb-2" />
                  <div className="h-3 w-5/6 bg-[var(--border)]" />
                </div>
              ))}
            </div>
          ) : briefings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {briefings.slice(0, 3).map((briefing, index) => (
                <BriefingCard key={briefing.briefingId} briefing={briefing} index={index} />
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-[var(--border)] p-12 text-center">
              <p className="text-[var(--foreground-muted)] text-sm font-medium uppercase tracking-wide">
                No briefings available
              </p>
            </div>
          )}
        </section>

        {/* Mobile Create Button */}
        <div className="sm:hidden fixed bottom-6 right-6 z-50">
          <CreateBriefingButton />
        </div>
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

      <PWAInstallPrompt />
      <PWAUpdatePrompt />
    </div>
  );
}
