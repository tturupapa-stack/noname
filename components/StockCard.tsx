'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Stock, PriceData } from '@/types';
import StockChart from './StockChart';
import FavoriteIcon from './FavoriteIcon';
import AnimatedNumber from './AnimatedNumber';

interface StockCardProps {
  stock: Stock;
  isLarge?: boolean;
  chartData?: PriceData[];
}

function StockCard({
  stock,
  isLarge = false,
  chartData,
}: StockCardProps) {
  const isPositive = stock.change >= 0;

  return (
    <div
      className={`group border-2 border-[var(--border)] hover:border-[var(--foreground)] transition-all relative isolate overflow-hidden ${
        isLarge ? 'col-span-full lg:col-span-1 h-full' : ''
      }`}
    >
      {/* Header with Score Badge */}
      <div className="flex items-start justify-between p-5 sm:p-6 border-b border-[var(--border)]">
        <div className="flex-1 min-w-0">
          {/* Name & Symbol */}
          <div className="flex items-center gap-3 mb-2">
            <Link href={`/stock/${stock.symbol}`}>
              <h3 className="font-black text-2xl sm:text-3xl text-[var(--foreground)] hover:text-[var(--accent)] transition-colors cursor-pointer">
                {stock.shortName}
              </h3>
            </Link>
            <FavoriteIcon stock={stock} size={isLarge ? 'md' : 'sm'} />
          </div>
          <Link href={`/stock/${stock.symbol}`} className="inline-block">
            <p className="text-xs text-[var(--foreground-muted)] uppercase tracking-wide hover:text-[var(--accent)] transition-colors">
              {stock.symbol}
            </p>
          </Link>

          {/* Price Display */}
          <div className="flex items-baseline gap-3 mt-4 flex-wrap">
            <span className={`text-3xl sm:text-4xl font-black ${isPositive ? 'price-up' : 'price-down'}`}>
              <AnimatedNumber
                value={stock.currentPrice}
                prefix={/^\d{6}$/.test(stock.symbol) ? '₩' : '$'}
                decimals={/^\d{6}$/.test(stock.symbol) ? 0 : 2}
                duration={1.5}
              />
            </span>
            <div className={`inline-flex items-center gap-1 px-2 py-1 text-sm font-bold ${isPositive ? 'price-up-bg' : 'price-down-bg'}`}>
              <span>
                {isPositive ? '+' : ''}
                <AnimatedNumber
                  value={stock.change}
                  decimals={2}
                  duration={1.5}
                />
              </span>
              <span className="opacity-70">|</span>
              <span>
                <AnimatedNumber
                  value={stock.changePercent}
                  prefix={isPositive ? '+' : ''}
                  suffix="%"
                  decimals={2}
                  duration={1.5}
                />
              </span>
            </div>
          </div>
        </div>

        {/* Score Badge - Large Style */}
        {isLarge && (
          <div className="flex-shrink-0 ml-4 text-right">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-2">
              Score
            </div>
            <div className="w-16 h-16 bg-[var(--foreground)] flex items-center justify-center">
              <span className="text-2xl font-black text-[var(--background)]">
                <AnimatedNumber
                  value={stock.compositeScore}
                  decimals={1}
                  duration={1.5}
                />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Details Grid (Large Mode Only) */}
      {isLarge && (
        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
            {[
              { label: 'VOLUME', value: `${(stock.volume / 1000000).toFixed(1)}M` },
              { label: 'MARKET CAP', value: `$${(stock.marketCap / 1000000000).toFixed(1)}B` },
              { label: 'SECTOR', value: stock.sector },
              { label: 'INDUSTRY', value: stock.industry },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-[var(--border)]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">
                  {item.label}
                </span>
                <span className="font-bold text-sm text-[var(--foreground)] truncate ml-2 max-w-[60%] text-right">
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Chart Section */}
          {chartData && chartData.length > 0 && (
            <div className="pt-4 border-t border-[var(--border)] relative isolate overflow-hidden">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-4">
                5-Day Price Trend
              </h4>
              <div className="chart-container">
                <StockChart data={chartData} isPositive={isPositive} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(StockCard);
