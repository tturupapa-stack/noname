'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import ThemeToggle from '@/components/ThemeToggle';
import StockDetailModal from '@/components/StockDetailModal';
import FavoriteIcon from '@/components/FavoriteIcon';
import { Stock, FavoriteStock } from '@/types';
import { getFavorites } from '@/utils/favoriteStorage';
import { mockAllStocks } from '@/data/mockData';
import { fetchTopNStocks } from '@/services/api';
import { adaptRankedStock } from '@/services/apiAdapters';

type SortOption = 'added' | 'name' | 'change' | 'volume';

export default function FavoritesPage() {
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>([]);
  const [allStocks, setAllStocks] = useState<Stock[]>(mockAllStocks);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('added');

  useEffect(() => {
    // 관심 종목 로드 (FavoriteStock[] -> string[] 변환)
    setFavoriteSymbols(getFavorites().map(f => f.id));

    // API에서 최신 데이터 로드
    async function loadStocks() {
      try {
        const response = await fetchTopNStocks('most_actives', 10);
        const adapted = response.stocks.map(adaptRankedStock);
        setAllStocks([...adapted, ...mockAllStocks.filter(s => !adapted.find(a => a.symbol === s.symbol))]);
      } catch (err) {
        console.error('종목 데이터 로드 실패:', err);
      }
    }
    loadStocks();

    // 로컬스토리지 변경 감지
    const handleStorage = () => {
      setFavoriteSymbols(getFavorites().map(f => f.id));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const favoriteStocks = useMemo(() => {
    const stocks = favoriteSymbols
      .map(symbol => allStocks.find(s => s.symbol === symbol))
      .filter((s): s is Stock => s !== undefined);

    switch (sortBy) {
      case 'name':
        return [...stocks].sort((a, b) => a.shortName.localeCompare(b.shortName));
      case 'change':
        return [...stocks].sort((a, b) => b.changePercent - a.changePercent);
      case 'volume':
        return [...stocks].sort((a, b) => b.volume - a.volume);
      default:
        return stocks;
    }
  }, [favoriteSymbols, allStocks, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50/30 dark:from-black dark:via-gray-900 dark:to-blue-900/20 text-gray-900 dark:text-white transition-colors duration-300">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-dark flex items-center justify-center">
              <span className="text-lg">🌙</span>
            </div>
            <span className="text-xl font-bold gradient-text bg-clip-text text-transparent">
              당신이 잠든 사이
            </span>
          </Link>
          <Navigation />
          <ThemeToggle />
        </div>

        {/* Page Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text bg-clip-text text-transparent mb-2">
              관심 종목
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {favoriteStocks.length}개의 관심 종목을 관리하세요
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">정렬:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
            >
              <option value="added">추가순</option>
              <option value="name">이름순</option>
              <option value="change">변동률순</option>
              <option value="volume">거래량순</option>
            </select>
          </div>
        </div>

        {/* 관심 종목 목록 */}
        {favoriteStocks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteStocks.map((stock) => {
              const isPositive = stock.change >= 0;
              return (
                <div
                  key={stock.symbol}
                  className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedStock(stock)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold">{stock.symbol}</h3>
                        <FavoriteIcon stock={stock} size="sm" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{stock.shortName}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        ${stock.currentPrice.toFixed(2)}
                      </p>
                      <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>거래량: {(stock.volume / 1000000).toFixed(1)}M</span>
                    <span>시총: ${(stock.marketCap / 1000000000).toFixed(1)}B</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold mb-2">관심 종목이 없습니다</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              종목 검색에서 별 아이콘을 클릭하여 관심 종목을 추가하세요
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              종목 검색하기
            </Link>
          </div>
        )}
      </div>

      {/* 종목 상세 모달 */}
      {selectedStock && (
        <StockDetailModal
          stock={selectedStock}
          isOpen={!!selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      )}
    </div>
  );
}
