'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('dark');

  // 시스템 테마 감지 함수
  const getSystemTheme = (): ResolvedTheme => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  };

  // 초기 마운트 시 로컬스토리지에서 테마 읽기 및 시스템 테마 감지
  useEffect(() => {
    setMounted(true);
    setSystemTheme(getSystemTheme());

    try {
      const storedTheme = localStorage.getItem('theme') as Theme | null;
      if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
        setThemeState(storedTheme);
      }
    } catch (error) {
      // Safari 프라이빗 모드 등에서 localStorage 접근 실패 시 무시
      console.warn('Failed to access localStorage for theme:', error);
    }
  }, []);

  // 시스템 테마 변경 감지
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const newSystemTheme = getSystemTheme();
      setSystemTheme(newSystemTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mounted]);

  // resolvedTheme 계산
  const resolvedTheme = useMemo<ResolvedTheme>(() => {
    if (!mounted) return 'dark'; // SSR 시 기본값
    if (theme === 'system') {
      return systemTheme;
    }
    return theme;
  }, [theme, systemTheme, mounted]);

  // 테마 변경 시 HTML 클래스 업데이트
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const body = document.body;
    
    // 기존 클래스 제거
    root.classList.remove('light', 'dark');
    if (body) {
      body.classList.remove('light', 'dark');
    }
    
    // 새 테마 클래스 추가 (html과 body 모두에)
    root.classList.add(resolvedTheme);
    if (body) {
      body.classList.add(resolvedTheme);
    }
    
    // 강제로 스타일 업데이트
    root.style.colorScheme = resolvedTheme;
    
    // 데이터 속성도 추가
    root.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme, mounted, theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('theme', newTheme);
      } catch (error) {
        // Safari 프라이빗 모드 등에서 localStorage 접근 실패 시 무시
        console.warn('Failed to save theme to localStorage:', error);
      }
    }
  };

  // 컨텍스트 값
  const contextValue: ThemeContextType = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

