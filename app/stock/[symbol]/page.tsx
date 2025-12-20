'use client';

import { use, useState, useEffect } from 'react';
import { Stock, PriceData } from '@/types';
import Link from 'next/link';
import StockChart from '@/components/StockChart';
import FavoriteIcon from '@/components/FavoriteIcon';
import AnimatedNumber from '@/components/AnimatedNumber';
import ThemeToggle from '@/components/ThemeToggle';
import Navigation from '@/components/Navigation';
import { fetchStockDetail, fetchStockChart } from '@/services/api';
import { adaptStockDetail, adaptChartData } from '@/services/apiAdapters';

interface StockDetailPageProps {
  params: Promise<{ symbol: string }>;
}

export default function StockDetailPage({ params }: StockDetailPageProps) {
  const { symbol } = use(params);
  const [stock, setStock] = useState<Stock | null>(null);
  const [chartData, setChartData] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStockData() {
      setIsLoading(true);
      setError(null);

      try {
        const [stockRes, chartRes] = await Promise.all([
          fetchStockDetail(symbol),
          fetchStockChart(symbol, '5d'),
        ]);

        const adaptedStock = adaptStockDetail(stockRes.stock);
        setStock(adaptedStock);

        const adaptedChartData = adaptChartData(chartRes.data);
        setChartData(adaptedChartData);
      } catch (err) {
        console.error('Failed to load stock data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }

    loadStockData();
  }, [symbol]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-[var(--foreground)] border-t-transparent animate-spin" />
          <p className="text-sm font-bold uppercase tracking-widest text-[var(--foreground-muted)]">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center border-2 border-[var(--foreground)] p-10 max-w-md mx-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-[var(--danger)] flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-black mb-3 uppercase tracking-wide">
            {error || 'Stock Not Found'}
          </h1>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--foreground)] font-bold text-xs uppercase tracking-wider hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isPositive = stock.change >= 0;

  const formatPrice = (price: number) => {
    return stock.symbol.length === 6 ? `${price.toLocaleString()}` : `$${price.toFixed(2)}`;
  };

  const formatMarketCap = (marketCap: number) => {
    if (stock.symbol.length === 6) {
      return `${(marketCap / 1000000000000).toFixed(1)}T`;
    }
    if (marketCap >= 1000000000000) {
      return `$${(marketCap / 1000000000000).toFixed(2)}T`;
    }
    return `$${(marketCap / 1000000000).toFixed(1)}B`;
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Top Bar - Musinsa Style */}
      <div className="border-b-[3px] border-[var(--foreground)] bg-[var(--background)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--foreground)] flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                <img
                  src="/logo-main.png"
                  alt="Logo"
                  className="w-full h-full object-cover invert dark:invert-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      target.parentElement.innerHTML = '<span class="text-[var(--background)] font-black text-xl">W</span>';
                    }
                  }}
                />
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
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] font-bold text-xs uppercase tracking-wider transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Hero Section */}
        <section className="mb-12 sm:mb-16 animate-fade-in-up">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <div>
              <span className="text-overline mb-4 block">STOCK DETAIL</span>
              <div className="flex items-center gap-4 mb-4">
                <h2 className="font-bebas text-5xl sm:text-6xl lg:text-7xl leading-[0.85] text-[var(--foreground)]">
                  {stock.symbol}
                </h2>
                {stock.rank > 0 && (
                  <span className="inline-flex items-center justify-center w-10 h-10 bg-[var(--accent)] text-white font-black text-lg">
                    #{stock.rank}
                  </span>
                )}
                <FavoriteIcon stock={stock} size="md" />
              </div>
              <p className="text-body text-[var(--foreground-secondary)] uppercase tracking-wide">
                {stock.shortName}
              </p>
            </div>

            {/* Price Display - Big */}
            <div className="lg:text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-2">
                Current Price
              </div>
              <div className={`font-bebas text-5xl sm:text-6xl lg:text-7xl leading-none ${isPositive ? 'price-up' : 'price-down'}`}>
                <AnimatedNumber
                  value={stock.currentPrice}
                  prefix={stock.symbol.length === 6 ? '' : '$'}
                  decimals={stock.symbol.length === 6 ? 0 : 2}
                  duration={1.5}
                />
              </div>
              <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 text-lg font-bold ${isPositive ? 'price-up-bg' : 'price-down-bg'}`}>
                <span>
                  {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </span>
                <span className="opacity-70">|</span>
                <span>
                  {isPositive ? '+' : ''}{formatPrice(Math.abs(stock.change))}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="section-divider-bold mb-12 sm:mb-16" />

        {/* Stats Grid */}
        <section className="mb-12 sm:mb-16 animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { label: 'Volume', value: `${(stock.volume / 1000000).toFixed(1)}M` },
              { label: 'Market Cap', value: formatMarketCap(stock.marketCap) },
              { label: 'Sector', value: stock.sector || 'N/A' },
              { label: 'Industry', value: stock.industry || 'N/A' },
            ].map((item) => (
              <div key={item.label} className="border-2 border-[var(--border)] p-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-2">
                  {item.label}
                </div>
                <div className="text-lg sm:text-xl font-black text-[var(--foreground)] truncate">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Detail Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {/* Basic Info */}
          <div className="border-2 border-[var(--border)] animate-fade-in-up stagger-2" style={{ opacity: 0 }}>
            <div className="p-5 border-b border-[var(--border)]">
              <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wide flex items-center gap-2">
                <span className="w-1 h-4 bg-[var(--foreground)]" />
                Basic Info
              </h3>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'Symbol', value: stock.symbol },
                { label: 'Name', value: stock.shortName },
                { label: 'Market Cap', value: formatMarketCap(stock.marketCap) },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--foreground-muted)]">
                    {item.label}
                  </span>
                  <span className="font-bold text-[var(--foreground)]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trading Info */}
          <div className="border-2 border-[var(--border)] animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
            <div className="p-5 border-b border-[var(--border)]">
              <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wide flex items-center gap-2">
                <span className="w-1 h-4 bg-[var(--foreground)]" />
                Trading Info
              </h3>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'Volume', value: `${stock.volume.toLocaleString()} shares` },
                { label: 'Change %', value: `${isPositive ? '+' : ''}${stock.changePercent.toFixed(2)}%`, isColored: true },
                { label: 'Change', value: `${isPositive ? '+' : ''}${formatPrice(Math.abs(stock.change))}`, isColored: true },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--foreground-muted)]">
                    {item.label}
                  </span>
                  <span className={`font-bold ${item.isColored ? (isPositive ? 'price-up' : 'price-down') : 'text-[var(--foreground)]'}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Chart Section */}
        <section className="animate-fade-in-up stagger-4" style={{ opacity: 0 }}>
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="section-caption">PERFORMANCE</span>
              <h3 className="section-title">5-Day Price Trend</h3>
            </div>
          </div>
          <div className="border-2 border-[var(--border)] p-5 sm:p-6 relative isolate overflow-hidden">
            {chartData.length > 0 ? (
              <div className="chart-container">
                <StockChart data={chartData} isPositive={isPositive} />
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 border-2 border-[var(--foreground-muted)] flex items-center justify-center">
                  <svg className="w-8 h-8 text-[var(--foreground-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <p className="text-sm font-bold uppercase tracking-wide text-[var(--foreground-muted)]">
                  No Chart Data Available
                </p>
              </div>
            )}
          </div>
        </section>
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
    </div>
  );
}
