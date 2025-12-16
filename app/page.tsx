'use client';

import { useState, useMemo, useEffect } from 'react';
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
import {
  mockAllStocks,
} from '@/data/mockData';
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
    // 관심 종목 로드 (로컬 - 즉시)
    setFavoriteSymbols(getFavorites());

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        // 핵심 데이터만 로드 (TOP 3 + 브리핑 미리보기)
        const [trendingRes, topNRes, briefingsRes] = await Promise.all([
          fetchTrendingStock('most_actives'),
          fetchTopNStocks('most_actives', 3),
          fetchBriefings(1, 3), // 미리보기용 3개만
        ]);

        // 화제 종목 (TOP 1)
        const adaptedTopStock = adaptStock(trendingRes.stock, trendingRes.score, 1);
        setTopStock(adaptedTopStock);

        // 선정 기준
        const adaptedCriteria = adaptSelectionCriteria(trendingRes.score, trendingRes.why_hot);
        setSelectionCriteria(adaptedCriteria);

        // TOP 3 종목
        const adaptedTrendingStocks = topNRes.stocks.map(adaptRankedStock);
        setTrendingStocks(adaptedTrendingStocks);

        // 브리핑 미리보기
        const adaptedBriefings = adaptBriefings(briefingsRes.briefings);
        setBriefings(adaptedBriefings);

        // 화제 종목 차트 데이터 로드
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

    // 로컬스토리지 변경 감지
    const handleStorage = () => {
      setFavoriteSymbols(getFavorites());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // 모든 종목 목록 - API 데이터 + 검색용 목업 데이터
  const allStocks = useMemo(() => {
    if (trendingStocks.length > 0) {
      return [...trendingStocks, ...mockAllStocks.filter(s => !trendingStocks.find(t => t.symbol === s.symbol))];
    }
    return mockAllStocks;
  }, [trendingStocks]);

  // 관심 종목 미리보기 (최대 5개)
  const favoriteStocksPreview = useMemo(() => {
    return favoriteSymbols
      .slice(0, 5)
      .map(symbol => allStocks.find(s => s.symbol === symbol))
      .filter((s): s is Stock => s !== undefined);
  }, [favoriteSymbols, allStocks]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-blue-50/30 dark:from-black dark:via-gray-900 dark:to-blue-900/20 text-gray-900 dark:text-white transition-colors duration-300">
      {/* 배경 애니메이션 파티클 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="particle w-32 h-32 top-10 left-10 opacity-20" style={{ animationDelay: '0s' }}></div>
        <div className="particle w-24 h-24 top-1/4 right-20 opacity-15" style={{ animationDelay: '2s' }}></div>
        <div className="particle w-40 h-40 bottom-20 left-1/4 opacity-10" style={{ animationDelay: '4s' }}></div>
        <div className="particle w-28 h-28 bottom-1/4 right-1/3 opacity-20" style={{ animationDelay: '6s' }}></div>
        <div className="particle w-36 h-36 top-1/2 left-1/2 opacity-15" style={{ animationDelay: '8s' }}></div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl relative z-10">
        {/* Header */}
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* 로고 */}
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl gradient-dark flex items-center justify-center shadow-glow overflow-hidden logo-heartbeat">
                  <img
                    src="/logo-main.png"
                    alt="로고"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      if (target.parentElement) {
                        target.parentElement.innerHTML = '<span class="text-2xl animate-float">🌙</span>';
                      }
                    }}
                  />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse glow-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold gradient-text bg-clip-text text-transparent text-glow">
                  당신이 잠든 사이
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">오늘의 화제 종목 대시보드</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Navigation />
              <ThemeToggle />
              <CreateBriefingButton />
            </div>
          </div>
          {/* 종목 검색바 */}
          <div className="flex justify-center">
            <StockSearchBar stocks={allStocks} />
          </div>
        </div>

        {/* 화제 종목 TOP 3 비교 - 핵심 콘텐츠 */}
        <div className="mb-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-48"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">데이터 로드 실패: {error}</div>
          ) : (
            <Top3Comparison stocks={trendingStocks} />
          )}
        </div>

        {/* 복합점수 산정 기준 안내 */}
        <div className="mb-10 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">복합점수 산정 기준</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  <span className="text-gray-600 dark:text-gray-400">거래량 (10점)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-gray-600 dark:text-gray-400">가격변동 (10점)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="text-gray-600 dark:text-gray-400">모멘텀 (10점)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span className="text-gray-600 dark:text-gray-400">시가총액 (10점)</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                평소 대비 거래량 급증, 당일 가격 변동률, 5일/10일 수익률 추세, 적정 시가총액 구간을 종합 평가하여 최대 40점 만점으로 순위를 산정합니다.
              </p>
            </div>
          </div>
        </div>

        {/* 오늘의 화제 종목 상세 */}
        <div className="mb-10 relative z-0">
          <h2 className="text-xl font-bold mb-4 gradient-text bg-clip-text text-transparent">오늘의 화제 종목</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-64"></div>
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-64"></div>
            </div>
          ) : topStock && selectionCriteria ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StockCard
                stock={topStock}
                isLarge={true}
                chartData={chartData}
              />
              <SelectionCriteriaCard
                criteria={selectionCriteria}
                stockSymbol={topStock.symbol}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">화제 종목 데이터가 없습니다</div>
          )}
        </div>

        {/* 관심 종목 미리보기 */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold gradient-text bg-clip-text text-transparent">관심 종목</h2>
            <Link
              href="/favorites"
              className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
            >
              전체보기
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {favoriteStocksPreview.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {favoriteStocksPreview.map((stock) => {
                const isPositive = stock.change >= 0;
                return (
                  <div
                    key={stock.symbol}
                    className="flex-shrink-0 bg-white dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700 min-w-[160px]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">{stock.symbol}</span>
                      <FavoriteIcon stock={stock} size="sm" />
                    </div>
                    <p className={`text-lg font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      ${stock.currentPrice.toFixed(2)}
                    </p>
                    <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 bg-white/50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                관심 종목이 없습니다. 종목 검색에서 ⭐를 눌러 추가하세요
              </p>
            </div>
          )}
        </div>

        {/* 최근 브리핑 미리보기 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold gradient-text bg-clip-text text-transparent">최근 브리핑</h2>
            <Link
              href="/briefings"
              className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
            >
              전체보기
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-32"></div>
              ))}
            </div>
          ) : briefings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {briefings.slice(0, 3).map((briefing, index) => (
                <BriefingCard key={briefing.briefingId} briefing={briefing} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-white/50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-sm">브리핑 히스토리가 없습니다</p>
            </div>
          )}
        </div>
      </div>

      <PWAInstallPrompt />
      <PWAUpdatePrompt />
    </div>
  );
}
