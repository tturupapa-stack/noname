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
            className="card p-4 hover-border"
          >
            {/* 상단: 종목 정보 및 상태 */}
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <span className="font-black text-[var(--foreground)]">
                {alert.symbol}
              </span>
              <span className="text-sm text-[var(--foreground-muted)]">
                {alert.symbolName}
              </span>
              <span
                className={`badge ${
                  alert.enabled
                    ? 'badge-success'
                    : 'badge-outline'
                }`}
              >
                {alert.enabled ? '활성' : '비활성'}
              </span>
            </div>

            {/* 중단: 조건 정보 */}
            <div className="text-sm text-[var(--foreground-secondary)] mb-1">
              {getConditionText(alert)}
            </div>
            <div className="text-xs text-[var(--foreground-muted)] mb-3">
              체크 주기: {alert.timeUnit === '1min' ? '1분' : alert.timeUnit === '5min' ? '5분' : alert.timeUnit === '1hour' ? '1시간' : '1일'}
            </div>

            {/* 하단: 버튼 그룹 */}
            <div className="flex items-center flex-wrap gap-2 pt-3 border-t border-[var(--border)]">
              <button
                onClick={() => handleToggle(alert.id)}
                className={`btn btn-xs ${
                  alert.enabled
                    ? 'btn-secondary'
                    : 'btn-primary'
                }`}
              >
                {alert.enabled ? '비활성화' : '활성화'}
              </button>
              <button
                onClick={() => onEdit(alert)}
                className="btn btn-xs btn-secondary"
              >
                수정
              </button>
              <button
                onClick={() => handleDelete(alert.id)}
                className="btn btn-xs text-[var(--danger)] border-2 border-[var(--danger)] hover:bg-[var(--danger)] hover:text-white"
              >
                삭제
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

