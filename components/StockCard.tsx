'use client';

import { memo } from 'react';
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
      className={`card-glass p-5 sm:p-6 transition-smooth hover-lift ${
        isLarge ? 'col-span-full lg:col-span-1' : ''
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-1">
            <h3 className="font-bold text-lg sm:text-xl text-[var(--foreground)]">{stock.symbol}</h3>
            <span className="text-sm text-[var(--foreground-muted)] truncate">{stock.shortName}</span>
            <FavoriteIcon stock={stock} size={isLarge ? 'md' : 'sm'} />
          </div>

          {/* 가격 정보 */}
          <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
            <span className={`text-xl sm:text-2xl font-bold ${isPositive ? 'price-up' : 'price-down'}`}>
              <AnimatedNumber
                value={stock.currentPrice}
                prefix="$"
                decimals={2}
                duration={1.5}
              />
            </span>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-sm font-medium ${isPositive ? 'price-up-bg' : 'price-down-bg'}`}>
              <span>
                {isPositive ? '+' : ''}
                <AnimatedNumber
                  value={stock.change}
                  decimals={2}
                  duration={1.5}
                />
              </span>
              <span>
                (
                <AnimatedNumber
                  value={stock.changePercent}
                  prefix={isPositive ? '+' : ''}
                  suffix="%"
                  decimals={2}
                  duration={1.5}
                />
                )
              </span>
            </div>
          </div>
        </div>

        {/* 복합 점수 배지 */}
        {isLarge && (
          <div className="text-right flex-shrink-0 ml-4">
            <div className="text-xs text-[var(--foreground-muted)] mb-1">복합 점수</div>
            <div className="score-badge">
              <AnimatedNumber
                value={stock.compositeScore}
                decimals={1}
                duration={1.5}
              />
            </div>
          </div>
        )}
      </div>

      {/* 상세 정보 (isLarge일 때만) */}
      {isLarge && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm mb-5 sm:mb-6">
            <div className="flex justify-between">
              <span className="text-[var(--foreground-muted)]">거래량</span>
              <span className="font-medium text-[var(--foreground)]">
                <AnimatedNumber
                  value={stock.volume / 1000000}
                  suffix="M"
                  decimals={1}
                  duration={1.5}
                />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--foreground-muted)]">시가총액</span>
              <span className="font-medium text-[var(--foreground)]">
                $<AnimatedNumber
                  value={stock.marketCap / 1000000000}
                  suffix="B"
                  decimals={1}
                  duration={1.5}
                />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--foreground-muted)]">섹터</span>
              <span className="font-medium text-[var(--foreground)] truncate ml-2">{stock.sector}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--foreground-muted)]">산업</span>
              <span className="font-medium text-[var(--foreground)] truncate ml-2">{stock.industry}</span>
            </div>
          </div>

          {/* 차트 */}
          {chartData && chartData.length > 0 && (
            <div className="pt-5 sm:pt-6 border-t border-[var(--border)]">
              <h4 className="text-sm font-medium text-[var(--foreground-secondary)] mb-4">
                최근 5일간 주가 추이
              </h4>
              <StockChart data={chartData} isPositive={isPositive} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default memo(StockCard);
