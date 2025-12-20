'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface WindowWithOpera extends Window {
  opera?: string;
  MSStream?: unknown;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<string>('');
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // 플랫폼 감지
    const windowWithOpera = window as WindowWithOpera;
    const userAgent = navigator.userAgent || navigator.vendor || windowWithOpera.opera || '';
    if (/android/i.test(userAgent)) {
      setPlatform('android');
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !windowWithOpera.MSStream) {
      setPlatform('ios');
    } else {
      setPlatform('desktop');
    }

    // 설치 상태 확인
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return true;
      }
      const navigatorWithStandalone = window.navigator as NavigatorWithStandalone;
      if (navigatorWithStandalone.standalone) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    if (checkInstalled()) {
      return;
    }

    // 로컬스토리지에서 프롬프트 표시 이력 확인
    const promptShown = localStorage.getItem('pwa-prompt-shown');
    const promptShownCount = parseInt(localStorage.getItem('pwa-prompt-count') || '0', 10);
    const lastPromptDate = localStorage.getItem('pwa-prompt-date');
    const dismissed = localStorage.getItem('pwa-prompt-dismissed') === 'true';

    // 3회 이상 표시했거나 7일 이내에 표시했거나 거부한 경우 숨김
    if (dismissed || promptShownCount >= 3) {
      const daysSinceLastPrompt = lastPromptDate
        ? (Date.now() - parseInt(lastPromptDate, 10)) / (1000 * 60 * 60 * 24)
        : Infinity;
      if (daysSinceLastPrompt < 7) {
        return;
      }
    }

    // beforeinstallprompt 이벤트 리스너 (Android Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    // appinstalled 이벤트 리스너
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // iOS는 자동 프롬프트가 없으므로 수동으로 표시
    if (platform === 'ios' && !promptShown) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // 3초 후 표시
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [platform]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android Chrome
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowPrompt(false);
        localStorage.setItem('pwa-installed', 'true');
      }
      
      setDeferredPrompt(null);
    }

    // 프롬프트 표시 이력 저장
    const count = parseInt(localStorage.getItem('pwa-prompt-count') || '0', 10);
    localStorage.setItem('pwa-prompt-count', String(count + 1));
    localStorage.setItem('pwa-prompt-date', String(Date.now()));
    localStorage.setItem('pwa-prompt-shown', 'true');
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    localStorage.setItem('pwa-prompt-date', String(Date.now()));
  };

  const handleIOSInstall = () => {
    // iOS 설치 가이드 모달 표시
    setShowIOSGuide(true);
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--foreground)] text-[var(--background)] shadow-2xl"
            style={{ zIndex: 'var(--z-pwa-prompt)' }}
          >
            <div className="container mx-auto max-w-4xl flex items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-black text-lg mb-1">앱으로 설치하고 매일 아침 브리핑 받기</h3>
                <p className="text-sm opacity-90">
                  홈 화면에 추가하여 더 빠르게 접근하세요
                </p>
              </div>
              <div className="flex items-center gap-2">
                {platform === 'ios' ? (
                  <button
                    onClick={handleIOSInstall}
                    className="px-4 py-2 bg-[var(--background)] text-[var(--foreground)] font-bold hover:opacity-80 transition-colors"
                  >
                    설치 가이드
                  </button>
                ) : (
                  <button
                    onClick={handleInstall}
                    className="px-4 py-2 bg-[var(--background)] text-[var(--foreground)] font-bold hover:opacity-80 transition-colors"
                  >
                    설치하기
                  </button>
                )}
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

      {/* iOS 설치 가이드 모달 */}
      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            style={{ zIndex: 'var(--z-fullscreen)' }}
            onClick={() => setShowIOSGuide(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--background)] border-2 border-[var(--foreground)] p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-2xl font-black mb-4 text-[var(--foreground)]">
                iOS에서 설치하기
              </h3>
              <div className="space-y-4 text-[var(--foreground-secondary)]">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center font-black">
                    1
                  </span>
                  <p>하단의 <strong className="text-[var(--foreground)]">공유 버튼</strong>을 탭하세요</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center font-black">
                    2
                  </span>
                  <p><strong className="text-[var(--foreground)]">"홈 화면에 추가"</strong>를 선택하세요</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center font-black">
                    3
                  </span>
                  <p>확인 버튼을 눌러 설치를 완료하세요</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="btn btn-primary mt-6 w-full"
              >
                확인
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

