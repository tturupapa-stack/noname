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
      className={`card-glass p-6 transition-smooth hover-lift ${
        isLarge ? 'col-span-full lg:col-span-1' : ''
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-bold text-xl sm:text-2xl">{stock.symbol}</h3>
            <span className="text-sm opacity-60">{stock.shortName}</span>
            <FavoriteIcon stock={stock} size={isLarge ? 'md' : 'sm'} />
          </div>

          {/* 가격 정보 */}
          <div className="flex items-baseline gap-3">
            <span className={`text-2xl sm:text-3xl font-bold ${isPositive ? 'price-up' : 'price-down'}`}>
              <AnimatedNumber
                value={stock.currentPrice}
                prefix="$"
                decimals={2}
                duration={1.5}
              />
            </span>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${isPositive ? 'price-up-bg' : 'price-down-bg'}`}>
              <span className={`text-sm font-semibold ${isPositive ? 'price-up' : 'price-down'}`}>
                {isPositive ? '+' : ''}
                <AnimatedNumber
                  value={stock.change}
                  decimals={2}
                  duration={1.5}
                />
              </span>
              <span className={`text-sm font-semibold ${isPositive ? 'price-up' : 'price-down'}`}>
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
          <div className="text-right">
            <div className="text-xs opacity-50 mb-1">복합 점수</div>
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
          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div className="flex justify-between">
              <span className="opacity-50">거래량</span>
              <span className="font-medium">
                <AnimatedNumber
                  value={stock.volume / 1000000}
                  suffix="M"
                  decimals={1}
                  duration={1.5}
                />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-50">시가총액</span>
              <span className="font-medium">
                $<AnimatedNumber
                  value={stock.marketCap / 1000000000}
                  suffix="B"
                  decimals={1}
                  duration={1.5}
                />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-50">섹터</span>
              <span className="font-medium truncate ml-2">{stock.sector}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-50">산업</span>
              <span className="font-medium truncate ml-2">{stock.industry}</span>
            </div>
          </div>

          {/* 차트 */}
          {chartData && chartData.length > 0 && (
            <div className="pt-6 border-t border-[var(--card-border)]">
              <h4 className="text-sm font-semibold opacity-70 mb-4">
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
