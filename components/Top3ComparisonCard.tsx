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

  return (
    <div
      className="animate-fade-in-up"
      style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}
    >
      <Link href={`/stock/${stock.symbol}`}>
        <div className="group relative border-2 border-[var(--border)] hover:border-[var(--foreground)] transition-all h-full overflow-hidden">
          {/* Top Line Animation */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--foreground)] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

          {/* Rank Badge - Musinsa Style */}
          <div className="absolute top-0 left-0 z-10">
            <div className={`w-10 h-10 flex items-center justify-center font-black text-lg ${
              rank === 1
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : rank === 2
                  ? 'bg-[var(--gray-700)] text-white dark:bg-[var(--gray-400)] dark:text-black'
                  : 'bg-[var(--gray-500)] text-white'
            }`}>
              {rank}
            </div>
          </div>

          {/* Content */}
          <div className="p-5 pt-14">
            {/* Name & Symbol */}
            <div className="flex items-start justify-between mb-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-xl sm:text-2xl font-black text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                  {stock.shortName}
                </h3>
                <p className="text-xs text-[var(--foreground-muted)] mt-1 uppercase tracking-wide">
                  {stock.symbol}
                </p>
              </div>
              <div onClick={(e) => e.preventDefault()}>
                <FavoriteIcon stock={stock} size="sm" />
              </div>
            </div>

            {/* Price */}
            <div className="mb-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-1">
                Current Price
              </div>
              <div className={`text-2xl sm:text-3xl font-black ${isPositive ? 'price-up' : 'price-down'}`}>
                <AnimatedNumber
                  value={stock.currentPrice}
                  prefix="$"
                  decimals={2}
                  duration={1.5}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-1">
                  Change
                </div>
                <div className={`font-bold ${isPositive ? 'price-up' : 'price-down'}`}>
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
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-1">
                  Volume
                </div>
                <div className="font-bold text-[var(--foreground)]">
                  <AnimatedNumber
                    value={stock.volume / 1000000}
                    suffix="M"
                    decimals={1}
                    duration={1.5}
                  />
                </div>
              </div>
            </div>

            {/* Score Bar */}
            <div className="mt-5 pt-5 border-t border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">
                  Composite Score
                </span>
                <span className="text-sm font-black text-[var(--foreground)]">
                  <AnimatedNumber
                    value={stock.compositeScore}
                    decimals={1}
                    duration={1.5}
                  />
                  <span className="text-[var(--foreground-muted)] font-normal">/40</span>
                </span>
              </div>
              <div className="h-1 bg-[var(--border)] overflow-hidden">
                <div
                  className="h-full bg-[var(--foreground)] transition-all duration-1000"
                  style={{ width: `${(stock.compositeScore / 40) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default memo(Top3ComparisonCard);
