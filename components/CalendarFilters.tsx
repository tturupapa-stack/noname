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
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <svg
          className="w-5 h-5"
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
        필터
        {hasActiveFilters && (
          <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {selectedCategories.length + (keyword ? 1 : 0)}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 shadow-xl z-40 p-4">
            <div className="space-y-4">
              {/* 키워드 검색 */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                  키워드 검색
                </label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => handleKeywordChange(e.target.value)}
                  placeholder="제목, 내용, 종목 검색..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 카테고리 필터 */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                  종목 필터
                </label>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {availableCategories.map((category) => (
                    <label
                      key={category}
                      className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {category}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 필터 초기화 */}
              {hasActiveFilters && (
                <button
                  onClick={handleReset}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  필터 초기화
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

