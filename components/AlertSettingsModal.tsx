'use client';

import { useState, useEffect, useRef } from 'react';
import { Stock, AlertSettings, AlertCondition, TimeUnit } from '@/types';
import StockSearch from './StockSearch';
import ConditionForm from './ConditionForm';

interface AlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (alert: AlertSettings) => void;
  stocks: Stock[];
  editingAlert?: AlertSettings | null;
}

export default function AlertSettingsModal({
  isOpen,
  onClose,
  onSave,
  stocks,
  editingAlert,
}: AlertSettingsModalProps) {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [conditions, setConditions] = useState<AlertCondition[]>([]);
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('1hour');
  const [browserPush, setBrowserPush] = useState(false);
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingAlert) {
        const stock = stocks.find((s) => s.symbol === editingAlert.symbol);
        setSelectedStock(stock || null);
        setConditions(editingAlert.conditions);
        setTimeUnit(editingAlert.timeUnit);
        setBrowserPush(editingAlert.browserPush);
        setSound(editingAlert.sound);
        setVibration(editingAlert.vibration);
      } else {
        resetForm();
      }
      // 포커스 트랩
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, editingAlert, stocks]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const resetForm = () => {
    setSelectedStock(null);
    setConditions([
      {
        id: Math.random().toString(36).substr(2, 9),
        type: 'price',
        operator: '>=',
        value: 0,
      },
    ]);
    setTimeUnit('1hour');
    setBrowserPush(false);
    setSound(true);
    setVibration(false);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedStock) {
      newErrors.stock = '종목을 선택해주세요.';
    }

    if (conditions.length === 0) {
      newErrors.conditions = '최소 1개의 조건이 필요합니다.';
    }

    conditions.forEach((condition, index) => {
      if (condition.value <= 0) {
        newErrors[`condition_${index}_value`] = '값은 0보다 커야 합니다.';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate() || !selectedStock) return;

    const alert: AlertSettings = {
      id: editingAlert?.id || Math.random().toString(36).substr(2, 9),
      symbol: selectedStock.symbol,
      symbolName: selectedStock.shortName,
      conditions,
      timeUnit,
      enabled: editingAlert?.enabled ?? true,
      browserPush,
      sound,
      vibration,
      createdAt: editingAlert?.createdAt || new Date().toISOString(),
    };

    onSave(alert);
    resetForm();
    onClose();
  };

  const handleRequestNotification = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setBrowserPush(true);
      }
    } else if (Notification.permission === 'granted') {
      setBrowserPush(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 dark:bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col z-[101]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingAlert ? '알림 수정' : '알림 추가'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="닫기"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 종목 선택 */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">
              종목 선택 *
            </label>
            <StockSearch
              stocks={stocks}
              onSelect={setSelectedStock}
              selectedStock={selectedStock}
            />
            {errors.stock && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.stock}
              </p>
            )}
          </div>

          {/* 조건 설정 */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">
              조건 설정 *
            </label>
            <ConditionForm conditions={conditions} onChange={setConditions} />
            {errors.conditions && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.conditions}
              </p>
            )}
          </div>

          {/* 기간 설정 */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">
              체크 주기
            </label>
            <select
              value={timeUnit}
              onChange={(e) => setTimeUnit(e.target.value as TimeUnit)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1min">1분</option>
              <option value="5min">5분</option>
              <option value="1hour">1시간</option>
              <option value="1day">1일</option>
            </select>
          </div>

          {/* 알림 방식 */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-900 dark:text-white">
              알림 방식
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="checkbox"
                  checked={browserPush}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleRequestNotification();
                    } else {
                      setBrowserPush(false);
                    }
                  }}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    브라우저 푸시 알림
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {typeof window !== 'undefined' &&
                    'Notification' in window &&
                    Notification.permission === 'granted'
                      ? '권한 허용됨'
                      : '권한이 필요합니다'}
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="checkbox"
                  checked={sound}
                  onChange={(e) => setSound(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-gray-900 dark:text-white">
                  사운드
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="checkbox"
                  checked={vibration}
                  onChange={(e) => setVibration(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-gray-900 dark:text-white">
                  진동 (모바일)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-300 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

