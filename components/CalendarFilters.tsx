'use client';

import { useState, useEffect, useMemo } from 'react';
import { Briefing } from '@/types';

interface CalendarFiltersProps {
  briefings: Briefing[];
  filters: { categories?: string[]; keyword?: string };
  onFilterChange: (filters: { categories?: string[]; keyword?: string }) => void;
  onReset: () => void;
}

export default function CalendarFilters({
  briefings,
  filters,
  onFilterChange,
  onReset,
}: CalendarFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState(filters.keyword || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    filters.categories || []
  );

  // 사용 가능한 카테고리 (심볼 목록)
  const availableCategories = useMemo(() => {
    const symbols = new Set(briefings.map((b) => b.symbol));
    return Array.from(symbols).sort();
  }, [briefings]);

  useEffect(() => {
    setKeyword(filters.keyword || '');
    setSelectedCategories(filters.categories || []);
  }, [filters]);

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    onFilterChange({
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      keyword: value || undefined,
    });
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];

    setSelectedCategories(newCategories);
    onFilterChange({
      categories: newCategories.length > 0 ? newCategories : undefined,
      keyword: keyword || undefined,
    });
  };

  const handleReset = () => {
    setKeyword('');
    setSelectedCategories([]);
    onReset();
  };

  const hasActiveFilters = keyword || selectedCategories.length > 0;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 flex items-center gap-2 px-4 text-xs font-bold uppercase tracking-wide border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        Filter
        {hasActiveFilters && (
          <span className="bg-[var(--accent)] text-white text-[10px] font-black min-w-[18px] h-[18px] flex items-center justify-center">
            {selectedCategories.length + (keyword ? 1 : 0)}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0"
            style={{ zIndex: 'var(--z-dropdown)' }}
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute top-full right-0 mt-2 w-80 bg-[var(--card-bg)] border-2 border-[var(--foreground)] shadow-xl p-5"
            style={{ zIndex: 'calc(var(--z-dropdown) + 1)' }}
          >
            <div className="space-y-5">
              {/* Section Header */}
              <div className="flex items-center justify-between border-b-2 border-[var(--foreground)] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Filters
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6 flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Keyword Search */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2 text-[var(--foreground)]">
                  Search
                </label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => handleKeywordChange(e.target.value)}
                  placeholder="Title, content, symbol..."
                  className="w-full px-4 py-2 border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors placeholder:text-[var(--foreground-muted)]"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2 text-[var(--foreground)]">
                  Symbols
                </label>
                <div className="max-h-48 overflow-y-auto border border-[var(--border)] bg-[var(--background)]">
                  {availableCategories.length === 0 ? (
                    <p className="p-3 text-sm text-[var(--foreground-muted)] text-center">
                      No symbols available
                    </p>
                  ) : (
                    availableCategories.map((category) => (
                      <label
                        key={category}
                        className={`
                          flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors
                          border-b border-[var(--border)] last:border-b-0
                          ${selectedCategories.includes(category) ? 'bg-[var(--accent-light)]' : 'hover:bg-[var(--background-secondary)]'}
                        `}
                      >
                        <span
                          className={`
                            w-4 h-4 border-2 flex items-center justify-center transition-all
                            ${selectedCategories.includes(category)
                              ? 'border-[var(--foreground)] bg-[var(--foreground)]'
                              : 'border-[var(--border)]'
                            }
                          `}
                        >
                          {selectedCategories.includes(category) && (
                            <svg className="w-3 h-3 text-[var(--background)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => handleCategoryToggle(category)}
                          className="sr-only"
                        />
                        <span className="text-sm font-bold text-[var(--foreground)]">
                          {category}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Reset Button */}
              {hasActiveFilters && (
                <button
                  onClick={handleReset}
                  className="w-full py-2 text-xs font-bold uppercase tracking-wide border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

