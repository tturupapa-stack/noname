'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * 테마 전환 시 해가 뜨고 지는 그라데이션 전환 효과
 */
export default function ThemeTransition() {
  const { resolvedTheme } = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState<'sunrise' | 'sunset' | null>(null);
  const prevThemeRef = useRef<string | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // 초기 마운트 시에는 애니메이션 실행하지 않음
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevThemeRef.current = resolvedTheme;
      return;
    }

    // 테마 변경 감지
    if (prevThemeRef.current && prevThemeRef.current !== resolvedTheme) {
      const isSunrise = prevThemeRef.current === 'dark' && resolvedTheme === 'light';
      const isSunset = prevThemeRef.current === 'light' && resolvedTheme === 'dark';

      if (isSunrise || isSunset) {
        setTransitionType(isSunrise ? 'sunrise' : 'sunset');
        setIsTransitioning(true);
        
        // 애니메이션 완료 후 상태 초기화
        const timer = setTimeout(() => {
          setIsTransitioning(false);
          setTransitionType(null);
        }, 1000); // 애니메이션 duration과 맞춤

        return () => clearTimeout(timer);
      }
    }

    prevThemeRef.current = resolvedTheme;
  }, [resolvedTheme]);

  return (
    <AnimatePresence>
      {isTransitioning && transitionType && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 'var(--z-notification)',
            background: transitionType === 'sunrise'
              ? 'linear-gradient(to top, rgba(255, 200, 87, 0.8) 0%, rgba(255, 159, 64, 0.6) 30%, rgba(255, 107, 107, 0.4) 60%, transparent 100%)'
              : 'linear-gradient(to bottom, rgba(59, 130, 246, 0.6) 0%, rgba(139, 92, 246, 0.5) 30%, rgba(30, 41, 59, 0.7) 60%, rgba(15, 23, 42, 0.9) 100%)',
          }}
        >
          {/* 해가 뜨는 효과 (다크 → 라이트) */}
          {transitionType === 'sunrise' && (
            <motion.div
              initial={{ y: '100vh', opacity: 0 }}
              animate={{ y: '-20vh', opacity: 1 }}
              exit={{ y: '-20vh', opacity: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255, 200, 87, 1) 0%, rgba(255, 159, 64, 0.8) 40%, rgba(255, 107, 107, 0.4) 70%, transparent 100%)',
                filter: 'blur(40px)',
                boxShadow: '0 0 100px rgba(255, 200, 87, 0.8), 0 0 200px rgba(255, 159, 64, 0.6)',
              }}
            />
          )}

          {/* 해가 지는 효과 (라이트 → 다크) */}
          {transitionType === 'sunset' && (
            <motion.div
              initial={{ y: '-20vh', opacity: 1 }}
              animate={{ y: '100vh', opacity: 0 }}
              exit={{ y: '100vh', opacity: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255, 200, 87, 0.8) 0%, rgba(255, 159, 64, 0.6) 40%, rgba(255, 107, 107, 0.4) 70%, transparent 100%)',
                filter: 'blur(40px)',
                boxShadow: '0 0 100px rgba(255, 200, 87, 0.6), 0 0 200px rgba(255, 159, 64, 0.4)',
              }}
            />
          )}

          {/* 별이 나타나는 효과 (라이트 → 다크) */}
          {transitionType === 'sunset' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  radial-gradient(2px 2px at 20% 30%, white, transparent),
                  radial-gradient(2px 2px at 60% 70%, white, transparent),
                  radial-gradient(1px 1px at 50% 50%, white, transparent),
                  radial-gradient(1px 1px at 80% 10%, white, transparent),
                  radial-gradient(2px 2px at 90% 40%, white, transparent),
                  radial-gradient(1px 1px at 33% 60%, white, transparent),
                  radial-gradient(1px 1px at 70% 20%, white, transparent)
                `,
                backgroundSize: '200% 200%',
                backgroundPosition: '0% 0%',
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

