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
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header - Musinsa Style */}
        <header className="mb-12 sm:mb-16 animate-fade-in-up">
          <div className="flex flex-col gap-8">
            {/* 상단 네비게이션 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* 로고 - Sharp & Minimal */}
                <div className="relative">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[var(--foreground)] dark:bg-[var(--color-white)] flex items-center justify-center overflow-hidden">
                    <img
                      src="/logo-main.png"
                      alt="로고"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        if (target.parentElement) {
                          target.parentElement.innerHTML = '<svg class="w-5 h-5 text-[var(--background)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>';
                        }
                      }}
                    />
                  </div>
                </div>

                {/* 타이틀 - Bold Typography */}
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] tracking-tight">
                    당신이 잠든 사이
                  </h1>
                  <p className="text-xs text-[var(--foreground-muted)] mt-0.5 uppercase tracking-widest">
                    MARKET BRIEFING
                  </p>
                </div>
              </div>

              {/* 우측 컨트롤 */}
              <div className="flex items-center gap-3">
                <Navigation />
                <ThemeToggle />
                <div className="hidden sm:block">
                  <CreateBriefingButton />
                </div>
              </div>
            </div>

            {/* 검색바 */}
            <div className="flex justify-center">
              <StockSearchBar stocks={allStocks} />
            </div>
          </div>
        </header>

        {/* TOP 3 화제 종목 - Editorial Section */}
        <section className="mb-16 sm:mb-20 animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
          <div className="mb-8">
            <span className="section-caption">TRENDING NOW</span>
            <h2 className="text-h2">오늘의 화제 종목</h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-52" />
              ))}
            </div>
          ) : error ? (
            <div className="border border-[var(--border)] p-8 text-center">
              <p className="text-[var(--danger)] font-medium">데이터 로드 실패</p>
              <p className="text-sm text-[var(--foreground-muted)] mt-1">{error}</p>
            </div>
          ) : (
            <Top3Comparison stocks={trendingStocks} />
          )}
        </section>

        {/* 복합점수 산정 기준 - Minimal Info Box */}
        <section className="mb-16 sm:mb-20 animate-fade-in-up stagger-2" style={{ opacity: 0 }}>
          <div className="border border-[var(--border)] p-6 sm:p-8">
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-12 h-12 bg-[var(--foreground)] dark:bg-[var(--color-white)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--background)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-[var(--foreground)] mb-4">복합점수 산정 기준</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-[var(--foreground)] text-[var(--background)] text-xs font-bold">10</span>
                    <span className="text-[var(--foreground-secondary)]">거래량</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-[var(--foreground)] text-[var(--background)] text-xs font-bold">10</span>
                    <span className="text-[var(--foreground-secondary)]">가격변동</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-[var(--foreground)] text-[var(--background)] text-xs font-bold">10</span>
                    <span className="text-[var(--foreground-secondary)]">모멘텀</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-[var(--foreground)] text-[var(--background)] text-xs font-bold">10</span>
                    <span className="text-[var(--foreground-secondary)]">시가총액</span>
                  </div>
                </div>
                <p className="text-xs text-[var(--foreground-muted)] mt-4 leading-relaxed">
                  거래량 급증, 당일 가격 변동률, 5일/10일 수익률 추세, 적정 시가총액 구간을 종합 평가하여 최대 40점 만점으로 산정
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 오늘의 화제 종목 상세 */}
        <section className="mb-16 sm:mb-20 animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
          <div className="mb-8">
            <span className="section-caption">ANALYSIS</span>
            <h2 className="text-h2">상세 분석</h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="skeleton h-80" />
              <div className="skeleton h-80" />
            </div>
          ) : topStock && selectionCriteria ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <StockCard stock={topStock} isLarge={true} chartData={chartData} />
              <SelectionCriteriaCard criteria={selectionCriteria} stockSymbol={topStock.symbol} />
            </div>
          ) : (
            <div className="border border-[var(--border)] p-8 text-center">
              <p className="text-[var(--foreground-muted)]">화제 종목 데이터가 없습니다</p>
            </div>
          )}
        </section>

        {/* 관심 종목 - Horizontal Scroll Pan Style */}
        <section className="mb-16 sm:mb-20 animate-fade-in-up stagger-4" style={{ opacity: 0 }}>
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="section-caption">WATCHLIST</span>
              <h2 className="text-h2">관심 종목</h2>
            </div>
            <Link
              href="/favorites"
              className="text-sm font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors hover:underline underline-offset-4"
            >
              전체보기 →
            </Link>
          </div>

          {favoriteStocksPreview.length > 0 ? (
            <div className="scroll-section scrollbar-hide">
              {favoriteStocksPreview.map((stock) => {
                const isPositive = stock.change >= 0;
                return (
                  <div
                    key={stock.symbol}
                    className="w-[180px] sm:w-[200px] border border-[var(--border)] p-4 hover:border-[var(--foreground)] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-lg text-[var(--foreground)]">{stock.symbol}</span>
                      <FavoriteIcon stock={stock} size="sm" />
                    </div>
                    <p className={`text-xl font-bold ${isPositive ? 'price-up' : 'price-down'}`}>
                      ${stock.currentPrice.toFixed(2)}
                    </p>
                    <p className={`text-sm mt-1 ${isPositive ? 'price-up' : 'price-down'}`}>
                      {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-[var(--border)] p-8 text-center">
              <p className="text-[var(--foreground-muted)] text-sm leading-relaxed">
                관심 종목이 없습니다<br />
                종목 검색에서 별 아이콘을 눌러 추가하세요
              </p>
            </div>
          )}
        </section>

        {/* 최근 브리핑 */}
        <section className="mb-8 animate-fade-in-up stagger-5" style={{ opacity: 0 }}>
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="section-caption">HISTORY</span>
              <h2 className="text-h2">최근 브리핑</h2>
            </div>
            <Link
              href="/briefings"
              className="text-sm font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors hover:underline underline-offset-4"
            >
              전체보기 →
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-40" />
              ))}
            </div>
          ) : briefings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {briefings.slice(0, 3).map((briefing, index) => (
                <BriefingCard key={briefing.briefingId} briefing={briefing} index={index} />
              ))}
            </div>
          ) : (
            <div className="border border-[var(--border)] p-8 text-center">
              <p className="text-[var(--foreground-muted)] text-sm">브리핑 히스토리가 없습니다</p>
            </div>
          )}
        </section>
      </div>

      <PWAInstallPrompt />
      <PWAUpdatePrompt />
    </div>
  );
}
