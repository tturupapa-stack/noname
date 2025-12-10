'use client';

import { useState, useEffect } from 'react';
import { Stock } from '@/types';
import { addFavorite, removeFavorite, isFavorite } from '@/utils/favoriteStorage';
import { useToast } from './Toast';

interface FavoriteIconProps {
  stock: Stock;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  onToggle?: (isFavorite: boolean) => void;
}

export default function FavoriteIcon({
  stock,
  size = 'md',
  showText = false,
  onToggle,
}: FavoriteIconProps) {
  // Hydration 에러 방지: 서버와 클라이언트에서 동일한 초기값 사용
  const [favorite, setFavorite] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { showToast } = useToast();

  // 마운트 후 실제 즐겨찾기 상태 로드
  useEffect(() => {
    setMounted(true);
    setFavorite(isFavorite(stock.symbol));
  }, [stock.symbol]);

  // 상태 동기화 (외부에서 변경된 경우 대비)
  useEffect(() => {
    if (mounted) {
      setFavorite(isFavorite(stock.symbol));
    }
  }, [stock.symbol, mounted]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    let success = false;
    if (favorite) {
      success = removeFavorite(stock.symbol);
      if (success) {
        setFavorite(false);
        showToast('관심 종목에서 제거되었습니다.', 'info');
      }
    } else {
      success = addFavorite(stock.symbol, stock.shortName);
      if (success) {
        setFavorite(true);
        showToast('관심 종목에 추가되었습니다.', 'success');
      }
    }

    if (success && onToggle) {
      onToggle(!favorite);
    }
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // Hydration 에러 방지: 마운트 전에는 기본값 사용
  const displayFavorite = mounted ? favorite : false;

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center gap-1 p-1 rounded transition-all
        hover:bg-gray-100 dark:hover:bg-gray-800
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${showText ? 'px-2 py-1' : ''}
      `}
      aria-label={displayFavorite ? '관심 종목에서 제거' : '관심 종목에 추가'}
      title={displayFavorite ? '관심 종목에서 제거' : '관심 종목에 추가'}
      suppressHydrationWarning
    >
      <span
        className={`
          ${sizeClasses[size]} transition-transform duration-200
          ${displayFavorite ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-600'}
          ${displayFavorite ? 'scale-110' : 'hover:scale-110'}
        `}
        suppressHydrationWarning
      >
        {displayFavorite ? '⭐' : '☆'}
      </span>
      {showText && (
        <span className="text-sm text-gray-700 dark:text-gray-300" suppressHydrationWarning>
          {displayFavorite ? '관심 종목' : '추가'}
        </span>
      )}
    </button>
  );
}

