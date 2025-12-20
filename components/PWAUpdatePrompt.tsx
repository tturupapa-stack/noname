'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAUpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || 'serviceWorker' in navigator === false) {
      return;
    }

    let refreshing = false;

    // Service Worker 업데이트 감지
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    // Service Worker 등록 확인
    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);

      // 업데이트 확인
      reg.update();

      // 업데이트 감지
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 새 버전이 설치됨
            setShowUpdate(true);
          }
        });
      });
    });

    // 주기적으로 업데이트 확인 (1시간마다)
    const interval = setInterval(() => {
      if (registration) {
        registration.update();
      }
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [registration]);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      // 새 Service Worker 활성화
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdate(false);
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    // 24시간 동안 다시 표시하지 않음
    localStorage.setItem('pwa-update-dismissed', String(Date.now()));
  };

  return (
    <AnimatePresence>
      {showUpdate && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 p-4 bg-[var(--foreground)] text-[var(--background)] shadow-2xl"
          style={{ zIndex: 'var(--z-notification)' }}
        >
          <div className="container mx-auto max-w-4xl flex items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-black text-lg mb-1">새 버전이 있습니다</h3>
              <p className="text-sm opacity-90">
                업데이트하여 최신 기능을 사용하세요
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-[var(--background)] text-[var(--foreground)] font-bold hover:opacity-80 transition-colors"
              >
                업데이트하기
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 border-2 border-[var(--background)] text-[var(--background)] font-bold hover:bg-[var(--background)] hover:text-[var(--foreground)] transition-colors"
              >
                나중에
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

