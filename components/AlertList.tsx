'use client';

import { useState, useEffect } from 'react';
import { AlertSettings, Stock } from '@/types';
import {
  getAlerts,
  toggleAlert,
  deleteAlert,
} from '@/utils/alertStorage';

interface AlertListProps {
  onEdit: (alert: AlertSettings) => void;
  stocks: Stock[];
}

export default function AlertList({ onEdit, stocks }: AlertListProps) {
  const [alerts, setAlerts] = useState<AlertSettings[]>([]);

  useEffect(() => {
    setAlerts(getAlerts());
  }, []);

  const handleToggle = (alertId: string) => {
    toggleAlert(alertId);
    setAlerts(getAlerts());
  };

  const handleDelete = (alertId: string) => {
    if (confirm('이 알림을 삭제하시겠습니까?')) {
      deleteAlert(alertId);
      setAlerts(getAlerts());
    }
  };

  const getConditionText = (alert: AlertSettings) => {
    return alert.conditions
      .map((cond, index) => {
        const prefix =
          index > 0 && cond.logicalOperator
            ? ` ${cond.logicalOperator} `
            : '';
        const type =
          cond.type === 'price'
            ? '가격'
            : cond.type === 'changePercent'
              ? '변동률'
              : '거래량';
        const operator =
          cond.operator === '>='
            ? '이상'
            : cond.operator === '<='
              ? '이하'
              : cond.operator === '>'
                ? '초과'
                : '미만';
        return `${prefix}${type} ${operator} ${cond.value}${
          cond.type === 'changePercent' ? '%' : cond.type === 'volume' ? 'M' : ''
        }`;
      })
      .join('');
  };

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        설정된 알림이 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const stock = stocks.find((s) => s.symbol === alert.symbol);
        return (
          <div
            key={alert.id}
            className="p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/50"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-900 dark:text-white">
                    {alert.symbol}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {alert.symbolName}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      alert.enabled
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {alert.enabled ? '활성' : '비활성'}
                  </span>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {getConditionText(alert)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  체크 주기: {alert.timeUnit === '1min' ? '1분' : alert.timeUnit === '5min' ? '5분' : alert.timeUnit === '1hour' ? '1시간' : '1일'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(alert.id)}
                  className={`px-3 py-1 rounded text-sm ${
                    alert.enabled
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  {alert.enabled ? '비활성화' : '활성화'}
                </button>
                <button
                  onClick={() => onEdit(alert)}
                  className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(alert.id)}
                  className="px-3 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

