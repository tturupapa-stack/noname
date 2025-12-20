'use client';

import { useState, useEffect, useRef } from 'react';
import { Stock } from '@/types';
import {
  isFavorite,
  addFavorite,
  removeFavorite,
} from '@/utils/favoriteStorage';
import {
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
    // 즐겨찾기 목록을 심볼 배열로 변환
    const favoriteSymbols = stocks
      .filter(stock => isFavorite(stock.symbol))
      .map(stock => stock.symbol);
    setFavorites(favoriteSymbols);
    setRecentSearches(getRecentSearches());
  }, [stocks]);

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
    const stock = stocks.find(s => s.symbol === symbol);
    if (!stock) return;
    
    if (isFavorite(symbol)) {
      removeFavorite(symbol);
      setFavorites(prev => prev.filter(s => s !== symbol));
    } else {
      addFavorite(symbol, stock.shortName);
      setFavorites(prev => [...prev, symbol]);
    }
    
    // storage 이벤트를 발생시켜 다른 컴포넌트에 알림
    window.dispatchEvent(new Event('favorites-updated'));
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
          className="w-full px-4 py-3 border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
        />
        {selectedStock && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="text-sm text-[var(--foreground-muted)]">
              {selectedStock.symbol}
            </span>
            <button
              onClick={() => onSelect(null)}
              className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              aria-label="선택 해제"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--background)] border-2 border-[var(--foreground)] shadow-xl max-h-96 overflow-y-auto">
          {/* 즐겨찾기 */}
          {favoriteStocks.length > 0 && !searchQuery && (
            <div className="p-2 border-b border-[var(--border)]">
              <div className="text-label text-[var(--foreground-muted)] mb-2 px-2">
                즐겨찾기
              </div>
              {favoriteStocks.map((stock) => (
                <div
                  key={stock.symbol}
                  onClick={() => handleSelect(stock)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(stock);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--background-secondary)] text-left cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-bold text-[var(--foreground)]">
                      {stock.symbol}
                    </div>
                    <div className="text-sm text-[var(--foreground-muted)]">
                      {stock.shortName}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFavoriteToggle(stock.symbol, e);
                    }}
                    className="text-[var(--foreground)] hover:opacity-60"
                    aria-label="즐겨찾기 해제"
                  >
                    ★
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 최근 검색 */}
          {recentStocks.length > 0 && !searchQuery && (
            <div className="p-2 border-b border-[var(--border)]">
              <div className="text-label text-[var(--foreground-muted)] mb-2 px-2">
                최근 검색
              </div>
              {recentStocks.map((stock) => (
                <div
                  key={stock.symbol}
                  onClick={() => handleSelect(stock)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(stock);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--background-secondary)] text-left cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-bold text-[var(--foreground)]">
                      {stock.symbol}
                    </div>
                    <div className="text-sm text-[var(--foreground-muted)]">
                      {stock.shortName}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 검색 결과 */}
          {searchQuery && filteredStocks.length > 0 && (
            <div className="p-2">
              {filteredStocks.map((stock) => (
                <div
                  key={stock.symbol}
                  onClick={() => handleSelect(stock)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(stock);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--background-secondary)] text-left cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-bold text-[var(--foreground)]">
                      {stock.symbol}
                    </div>
                    <div className="text-sm text-[var(--foreground-muted)]">
                      {stock.shortName}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFavoriteToggle(stock.symbol, e);
                    }}
                    className={`${
                      favorites.includes(stock.symbol)
                        ? 'text-[var(--foreground)]'
                        : 'text-[var(--foreground-muted)]'
                    } hover:text-[var(--foreground)]`}
                    aria-label="즐겨찾기"
                  >
                    ★
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchQuery && filteredStocks.length === 0 && (
            <div className="p-4 text-center text-[var(--foreground-muted)]">
              검색 결과가 없습니다
            </div>
          )}
        </div>
      )}
    </div>
  );
}

