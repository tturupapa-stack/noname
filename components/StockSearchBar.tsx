'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Stock } from '@/types';
import { searchStocks, highlightText } from '@/utils/searchUtils';
import { useDebounce } from '@/hooks/useDebounce';
import {
  getSearchHistory,
  addSearchHistory,
  removeSearchHistory,
  clearSearchHistory,
} from '@/utils/searchHistoryStorage';
import FavoriteIcon from './FavoriteIcon';
import Link from 'next/link';
import StockDetailModal from './StockDetailModal';

interface StockSearchBarProps {
  stocks: Stock[];
  onSelect?: (stock: Stock) => void;
}

export default function StockSearchBar({ stocks, onSelect }: StockSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchHistory, setSearchHistory] = useState(getSearchHistory());
  const [isLoading, setIsLoading] = useState(false);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 디바운스된 검색어
  const debouncedQuery = useDebounce(query, 300);

  // 검색 결과
  const searchResults = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 1) {
      setIsLoading(false);
      return [];
    }
    setIsLoading(true);
    const results = searchStocks(stocks, debouncedQuery, 8);
    // 로딩 시뮬레이션 (실제 API 호출 시 제거)
    setTimeout(() => setIsLoading(false), 100);
    return results;
  }, [debouncedQuery, stocks]);

  // 검색창 포커스 시 히스토리 표시
  useEffect(() => {
    if (isOpen && !query) {
      setSearchHistory(getSearchHistory());
    }
  }, [isOpen, query]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = query ? searchResults : searchHistory.map((h) => stocks.find((s) => s.symbol === h.query || s.shortName === h.query)).filter(Boolean) as Stock[];
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && items[selectedIndex]) {
      e.preventDefault();
      handleSelectStock(items[selectedIndex]);
    }
  };

  const handleSelectStock = (stock: Stock) => {
    if (onSelect) {
      onSelect(stock);
    } else {
      setSelectedStock(stock);
      setIsModalOpen(true);
    }
    
    if (query) {
      addSearchHistory(query);
      setSearchHistory(getSearchHistory());
    }
    
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    const stock = stocks.find((s) => s.symbol === historyQuery || s.shortName === historyQuery);
    if (stock) {
      handleSelectStock(stock);
    }
  };

  const handleRemoveHistory = (historyQuery: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeSearchHistory(historyQuery);
    setSearchHistory(getSearchHistory());
  };

  const showHistory = isOpen && !query && searchHistory.length > 0;
  const showResults = isOpen && query && searchResults.length > 0;
  const showNoResults = isOpen && query && !isLoading && searchResults.length === 0;

  return (
    <>
      <div ref={searchRef} className="relative w-full max-w-md z-10">
        {/* 검색 입력창 */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="종목명 또는 종목코드 입력"
            className={`
              w-full px-4 py-3 pl-12 pr-12 rounded-xl border-2 transition-all shadow-sm
              ${isOpen ? 'border-blue-500 dark:border-blue-400 ring-4 ring-blue-500/20 shadow-lg' : 'border-gray-300 dark:border-gray-700'}
              bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white
              focus:outline-none hover:shadow-md
              ${isMobile && isOpen ? 'fixed top-0 left-0 right-0 z-[60] rounded-none border-x-0 border-t-0' : ''}
            `}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            🔍
          </div>
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSelectedIndex(-1);
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="지우기"
            >
              ✕
            </button>
          )}
        </div>

        {/* 드롭다운 */}
        {(showHistory || showResults || showNoResults || isLoading) && (
          <div
            className={`
              absolute z-[55] w-full mt-2 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 rounded-2xl shadow-2xl
              max-h-96 overflow-y-auto backdrop-blur-sm
              ${isMobile && isOpen ? 'fixed top-14 left-0 right-0 rounded-none border-x-0 border-b-0 max-h-[calc(100vh-3.5rem)] z-[60]' : ''}
              animate-in slide-in-from-top-2 duration-200
            `}
          >
            {/* 로딩 */}
            {isLoading && (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm">검색 중...</p>
              </div>
            )}

            {/* 검색 히스토리 */}
            {showHistory && (
              <div className="p-2">
                <div className="flex items-center justify-between px-2 py-1 mb-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">최근 검색</span>
                  {searchHistory.length > 0 && (
                    <button
                      onClick={() => {
                        clearSearchHistory();
                        setSearchHistory([]);
                      }}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      전체 삭제
                    </button>
                  )}
                </div>
                {searchHistory.map((item) => {
                  const stock = stocks.find((s) => s.symbol === item.query || s.shortName === item.query);
                  if (!stock) return null;
                  
                  return (
                    <div
                      key={item.query}
                      onClick={() => handleHistoryClick(item.query)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleHistoryClick(item.query);
                        }
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-left transition-colors cursor-pointer"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">{stock.symbol}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{stock.shortName}</div>
                      </div>
                      <button
                        onClick={(e) => handleRemoveHistory(item.query, e)}
                        className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        aria-label="삭제"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 검색 결과 */}
            {showResults && (
              <div className="p-2">
                {searchResults.map((stock, index) => {
                  const isSelected = index === selectedIndex;
                  const isPositive = stock.change >= 0;
                  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
                  
                  return (
                    <div
                      key={stock.symbol}
                      onClick={() => handleSelectStock(stock)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectStock(stock);
                        }
                      }}
                      className={`
                        w-full flex items-center justify-between px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer
                        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                      `}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="font-bold text-gray-900 dark:text-white"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(stock.symbol, query),
                            }}
                          />
                          <span
                            className="text-sm text-gray-600 dark:text-gray-400 truncate"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(stock.shortName, query),
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-900 dark:text-white">
                            {stock.symbol.length === 6 ? `₩${stock.currentPrice.toLocaleString()}` : `$${stock.currentPrice.toFixed(2)}`}
                          </span>
                          <span className={changeColor}>
                            {isPositive ? '+' : ''}
                            {stock.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <div className="ml-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <FavoriteIcon stock={stock} size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 검색 결과 없음 */}
            {showNoResults && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <p>검색 결과가 없습니다</p>
                <p className="text-sm mt-1">다른 키워드로 검색해보세요</p>
              </div>
            )}
          </div>
        )}

        {/* 모바일 오버레이 */}
        {isMobile && isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-[55]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>

      {/* 종목 상세 모달 */}
      {selectedStock && (
        <StockDetailModal
          stock={selectedStock}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedStock(null);
          }}
        />
      )}
    </>
  );
}

