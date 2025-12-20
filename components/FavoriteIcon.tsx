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
  const [favorite, setFavorite] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setMounted(true);
    setFavorite(isFavorite(stock.symbol));
  }, [stock.symbol]);

  useEffect(() => {
    if (mounted) {
      setFavorite(isFavorite(stock.symbol));
    }
  }, [stock.symbol, mounted]);

  useEffect(() => {
    if (!mounted) return;

    const handleFavoritesUpdate = () => {
      setFavorite(isFavorite(stock.symbol));
    };

    window.addEventListener('favorites-updated', handleFavoritesUpdate);
    window.addEventListener('storage', handleFavoritesUpdate);

    return () => {
      window.removeEventListener('favorites-updated', handleFavoritesUpdate);
      window.removeEventListener('storage', handleFavoritesUpdate);
    };
  }, [stock.symbol, mounted]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    let success = false;
    if (favorite) {
      success = removeFavorite(stock.symbol);
      if (success) {
        setFavorite(false);
        showToast('Removed from watchlist', 'info');
      }
    } else {
      success = addFavorite(stock.symbol, stock.shortName);
      if (success) {
        setFavorite(true);
        showToast('Added to watchlist', 'success');
      }
    }

    if (success) {
      window.dispatchEvent(new Event('favorites-updated'));

      if (onToggle) {
        onToggle(!favorite);
      }
    }
  };

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const displayFavorite = mounted ? favorite : false;

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center justify-center gap-1 transition-all
        ${sizeClasses[size]}
        ${displayFavorite
          ? 'bg-[var(--foreground)] text-[var(--background)]'
          : 'border border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]'
        }
        ${showText ? 'px-3 py-1.5' : ''}
      `}
      aria-label={displayFavorite ? 'Remove from watchlist' : 'Add to watchlist'}
      title={displayFavorite ? 'Remove from watchlist' : 'Add to watchlist'}
      suppressHydrationWarning
    >
      <svg
        className={`${iconSizes[size]} transition-transform ${displayFavorite ? 'scale-100' : 'scale-90'}`}
        fill={displayFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={displayFavorite ? 0 : 2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
      {showText && (
        <span className="text-xs font-bold uppercase tracking-wide" suppressHydrationWarning>
          {displayFavorite ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  );
}
