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

export default function FavoritesPage() {
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>([]);
  const [allStocks, setAllStocks] = useState<Stock[]>(mockAllStocks);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('added');
  const [stars, setStars] = useState<Array<{id: number; left: string; top: string; animationDelay: string; size: number}>>([]);

  useEffect(() => {
    setStars(generateStars(40));
  }, []);

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
        <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="section-header mb-0">
              <h2 className="section-title text-2xl sm:text-3xl">관심 종목</h2>
              <p className="text-sm opacity-60 mt-2">
                {favoriteStocks.length}개의 종목을 관리하고 있습니다
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm opacity-50">정렬</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 rounded-xl bg-white/80 dark:bg-[#1a1a2e]/80 border border-[var(--card-border)] text-sm backdrop-blur-sm transition-smooth focus:outline-none focus:ring-2 focus:ring-[#ff7e5f]/50"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {favoriteStocks.map((stock, index) => {
              const isPositive = stock.change >= 0;
              return (
                <div
                  key={stock.symbol}
                  className="card-glass p-5 cursor-pointer hover-lift transition-smooth animate-fade-in-up"
                  style={{ animationDelay: `${0.15 + index * 0.05}s`, opacity: 0 }}
                  onClick={() => setSelectedStock(stock)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold">{stock.symbol}</h3>
                        <FavoriteIcon stock={stock} size="sm" />
                      </div>
                      <p className="text-sm opacity-50 line-clamp-1">{stock.shortName}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${isPositive ? 'price-up' : 'price-down'}`}>
                        <AnimatedNumber value={stock.currentPrice} prefix="$" decimals={2} duration={1} />
                      </p>
                      <p className={`text-sm font-medium ${isPositive ? 'price-up' : 'price-down'}`}>
                        {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm opacity-50 pt-3 border-t border-[var(--card-border)]">
                    <span>거래량 {(stock.volume / 1000000).toFixed(1)}M</span>
                    <span>시총 ${(stock.marketCap / 1000000000).toFixed(1)}B</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card-glass p-12 text-center animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#ff7e5f]/20 to-[#feb47b]/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-[#ff7e5f]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">관심 종목이 없습니다</h3>
            <p className="opacity-60 mb-6 text-sm leading-relaxed">
              종목 검색에서 ⭐ 아이콘을 클릭하여<br />
              관심 종목을 추가해보세요
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ff7e5f] to-[#feb47b] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#ff7e5f]/25 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
