'use client';

import { useEffect, useRef, useState } from 'react';
import { Stock, PriceData } from '@/types';
import Link from 'next/link';
import FavoriteIcon from './FavoriteIcon';
import StockChart from './StockChart';
import AnimatedNumber from './AnimatedNumber';
import { fetchStockChart } from '@/services/api';
import { adaptChartData } from '@/services/apiAdapters';

interface StockDetailModalProps {
  stock: Stock;
  isOpen: boolean;
  onClose: () => void;
}

export default function StockDetailModal({
  stock,
  isOpen,
  onClose,
}: StockDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [chartData, setChartData] = useState<PriceData[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    async function loadChartData() {
      if (!isOpen || !stock) return;

      setIsChartLoading(true);
      try {
        const chartRes = await fetchStockChart(stock.symbol, '5d');
        const adaptedChartData = adaptChartData(chartRes.data);
        setChartData(adaptedChartData);
      } catch (err) {
        console.error('Failed to load chart:', err);
        setChartData([]);
      } finally {
        setIsChartLoading(false);
      }
    }

    loadChartData();
  }, [isOpen, stock]);

  if (!isOpen) return null;

  const isPositive = stock.change >= 0;

  const isKoreanStock = /^\d{6}$/.test(stock.symbol);

  const formatPrice = (price: number) => {
    return isKoreanStock ? `₩${price.toLocaleString()}` : `$${price.toFixed(2)}`;
  };

  const formatMarketCap = (marketCap: number) => {
    if (isKoreanStock) {
      return `₩${(marketCap / 1000000000000).toFixed(1)}T`;
    }
    if (marketCap >= 1000000000000) {
      return `$${(marketCap / 1000000000000).toFixed(2)}T`;
    }
    return `$${(marketCap / 1000000000).toFixed(1)}B`;
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 modal-backdrop"
      style={{ zIndex: 'var(--z-modal-backdrop)' }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--background)] border-2 border-[var(--foreground)] overflow-hidden flex flex-col animate-scale-in modal-content"
        style={{ zIndex: 'var(--z-modal)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Musinsa Style */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b-2 border-[var(--foreground)]">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="font-bebas text-3xl sm:text-4xl text-[var(--foreground)]">
                {stock.shortName}
              </h2>
              <p className="text-xs text-[var(--foreground-muted)] uppercase tracking-wide">
                {stock.symbol}
              </p>
            </div>
            <FavoriteIcon stock={stock} size="md" />
            {stock.rank > 0 && (
              <span className="inline-flex items-center justify-center w-8 h-8 bg-[var(--accent)] text-white font-black text-sm">
                #{stock.rank}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center border-2 border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {/* Price Info - Bold Display */}
          <div className={`border-2 p-5 sm:p-6 mb-6 ${isPositive ? 'border-[var(--success)]' : 'border-[var(--danger)]'}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-2">
                  Current Price
                </div>
                <div className={`text-2xl sm:text-3xl font-black ${isPositive ? 'price-up' : 'price-down'}`}>
                  <AnimatedNumber
                    value={stock.currentPrice}
                    prefix={isKoreanStock ? '₩' : '$'}
                    decimals={isKoreanStock ? 0 : 2}
                    duration={1}
                  />
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-2">
                  Change
                </div>
                <div className={`text-xl sm:text-2xl font-black ${isPositive ? 'price-up' : 'price-down'}`}>
                  {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </div>
                <div className={`text-sm font-bold ${isPositive ? 'price-up' : 'price-down'} mt-1`}>
                  {isPositive ? '+' : ''}{formatPrice(Math.abs(stock.change))}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-2">
                  Volume
                </div>
                <div className="text-xl sm:text-2xl font-black text-[var(--foreground)]">
                  {(stock.volume / 1000000).toFixed(1)}M
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-2">
                  Score
                </div>
                <div className="text-xl sm:text-2xl font-black text-[var(--foreground)]">
                  {stock.compositeScore.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Detail Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* Basic Info */}
            <div className="border-2 border-[var(--border)]">
              <div className="p-4 border-b border-[var(--border)]">
                <h3 className="text-xs font-black text-[var(--foreground)] uppercase tracking-wide flex items-center gap-2">
                  <span className="w-1 h-3 bg-[var(--foreground)]" />
                  Basic Info
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { label: 'Sector', value: stock.sector || 'N/A' },
                  { label: 'Industry', value: stock.industry || 'N/A' },
                  { label: 'Market Cap', value: formatMarketCap(stock.marketCap) },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">
                      {item.label}
                    </span>
                    <span className="font-bold text-sm text-[var(--foreground)] truncate ml-4 max-w-[50%] text-right">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trading Info */}
            <div className="border-2 border-[var(--border)]">
              <div className="p-4 border-b border-[var(--border)]">
                <h3 className="text-xs font-black text-[var(--foreground)] uppercase tracking-wide flex items-center gap-2">
                  <span className="w-1 h-3 bg-[var(--foreground)]" />
                  Trading Info
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { label: 'Volume', value: `${(stock.volume / 1000000).toFixed(1)}M shares` },
                  { label: 'Rank', value: stock.rank > 0 ? `#${stock.rank}` : 'N/A' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">
                      {item.label}
                    </span>
                    <span className="font-bold text-sm text-[var(--foreground)]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="border-2 border-[var(--border)] relative isolate overflow-hidden">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="text-xs font-black text-[var(--foreground)] uppercase tracking-wide flex items-center gap-2">
                <span className="w-1 h-3 bg-[var(--foreground)]" />
                5-Day Price Trend
              </h3>
            </div>
            <div className="p-4">
              {isChartLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-[var(--foreground)] border-t-transparent animate-spin" />
                  <span className="ml-3 text-sm font-bold uppercase tracking-widest text-[var(--foreground-muted)]">
                    Loading...
                  </span>
                </div>
              ) : chartData.length > 0 ? (
                <div className="chart-container">
                  <StockChart data={chartData} isPositive={isPositive} />
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm font-bold uppercase tracking-wide text-[var(--foreground-muted)]">
                    No Chart Data Available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 sm:p-6 border-t-2 border-[var(--foreground)]">
          <Link
            href={`/stock/${stock.symbol}`}
            className="px-6 py-2.5 bg-[var(--foreground)] text-[var(--background)] font-bold text-xs uppercase tracking-wider hover:bg-transparent hover:text-[var(--foreground)] border-2 border-[var(--foreground)] transition-all"
          >
            View Full Detail
          </Link>
          <button
            onClick={onClose}
            className="px-6 py-2.5 border-2 border-[var(--foreground)] text-[var(--foreground)] font-bold text-xs uppercase tracking-wider hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
