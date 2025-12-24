'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import ThemeToggle from '@/components/ThemeToggle';
import StockDetailModal from '@/components/StockDetailModal';
import FavoriteIcon from '@/components/FavoriteIcon';
import AnimatedNumber from '@/components/AnimatedNumber';
import Logo from '@/components/Logo';
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
        console.error('Failed to load stock data:', err);
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
      {/* Top Bar - Musinsa Style */}
      <div className="border-b-[3px] border-[var(--foreground)] bg-[var(--background)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-16 sm:h-20">
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

            <div className="flex items-center gap-2 sm:gap-3">
              <Navigation />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        {/* Page Hero */}
        <section className="mb-12 sm:mb-16 animate-fade-in-up">
          <span className="text-overline mb-4 block">MY PICKS</span>
          <h2 className="font-bebas text-4xl sm:text-5xl lg:text-6xl leading-[0.9] text-[var(--foreground)] mb-4">
            WATCH<br />
            <span className="text-[var(--accent)]">LIST</span>
          </h2>
          <p className="text-body text-[var(--foreground-secondary)] max-w-lg">
            {favoriteStocks.length > 0
              ? `Managing ${favoriteStocks.length} stocks in your watchlist.`
              : 'Add stocks to your watchlist to track them here.'}
          </p>
        </section>

        {/* Divider */}
        <div className="section-divider-bold mb-12 sm:mb-16" />

        {/* Sort Controls */}
        <section className="mb-8 animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="section-caption">FILTER</span>
              <h3 className="section-title">Sort By</h3>
            </div>
            <div className="flex items-center gap-0 border-2 border-[var(--foreground)]">
              {[
                { value: 'added', label: 'ADDED' },
                { value: 'name', label: 'NAME' },
                { value: 'change', label: 'CHANGE' },
                { value: 'volume', label: 'VOL' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value as SortOption)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                    sortBy === option.value
                      ? 'bg-[var(--foreground)] text-[var(--background)]'
                      : 'text-[var(--foreground)] hover:bg-[var(--background-secondary)]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Favorites Grid */}
        {favoriteStocks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {favoriteStocks.map((stock, index) => {
              const isPositive = stock.change >= 0;
              return (
                <div
                  key={stock.symbol}
                  onClick={() => setSelectedStock(stock)}
                  className="group border-2 border-[var(--border)] hover:border-[var(--foreground)] cursor-pointer transition-all animate-fade-in-up overflow-hidden"
                  style={{ animationDelay: `${0.1 + index * 0.03}s`, opacity: 0 }}
                >
                  {/* Top Line Animation */}
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--foreground)] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-black text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                            {stock.shortName}
                          </h3>
                          <div onClick={(e) => e.stopPropagation()}>
                            <FavoriteIcon stock={stock} size="sm" />
                          </div>
                        </div>
                        <p className="text-xs text-[var(--foreground-muted)] truncate uppercase tracking-wide">
                          {stock.symbol}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className={`text-2xl font-black ${isPositive ? 'price-up' : 'price-down'}`}>
                          <AnimatedNumber
                            value={stock.currentPrice}
                            prefix={/^\d{6}$/.test(stock.symbol) ? '₩' : '$'}
                            decimals={/^\d{6}$/.test(stock.symbol) ? 0 : 2}
                            duration={1}
                          />
                        </p>
                        <p className={`text-sm font-bold ${isPositive ? 'price-up' : 'price-down'}`}>
                          {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex justify-between text-xs font-bold text-[var(--foreground-muted)] pt-4 border-t border-[var(--border)] uppercase tracking-wide">
                      <span>VOL {(stock.volume / 1000000).toFixed(1)}M</span>
                      <span>CAP ${(stock.marketCap / 1000000000).toFixed(1)}B</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border-2 border-dashed border-[var(--border)] p-12 sm:p-16 text-center animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
            <div className="w-16 h-16 mx-auto mb-6 border-2 border-[var(--foreground-muted)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--foreground-muted)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-[var(--foreground)] mb-3 uppercase tracking-wide">
              No Favorites Yet
            </h3>
            <p className="text-sm text-[var(--foreground-muted)] mb-6 leading-relaxed">
              Search for stocks and click the star icon<br />
              to add them to your watchlist.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--foreground)] text-[var(--background)] font-bold text-xs uppercase tracking-wider hover:bg-transparent hover:text-[var(--foreground)] border-2 border-[var(--foreground)] transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Stocks
            </Link>
          </div>
        )}
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

      {/* Stock Detail Modal */}
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
