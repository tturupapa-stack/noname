'use client';

import { useState, useEffect, useMemo } from 'react';
import { FavoriteStock, FavoriteSortBy, Stock } from '@/types';
import {
  getFavorites,
  removeFavorite,
  removeFavorites,
  updateFavoriteSettings,
  reorderFavorites,
  clearAllFavorites,
  getFavoriteData,
} from '@/utils/favoriteStorage';
import FavoriteIcon from './FavoriteIcon';
import Link from 'next/link';
import { useToast } from './Toast';

interface FavoriteListProps {
  stocks: Stock[]; // 전체 종목 데이터 (가격 정보 업데이트용)
}

export default function FavoriteList({ stocks }: FavoriteListProps) {
  const [favorites, setFavorites] = useState<FavoriteStock[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<FavoriteSortBy>('order');
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    loadFavorites();
    
    // 즐겨찾기 변경 이벤트 리스너
    const handleFavoritesUpdate = () => {
      loadFavorites();
    };
    
    window.addEventListener('favorites-updated', handleFavoritesUpdate);
    
    // storage 이벤트도 감지 (다른 탭에서 변경된 경우)
    window.addEventListener('storage', handleFavoritesUpdate);
    
    return () => {
      window.removeEventListener('favorites-updated', handleFavoritesUpdate);
      window.removeEventListener('storage', handleFavoritesUpdate);
    };
  }, []);

  const loadFavorites = () => {
    const data = getFavoriteData();
    setFavorites(data.favorites);
    setSortBy(data.settings.sortBy);
  };

  // 정렬된 즐겨찾기 목록
  const sortedFavorites = useMemo(() => {
    const sorted = [...favorites];

    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'changePercent':
        sorted.sort((a, b) => {
          const stockA = stocks.find((s) => s.symbol === a.id);
          const stockB = stocks.find((s) => s.symbol === b.id);
          const changeA = stockA?.changePercent || 0;
          const changeB = stockB?.changePercent || 0;
          return changeB - changeA;
        });
        break;
      case 'volume':
        sorted.sort((a, b) => {
          const stockA = stocks.find((s) => s.symbol === a.id);
          const stockB = stocks.find((s) => s.symbol === b.id);
          const volumeA = stockA?.volume || 0;
          const volumeB = stockB?.volume || 0;
          return volumeB - volumeA;
        });
        break;
      case 'order':
      default:
        sorted.sort((a, b) => a.order - b.order);
        break;
    }

    return sorted;
  }, [favorites, sortBy, stocks]);

  // 즐겨찾기 종목의 현재 주가 정보
  const favoriteStocksWithData = useMemo(() => {
    return sortedFavorites.map((fav) => {
      const stock = stocks.find((s) => s.symbol === fav.id);
      return {
        favorite: fav,
        stock: stock || null,
      };
    });
  }, [sortedFavorites, stocks]);

  const handleSortChange = (newSortBy: FavoriteSortBy) => {
    setSortBy(newSortBy);
    updateFavoriteSettings({ sortBy: newSortBy });
  };

  const handleSelectAll = () => {
    if (selected.size === favorites.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(favorites.map((f) => f.id)));
    }
  };

  const handleSelect = (symbol: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(symbol)) {
      newSelected.delete(symbol);
    } else {
      newSelected.add(symbol);
    }
    setSelected(newSelected);
  };

  const handleRemoveSelected = () => {
    if (selected.size === 0) return;
    if (confirm(`선택한 ${selected.size}개 항목을 삭제하시겠습니까?`)) {
      const symbols = Array.from(selected);
      if (removeFavorites(symbols)) {
        setSelected(new Set());
        loadFavorites();
        showToast(`${symbols.length}개 항목이 삭제되었습니다.`, 'success');
      }
    }
  };

  const handleClearAll = () => {
    if (confirm('모든 관심 종목을 삭제하시겠습니까?')) {
      if (clearAllFavorites()) {
        setSelected(new Set());
        loadFavorites();
        showToast('모든 관심 종목이 삭제되었습니다.', 'success');
      }
    }
  };

  const handleRemove = (symbol: string) => {
    if (removeFavorite(symbol)) {
      loadFavorites();
      showToast('관심 종목에서 제거되었습니다.', 'info');
    }
  };

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">*</div>
        <h3 className="text-xl font-black text-[var(--foreground)] mb-2">
          관심 종목이 없습니다
        </h3>
        <p className="text-[var(--foreground-muted)]">
          종목에 별 아이콘을 클릭하여 관심 종목을 추가해보세요
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ToastContainer />

      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-black text-[var(--foreground)]">
            관심 종목 ({favorites.length})
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {/* 정렬 */}
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as FavoriteSortBy)}
            className="px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:border-[var(--foreground)] transition-colors"
          >
            <option value="order">등록순</option>
            <option value="name">종목명순</option>
            <option value="changePercent">등락률순</option>
            <option value="volume">거래량순</option>
          </select>

          {/* 전체 선택 */}
          {favorites.length > 0 && (
            <>
              <button
                onClick={handleSelectAll}
                className="btn btn-secondary"
              >
                {selected.size === favorites.length ? '선택 해제' : '전체 선택'}
              </button>
              {selected.size > 0 && (
                <button
                  onClick={handleRemoveSelected}
                  className="btn text-white bg-[var(--danger)] hover:opacity-80"
                >
                  선택 삭제 ({selected.size})
                </button>
              )}
              <button
                onClick={handleClearAll}
                className="btn border-2 border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white"
              >
                전체 삭제
              </button>
            </>
          )}
        </div>
      </div>

      {/* 목록 */}
      <div className="space-y-2">
        {favoriteStocksWithData.map(({ favorite, stock }) => {
          const isSelected = selected.has(favorite.id);
          const isPositive = stock ? stock.change >= 0 : false;
          const changeColor = isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]';

          return (
            <div
              key={favorite.id}
              className={`
                flex items-center gap-4 p-4 border-2 transition-all card-hover
                ${isSelected ? 'border-[var(--foreground)] bg-[var(--background-secondary)]' : 'border-[var(--border)] bg-[var(--background)]'}
                hover:border-[var(--foreground)]
              `}
            >
              {/* 체크박스 */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleSelect(favorite.id)}
                className="w-5 h-5 border-2 border-[var(--border)] bg-[var(--background)] accent-[var(--foreground)] focus:ring-0"
              />

              {/* 즐겨찾기 아이콘 */}
              <FavoriteIcon stock={stock || { symbol: favorite.id, shortName: favorite.name } as Stock} />

              {/* 종목 정보 */}
              <Link
                href={`/stock/${favorite.id}`}
                className="flex-1 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-[var(--foreground)]">
                      {favorite.name}
                    </span>
                    <span className="text-sm text-[var(--foreground-muted)]">
                      {favorite.id}
                    </span>
                  </div>
                  {stock ? (
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-[var(--foreground)]">
                        ${stock.currentPrice.toFixed(2)}
                      </span>
                      <span className={changeColor}>
                        {isPositive ? '+' : ''}
                        {stock.changePercent.toFixed(2)}%
                      </span>
                      <span className="text-[var(--foreground-muted)]">
                        거래량: {(stock.volume / 1000000).toFixed(1)}M
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm text-[var(--foreground-muted)]">
                      데이터 없음
                    </div>
                  )}
                </div>
              </Link>

              {/* 삭제 버튼 */}
              <button
                onClick={() => handleRemove(favorite.id)}
                className="p-2 text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors"
                aria-label="삭제"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

