'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import ThemeToggle from '@/components/ThemeToggle';
import StockDetailModal from '@/components/StockDetailModal';
import FavoriteIcon from '@/components/FavoriteIcon';
import AnimatedNumber from '@/components/AnimatedNumber';
import { Stock } from '@/types';
import { getFavorites } from '@/utils/favoriteStorage';
import { mockAllStocks } from '@/data/mockData';
import { fetchTopNStocks } from '@/services/api';
import { adaptRankedStock } from '@/services/apiAdapters';

type SortOption = 'added' | 'name' | 'change' | 'volume';

export default function FavoritesPage() {
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>([]);
  const [allStocks, setAllStocks] = useState<Stock[]>(mockAllStocks);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('added');

  useEffect(() => {
    setFavoriteSymbols(getFavorites().map(f => f.id));

    async function loadStocks() {
      try {
        const response = await fetchTopNStocks('most_actives', 10);
        const adapted = response.stocks.map(adaptRankedStock);
        setAllStocks([...adapted, ...mockAllStocks.filter(s => !adapted.find(a => a.symbol === s.symbol))]);
      } catch (err) {
        console.error('종목 데이터 로드 실패:', err);
      }
    }
    loadStocks();

    const handleStorage = () => {
      setFavoriteSymbols(getFavorites().map(f => f.id));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const favoriteStocks = useMemo(() => {
    const stocks = favoriteSymbols
      .map(symbol => allStocks.find(s => s.symbol === symbol))
      .filter((s): s is Stock => s !== undefined);

    switch (sortBy) {
      case 'name':
        return [...stocks].sort((a, b) => a.shortName.localeCompare(b.shortName));
      case 'change':
        return [...stocks].sort((a, b) => b.changePercent - a.changePercent);
      case 'volume':
        return [...stocks].sort((a, b) => b.volume - a.volume);
      default:
        return stocks;
    }
  }, [favoriteSymbols, allStocks, sortBy]);

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
        <section className="mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '0.05s', opacity: 0 }}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="section-header mb-2">
                <h2 className="section-title text-xl sm:text-2xl">관심 종목</h2>
              </div>
              <p className="text-sm text-[var(--foreground-secondary)]">
                {favoriteStocks.length}개의 종목을 관리하고 있습니다
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--foreground-muted)]">정렬</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="input select py-2 px-4 text-sm w-auto min-w-[120px]"
              >
                <option value="added">추가순</option>
                <option value="name">이름순</option>
                <option value="change">변동률순</option>
                <option value="volume">거래량순</option>
              </select>
            </div>
          </div>
        </section>

        {/* 관심 종목 목록 */}
        {favoriteStocks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {favoriteStocks.map((stock, index) => {
              const isPositive = stock.change >= 0;
              return (
                <div
                  key={stock.symbol}
                  className="card-glass p-5 cursor-pointer hover-lift transition-smooth animate-fade-in-up"
                  style={{ animationDelay: `${0.1 + index * 0.03}s`, opacity: 0 }}
                  onClick={() => setSelectedStock(stock)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">{stock.symbol}</h3>
                        <FavoriteIcon stock={stock} size="sm" />
                      </div>
                      <p className="text-sm text-[var(--foreground-muted)] truncate">{stock.shortName}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className={`text-xl sm:text-2xl font-bold ${isPositive ? 'price-up' : 'price-down'}`}>
                        <AnimatedNumber value={stock.currentPrice} prefix="$" decimals={2} duration={1} />
                      </p>
                      <p className={`text-sm font-medium ${isPositive ? 'price-up' : 'price-down'}`}>
                        {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-[var(--foreground-muted)] pt-3 border-t border-[var(--border)]">
                    <span>거래량 {(stock.volume / 1000000).toFixed(1)}M</span>
                    <span>시총 ${(stock.marketCap / 1000000000).toFixed(1)}B</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card-glass p-10 sm:p-12 text-center animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 rounded-full bg-[var(--primary-100)] dark:bg-[rgba(255,107,77,0.15)] flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--primary-500)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-[var(--foreground)] mb-2">관심 종목이 없습니다</h3>
            <p className="text-sm text-[var(--foreground-muted)] mb-6 leading-relaxed">
              종목 검색에서 별 아이콘을 클릭하여<br />
              관심 종목을 추가해보세요
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary-500)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-600)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              종목 검색하기
            </Link>
          </div>
        )}
      </div>

      {/* 종목 상세 모달 */}
      {selectedStock && (
        <StockDetailModal
          stock={selectedStock}
          isOpen={!!selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      )}
    </div>
  );
}
