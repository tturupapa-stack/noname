'use client';

import { useEffect, useRef } from 'react';
import { Stock } from '@/types';
import Link from 'next/link';
import FavoriteIcon from './FavoriteIcon';
import StockChart from './StockChart';
import { mockTopStockChartData } from '@/data/mockData';

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

  if (!isOpen) return null;

  const isPositive = stock.change >= 0;
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
  const bgColor = isPositive ? 'bg-green-500/10' : 'bg-red-500/10';
  const borderColor = isPositive ? 'border-green-500/20' : 'border-red-500/20';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 dark:bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col z-[101]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {stock.symbol}
            </h2>
            <FavoriteIcon stock={stock} size="md" />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="닫기"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              {stock.shortName}
            </p>

            {/* 주가 정보 */}
            <div className={`rounded-lg border p-6 mb-6 ${borderColor} ${bgColor}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">현재가</div>
                  <div className={`text-3xl font-bold ${changeColor}`}>
                    {stock.symbol.length === 6 ? `₩${stock.currentPrice.toLocaleString()}` : `$${stock.currentPrice.toFixed(2)}`}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">변동률</div>
                  <div className={`text-2xl font-bold ${changeColor}`}>
                    {isPositive ? '+' : ''}
                    {stock.changePercent.toFixed(2)}%
                  </div>
                  <div className={`text-sm ${changeColor} mt-1`}>
                    {isPositive ? '+' : ''}
                    {stock.symbol.length === 6 ? `${stock.change.toLocaleString()}` : `${stock.change.toFixed(2)}`}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">거래량</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(stock.volume / 1000000).toFixed(1)}M
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">복합 점수</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stock.compositeScore.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>

            {/* 상세 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">기본 정보</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">섹터</span>
                    <span className="text-gray-900 dark:text-white">{stock.sector}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">산업</span>
                    <span className="text-gray-900 dark:text-white">{stock.industry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">시가총액</span>
                    <span className="text-gray-900 dark:text-white">
                      {stock.symbol.length === 6 
                        ? `₩${(stock.marketCap / 1000000000000).toFixed(1)}T`
                        : `$${(stock.marketCap / 1000000000).toFixed(1)}B`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">거래 정보</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">거래량</span>
                    <span className="text-gray-900 dark:text-white">
                      {(stock.volume / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">순위</span>
                    <span className="text-gray-900 dark:text-white">{stock.rank}위</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 주가 차트 */}
            <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">최근 5일간 주가 추이</h3>
              <StockChart data={mockTopStockChartData} isPositive={isPositive} />
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-300 dark:border-gray-700">
          <Link
            href={`/stock/${stock.symbol}`}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            상세 페이지 보기
          </Link>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

