'use client';

import { memo } from 'react';
import { Stock } from '@/types';
import Link from 'next/link';
import FavoriteIcon from './FavoriteIcon';
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
  const isPositive = stock.change >= 0;

  const getRankClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'rank-1';
      case 2:
        return 'rank-2';
      case 3:
        return 'rank-3';
      default:
        return 'bg-[var(--foreground-muted)] text-white';
    }
  };

  return (
    <div
      className="animate-fade-in-up"
      style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}
    >
      <Link href={`/stock/${stock.symbol}`}>
        <div className="card-glass p-5 sm:p-6 h-full flex flex-col cursor-pointer transition-smooth hover-lift group">
          {/* 헤더: 순위 + 심볼 */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`rank-badge ${getRankClass(rank)}`}>
                {rank}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">{stock.symbol}</h3>
                  <FavoriteIcon stock={stock} size="sm" />
                </div>
                <p className="text-sm text-[var(--foreground-muted)] line-clamp-1">{stock.shortName}</p>
              </div>
            </div>
          </div>

          {/* 가격 정보 */}
          <div className="flex-1">
            <div className="mb-4">
              <div className="text-xs text-[var(--foreground-muted)] mb-1">현재가</div>
              <div className={`text-xl sm:text-2xl font-bold ${isPositive ? 'price-up' : 'price-down'}`}>
                <AnimatedNumber
                  value={stock.currentPrice}
                  prefix="$"
                  decimals={2}
                  duration={1.5}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div>
                <div className="text-xs text-[var(--foreground-muted)] mb-1">변동률</div>
                <div className={`font-semibold ${isPositive ? 'price-up' : 'price-down'}`}>
                  <AnimatedNumber
                    value={stock.changePercent}
                    prefix={isPositive ? '+' : ''}
                    suffix="%"
                    decimals={2}
                    duration={1.5}
                  />
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--foreground-muted)] mb-1">거래량</div>
                <div className="font-semibold text-[var(--foreground)]">
                  <AnimatedNumber
                    value={stock.volume / 1000000}
                    suffix="M"
                    decimals={1}
                    duration={1.5}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 하단: 복합 점수 */}
          <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-xs text-[var(--foreground-muted)]">복합 점수</span>
            <div className="flex items-center gap-2">
              <div className="w-20 sm:w-24 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--primary-500)] rounded-full transition-all duration-1000"
                  style={{ width: `${(stock.compositeScore / 40) * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold text-[var(--primary-500)]">
                <AnimatedNumber
                  value={stock.compositeScore}
                  decimals={1}
                  duration={1.5}
                />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default memo(Top3ComparisonCard);
