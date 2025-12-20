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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const debouncedQuery = useDebounce(query, 300);

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

  useEffect(() => {
    if (isOpen && !query) {
      setSearchHistory(getSearchHistory());
    }
  }, [isOpen, query]);

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
      <div ref={searchRef} className="relative w-full z-[200]">
        {/* Search Input - Musinsa Style */}
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
            placeholder="Search stocks..."
            className={`
              w-full px-4 py-3.5 pl-12 pr-10 border-2 transition-all text-sm font-medium
              ${isOpen
                ? 'border-[var(--foreground)]'
                : 'border-[var(--border)] hover:border-[var(--foreground-muted)]'
              }
              bg-[var(--background)] text-[var(--foreground)]
              placeholder:text-[var(--foreground-muted)] placeholder:font-normal
              focus:outline-none
              ${isMobile && isOpen ? 'fixed top-0 left-0 right-0 border-x-0 border-t-0' : ''}
            `}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-all"
              aria-label="Clear"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Dropdown - Sharp Musinsa Style */}
        {(showHistory || showResults || showNoResults || isLoading) && (
          <div
            className={`
              absolute w-full mt-0 bg-[var(--background)] border-2 border-t-0 border-[var(--foreground)]
              max-h-96 overflow-y-auto z-[300]
              ${isMobile && isOpen ? 'fixed top-14 left-0 right-0 max-h-[calc(100vh-3.5rem)]' : ''}
              animate-fade-in
            `}
          >
            {/* Loading */}
            {isLoading && (
              <div className="p-6 text-center">
                <div className="inline-block w-5 h-5 border-2 border-[var(--foreground)] border-t-transparent rounded-full animate-spin" />
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[var(--foreground-muted)]">
                  Searching...
                </p>
              </div>
            )}

            {/* Search History */}
            {showHistory && (
              <div>
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">
                    Recent Searches
                  </span>
                  {searchHistory.length > 0 && (
                    <button
                      onClick={() => {
                        clearSearchHistory();
                        setSearchHistory([]);
                      }}
                      className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                      Clear All
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
                      className="flex items-center justify-between px-4 py-3 hover:bg-[var(--background-secondary)] border-b border-[var(--border)] transition-colors cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors truncate">
                          {stock.shortName}
                        </div>
                        <div className="text-xs text-[var(--foreground-muted)]">
                          {stock.symbol}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleRemoveHistory(item.query, e)}
                        className="ml-2 w-6 h-6 flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-all"
                        aria-label="Remove"
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

            {/* Search Results */}
            {showResults && (
              <div>
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
                        flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)] transition-colors cursor-pointer group
                        ${isSelected ? 'bg-[var(--background-secondary)]' : 'hover:bg-[var(--background-secondary)]'}
                      `}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="font-bold text-sm text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors truncate"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(stock.shortName, query),
                            }}
                          />
                          <span
                            className="text-xs text-[var(--foreground-muted)] uppercase tracking-wide"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(stock.symbol, query),
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="font-bold text-[var(--foreground)]">
                            ${stock.currentPrice.toFixed(2)}
                          </span>
                          <span className={`font-bold ${isPositive ? 'price-up' : 'price-down'}`}>
                            {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <div className="ml-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <FavoriteIcon stock={stock} size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* No Results */}
            {showNoResults && (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-4 border-2 border-[var(--border)] flex items-center justify-center">
                  <svg className="w-6 h-6 text-[var(--foreground-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-[var(--foreground-muted)] uppercase tracking-wide">
                  No Results Found
                </p>
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  Try a different search term
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mobile Overlay */}
        {isMobile && isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-[199]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>

      {/* Stock Detail Modal */}
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
