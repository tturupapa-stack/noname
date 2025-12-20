'use client';

import { useState, useEffect } from 'react';
import { AlertHistory as AlertHistoryType } from '@/types';
import { getAlertHistory } from '@/utils/alertStorage';

export default function AlertHistory() {
  const [history, setHistory] = useState<AlertHistoryType[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setHistory(getAlertHistory());
  }, []);

  if (history.length === 0) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
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
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        알림 히스토리 ({history.length})
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 dark:bg-black/80 backdrop-blur-sm modal-backdrop"
          style={{ zIndex: 'var(--z-modal-backdrop)' }}
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[80vh] bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col modal-content"
            style={{ zIndex: 'var(--z-modal)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                알림 히스토리
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {item.symbol}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(item.triggeredAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      {item.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

