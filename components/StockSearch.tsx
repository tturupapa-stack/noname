'use client';

import { useState, useEffect, useRef } from 'react';
import { Stock } from '@/types';
import {
  getFavoriteStocks,
  toggleFavoriteStock,
  getRecentSearches,
  addRecentSearch,
} from '@/utils/alertStorage';

interface StockSearchProps {
  stocks: Stock[];
  onSelect: (stock: Stock | null) => void;
  selectedStock?: Stock | null;
}

export default function StockSearch({
  stocks,
  onSelect,
  selectedStock,
}: StockSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFavorites(getFavoriteStocks());
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = stocks.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(query) ||
          stock.shortName.toLowerCase().includes(query)
      );
      setFilteredStocks(filtered.slice(0, 10));
    } else {
      setFilteredStocks([]);
    }
  }, [searchQuery, stocks]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (stock: Stock) => {
    onSelect(stock);
    addRecentSearch(stock.symbol);
    setRecentSearches(getRecentSearches());
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleFavoriteToggle = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteStock(symbol);
    setFavorites(getFavoriteStocks());
  };

  const favoriteStocks = stocks.filter((s) => favorites.includes(s.symbol));
  const recentStocks = stocks.filter((s) => recentSearches.includes(s.symbol));

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="종목 코드 또는 이름 검색..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {selectedStock && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedStock.symbol}
            </span>
            <button
              onClick={() => onSelect(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="선택 해제"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {/* 즐겨찾기 */}
          {favoriteStocks.length > 0 && !searchQuery && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">
                즐겨찾기
              </div>
              {favoriteStocks.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => handleSelect(stock)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-left"
                >
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {stock.symbol}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {stock.shortName}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleFavoriteToggle(stock.symbol, e)}
                    className="text-yellow-500 hover:text-yellow-600"
                    aria-label="즐겨찾기 해제"
                  >
                    ★
                  </button>
                </button>
              ))}
            </div>
          )}

          {/* 최근 검색 */}
          {recentStocks.length > 0 && !searchQuery && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">
                최근 검색
              </div>
              {recentStocks.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => handleSelect(stock)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-left"
                >
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {stock.symbol}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {stock.shortName}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 검색 결과 */}
          {searchQuery && filteredStocks.length > 0 && (
            <div className="p-2">
              {filteredStocks.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => handleSelect(stock)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-left"
                >
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {stock.symbol}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {stock.shortName}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleFavoriteToggle(stock.symbol, e)}
                    className={`${
                      favorites.includes(stock.symbol)
                        ? 'text-yellow-500'
                        : 'text-gray-300 dark:text-gray-600'
                    } hover:text-yellow-500`}
                    aria-label="즐겨찾기"
                  >
                    ★
                  </button>
                </button>
              ))}
            </div>
          )}

          {searchQuery && filteredStocks.length === 0 && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              검색 결과가 없습니다
            </div>
          )}
        </div>
      )}
    </div>
  );
}

