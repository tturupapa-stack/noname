'use client';

import { use } from 'react';
import { mockTrendingStocks, mockTopStockChartData } from '@/data/mockData';
import { Stock } from '@/types';
import Link from 'next/link';
import StockChart from '@/components/StockChart';

interface StockDetailPageProps {
  params: Promise<{ symbol: string }>;
}

export default function StockDetailPage({ params }: StockDetailPageProps) {
  const { symbol } = use(params);
  const stock = mockTrendingStocks.find((s) => s.symbol === symbol);

  if (!stock) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">종목을 찾을 수 없습니다</h1>
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
          >
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const isPositive = stock.change >= 0;
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
  const bgColor = isPositive ? 'bg-green-500/10' : 'bg-red-500/10';
  const borderColor = isPositive ? 'border-green-500/20' : 'border-red-500/20';

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-200">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4 inline-block"
          >
            ← 대시보드로 돌아가기
          </Link>
          <div className="mt-4">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold">{stock.symbol}</h1>
              {stock.rank && (
                <span className="px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded-full text-sm font-semibold">
                  {stock.rank}위
                </span>
              )}
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400">{stock.shortName}</p>
          </div>
        </div>

        {/* 주가 정보 카드 */}
        <div
          className={`rounded-lg border bg-white dark:bg-gray-900/50 p-6 backdrop-blur-sm mb-8 ${borderColor}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">현재가</div>
              <div className={`text-3xl font-bold ${changeColor}`}>
                ${stock.currentPrice.toFixed(2)}
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
                {stock.change.toFixed(2)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-4">기본 정보</h3>
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
                  ${(stock.marketCap / 1000000000).toFixed(1)}B
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-4">거래 정보</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">거래량</span>
                <span className="text-gray-900 dark:text-white">
                  {stock.volume.toLocaleString()} 주
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">선정일시</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(stock.selectedAt).toLocaleDateString('ko-KR')}
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
        <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold mb-4">최근 5일간 주가 추이</h3>
          <StockChart data={mockTopStockChartData} isPositive={isPositive} />
        </div>
      </div>
    </div>
  );
}

