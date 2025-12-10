'use client';

import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    // system -> dark -> light -> system 순환
    let newTheme: 'light' | 'dark' | 'system';
    if (theme === 'system') {
      newTheme = 'dark';
    } else if (theme === 'dark') {
      newTheme = 'light';
    } else {
      newTheme = 'system';
    }
    
    setTheme(newTheme);
  };

  const getIcon = () => {
    if (theme === 'system') {
      return resolvedTheme === 'dark' ? '🌙' : '☀️';
    }
    return theme === 'dark' ? '🌙' : '☀️';
  };

  const getLabel = () => {
    if (theme === 'system') {
      return `시스템 (${resolvedTheme === 'dark' ? '다크' : '라이트'})`;
    }
    return theme === 'dark' ? '다크 모드' : '라이트 모드';
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
      aria-label={getLabel()}
      title={getLabel()}
    >
      <span className="text-xl transition-transform duration-200 hover:scale-110">
        {getIcon()}
      </span>
      <span className="hidden sm:inline text-sm font-medium">
        {getLabel()}
      </span>
    </button>
  );
}

