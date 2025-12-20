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
              w-full px-4 py-3 pl-11 pr-10 rounded-xl border transition-all text-sm
              ${isOpen
                ? 'border-[var(--primary-500)] ring-2 ring-[var(--primary-500)]/20'
                : 'border-[var(--border)] hover:border-[var(--foreground-muted)]'
              }
              bg-[var(--card-bg)] text-[var(--foreground)]
              placeholder:text-[var(--foreground-muted)]
              focus:outline-none
              ${isMobile && isOpen ? 'fixed top-0 left-0 right-0 z-[60] rounded-none border-x-0 border-t-0' : ''}
            `}
          />
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSelectedIndex(-1);
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              aria-label="지우기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 드롭다운 */}
        {(showHistory || showResults || showNoResults || isLoading) && (
          <div
            className={`
              absolute z-[55] w-full mt-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-lg
              max-h-96 overflow-y-auto
              ${isMobile && isOpen ? 'fixed top-14 left-0 right-0 rounded-none border-x-0 border-b-0 max-h-[calc(100vh-3.5rem)] z-[60]' : ''}
              animate-fade-in
            `}
          >
            {/* 로딩 */}
            {isLoading && (
              <div className="p-4 text-center text-[var(--foreground-muted)]">
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-[var(--border)] border-t-[var(--primary-500)]"></div>
                <p className="mt-2 text-sm">검색 중...</p>
              </div>
            )}

            {/* 검색 히스토리 */}
            {showHistory && (
              <div className="p-2">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs font-medium text-[var(--foreground-muted)]">최근 검색</span>
                  {searchHistory.length > 0 && (
                    <button
                      onClick={() => {
                        clearSearchHistory();
                        setSearchHistory([]);
                      }}
                      className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
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
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[var(--background-secondary)] rounded-lg text-left transition-colors cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-[var(--foreground)]">{stock.symbol}</div>
                        <div className="text-xs text-[var(--foreground-muted)] truncate">{stock.shortName}</div>
                      </div>
                      <button
                        onClick={(e) => handleRemoveHistory(item.query, e)}
                        className="ml-2 p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                        aria-label="삭제"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
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
                        w-full flex items-center justify-between px-3 py-3 hover:bg-[var(--background-secondary)] rounded-lg transition-colors cursor-pointer
                        ${isSelected ? 'bg-[var(--background-secondary)]' : ''}
                      `}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="font-bold text-sm text-[var(--foreground)]"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(stock.symbol, query),
                            }}
                          />
                          <span
                            className="text-xs text-[var(--foreground-muted)] truncate"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(stock.shortName, query),
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-[var(--foreground)]">
                            {stock.symbol.length === 6 ? `${stock.currentPrice.toLocaleString()}` : `$${stock.currentPrice.toFixed(2)}`}
                          </span>
                          <span className={isPositive ? 'price-up' : 'price-down'}>
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
              <div className="p-8 text-center">
                <p className="text-[var(--foreground-muted)]">검색 결과가 없습니다</p>
                <p className="text-sm text-[var(--foreground-muted)] mt-1">다른 키워드로 검색해보세요</p>
              </div>
            )}
          </div>
        )}

        {/* 모바일 오버레이 */}
        {isMobile && isOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-[55]"
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
