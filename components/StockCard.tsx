'use client';

import { memo } from 'react';
import { Stock, PriceData } from '@/types';
import StockChart from './StockChart';
import FavoriteIcon from './FavoriteIcon';
import AnimatedCard from './AnimatedCard';
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
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
  const bgColor = isPositive ? 'bg-green-500/10' : 'bg-red-500/10';
  const borderColor = isPositive ? 'border-green-500/20' : 'border-red-500/20';

  return (
    <AnimatedCard
      direction="fade"
      delay={0}
      className={`rounded-lg border bg-gray-50 dark:bg-gray-900/50 p-6 backdrop-blur-sm transition-all hover:bg-gray-100 dark:hover:bg-gray-900/70 ${
        isLarge ? 'col-span-full md:col-span-2' : ''
      } ${borderColor}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className={`font-bold text-gray-900 dark:text-white ${isLarge ? 'text-2xl' : 'text-xl'}`}>
              {stock.symbol}
            </h3>
            <span className="text-sm text-gray-600 dark:text-gray-400">{stock.shortName}</span>
            <FavoriteIcon stock={stock} size={isLarge ? 'md' : 'sm'} />
          </div>
          <div className="flex items-baseline gap-3 mb-4">
            <span className={`text-3xl font-bold ${changeColor}`}>
              <AnimatedNumber
                value={stock.currentPrice}
                prefix="$"
                decimals={2}
                duration={1.5}
                className={changeColor}
              />
            </span>
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${bgColor}`}>
              <span className={`text-sm font-semibold ${changeColor}`}>
                {isPositive ? '+' : ''}
                <AnimatedNumber
                  value={stock.change}
                  prefix={isPositive ? '+' : ''}
                  decimals={2}
                  duration={1.5}
                  className={changeColor}
                />
              </span>
              <span className={`text-sm font-semibold ${changeColor}`}>
                (
                <AnimatedNumber
                  value={stock.changePercent}
                  prefix={isPositive ? '+' : ''}
                  suffix="%"
                  decimals={2}
                  duration={1.5}
                  className={changeColor}
                />
                )
              </span>
            </div>
          </div>
          {isLarge && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">거래량:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    <AnimatedNumber
                      value={stock.volume / 1000000}
                      suffix="M"
                      decimals={1}
                      duration={1.5}
                    />
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">시가총액:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    $
                    <AnimatedNumber
                      value={stock.marketCap / 1000000000}
                      suffix="B"
                      decimals={1}
                      duration={1.5}
                    />
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">섹터:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{stock.sector}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">산업:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{stock.industry}</span>
                </div>
              </div>
              {/* 주가 차트 */}
              {chartData && chartData.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    최근 5일간 주가 추이
                  </h4>
                  <StockChart data={chartData} isPositive={isPositive} />
                </div>
              )}
            </>
          )}
        </div>
        {isLarge && (
          <div className="text-right">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">복합 점수</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              <AnimatedNumber
                value={stock.compositeScore}
                decimals={1}
                duration={1.5}
              />
            </div>
          </div>
        )}
      </div>
    </AnimatedCard>
  );
}

export default memo(StockCard);

