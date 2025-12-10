'use client';

import { memo, useState } from 'react';
import { Stock } from '@/types';
import Link from 'next/link';
import FavoriteIcon from './FavoriteIcon';
import AnimatedCard from './AnimatedCard';
import AnimatedNumber from './AnimatedNumber';

interface Top3ComparisonCardProps {
  stock: Stock;
  rank: number;
  index?: number;
}

function Top3ComparisonCard({
  stock,
  rank,
  index = 0,
}: Top3ComparisonCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isPositive = stock.change >= 0;
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
  const bgColor = isPositive ? 'bg-green-500/10' : 'bg-red-500/10';
  const borderColor = isPositive ? 'border-green-500/20' : 'border-red-500/20';

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500 text-black';
      case 2:
        return 'bg-gray-400 text-black';
      case 3:
        return 'bg-orange-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getRankLabel = (rank: number) => {
    switch (rank) {
      case 1:
        return '1위';
      case 2:
        return '2위';
      case 3:
        return '3위';
      default:
        return `${rank}위`;
    }
  };

  return (
    <AnimatedCard
      direction="scale"
      delay={index * 150}
      className="relative z-10 h-full"
    >
      <Link href={`/stock/${stock.symbol}`}>
        <div
          className="relative rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-6 backdrop-blur-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-900/70 cursor-pointer h-full flex flex-col"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
        {/* 순위 뱃지 */}
        <div className="absolute top-4 right-4">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${getRankBadgeColor(
              rank
            )}`}
          >
            {rank}
          </div>
        </div>

        {/* 종목 정보 */}
        <div className="flex-1">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{stock.symbol}</h3>
              <FavoriteIcon stock={stock} size="sm" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {stock.shortName}
            </p>
          </div>

          {/* 주가 */}
          <div className="mb-4">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">주가</div>
            <div className={`text-2xl font-bold ${changeColor}`}>
              <AnimatedNumber
                value={stock.currentPrice}
                prefix="$"
                decimals={2}
                duration={1.5}
                className={changeColor}
              />
            </div>
          </div>

          {/* 변동률 */}
          <div className="mb-4">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">변동률</div>
            <div className={`flex items-center gap-2 ${changeColor}`}>
              <span className="text-lg font-semibold">
                <AnimatedNumber
                  value={stock.changePercent}
                  prefix={isPositive ? '+' : ''}
                  suffix="%"
                  decimals={2}
                  duration={1.5}
                  className={changeColor}
                />
              </span>
              <span className="text-sm">
                (
                <AnimatedNumber
                  value={stock.change}
                  prefix={isPositive ? '+' : ''}
                  decimals={2}
                  duration={1.5}
                  className={changeColor}
                />
                )
              </span>
            </div>
          </div>

          {/* 거래량 */}
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">거래량</div>
            <div className="text-base font-semibold text-gray-900 dark:text-white">
              <AnimatedNumber
                value={stock.volume / 1000000}
                suffix="M"
                decimals={1}
                duration={1.5}
              />
            </div>
          </div>
        </div>

        {/* 복합 점수 */}
        <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 dark:text-gray-400">복합 점수</span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              <AnimatedNumber
                value={stock.compositeScore}
                decimals={1}
                duration={1.5}
              />
            </span>
          </div>
        </div>

        {/* 호버 툴팁 */}
        {showTooltip && (
          <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl z-[50] hidden md:block">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">섹터:</span>
                <span className="text-gray-900 dark:text-white">{stock.sector}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">산업:</span>
                <span className="text-gray-900 dark:text-white">{stock.industry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">시가총액:</span>
                <span className="text-gray-900 dark:text-white">
                  ${(stock.marketCap / 1000000000).toFixed(1)}B
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">순위:</span>
                <span className="text-gray-900 dark:text-white">{getRankLabel(rank)}</span>
              </div>
            </div>
          </div>
        )}
        </div>
      </Link>
    </AnimatedCard>
  );
}

export default memo(Top3ComparisonCard);

