'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export default function Toast({
  message,
  type = 'success',
  duration = 3000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // 애니메이션 완료 후 제거
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor =
    type === 'success'
      ? 'bg-[var(--success)]'
      : type === 'error'
        ? 'bg-[var(--danger)]'
        : 'bg-[var(--foreground)]';

  return (
    <div
      className={`fixed bottom-4 right-4 px-6 py-4 shadow-lg ${bgColor} text-white transition-all duration-300 toast-container border-2 border-transparent ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
      style={{ zIndex: 'var(--z-toast)' }}
    >
      <div className="flex items-center gap-3">
        <span className="font-bold">{message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-2 hover:opacity-80 font-bold"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' }>
  >([]);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'success'
  ) => {
    const id = Math.random().toString(36).slice(2, 11);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const ToastContainer = () => (
    <div className="fixed bottom-4 right-4 space-y-2 toast-container" style={{ zIndex: 'var(--z-toast)' }}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );

  return { showToast, ToastContainer };
}

