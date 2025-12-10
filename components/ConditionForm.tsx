'use client';

import { useState } from 'react';
import {
  AlertCondition,
  ConditionType,
  ComparisonOperator,
  LogicalOperator,
} from '@/types';

interface ConditionFormProps {
  conditions: AlertCondition[];
  onChange: (conditions: AlertCondition[]) => void;
  maxConditions?: number;
}

export default function ConditionForm({
  conditions,
  onChange,
  maxConditions = 3,
}: ConditionFormProps) {
  const addCondition = () => {
    if (conditions.length >= maxConditions) return;

    const newCondition: AlertCondition = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'price',
      operator: '>=',
      value: 0,
      logicalOperator: conditions.length > 0 ? 'AND' : undefined,
    };

    onChange([...conditions, newCondition]);
  };

  const removeCondition = (id: string) => {
    const filtered = conditions.filter((c) => c.id !== id);
    // 첫 번째 조건의 logicalOperator 제거
    if (filtered.length > 0) {
      filtered[0].logicalOperator = undefined;
    }
    onChange(filtered);
  };

  const updateCondition = (id: string, updates: Partial<AlertCondition>) => {
    const updated = conditions.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    onChange(updated);
  };

  const updateLogicalOperator = (id: string, operator: LogicalOperator) => {
    const updated = conditions.map((c) =>
      c.id === id ? { ...c, logicalOperator: operator } : c
    );
    onChange(updated);
  };

  const getConditionLabel = (type: ConditionType) => {
    switch (type) {
      case 'price':
        return '가격';
      case 'changePercent':
        return '변동률(%)';
      case 'volume':
        return '거래량';
    }
  };

  const getOperatorLabel = (operator: ComparisonOperator) => {
    switch (operator) {
      case '>=':
        return '이상';
      case '<=':
        return '이하';
      case '>':
        return '초과';
      case '<':
        return '미만';
    }
  };

  return (
    <div className="space-y-4">
      {conditions.map((condition, index) => (
        <div key={condition.id} className="flex items-start gap-3">
          {/* 논리 연산자 */}
          {index > 0 && (
            <select
              value={condition.logicalOperator || 'AND'}
              onChange={(e) =>
                updateLogicalOperator(
                  condition.id,
                  e.target.value as LogicalOperator
                )
              }
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
          )}

          {/* 조건 설정 */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              value={condition.type}
              onChange={(e) =>
                updateCondition(condition.id, {
                  type: e.target.value as ConditionType,
                })
              }
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="price">가격</option>
              <option value="changePercent">변동률(%)</option>
              <option value="volume">거래량</option>
            </select>

            <select
              value={condition.operator}
              onChange={(e) =>
                updateCondition(condition.id, {
                  operator: e.target.value as ComparisonOperator,
                })
              }
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value=">=">이상</option>
              <option value="<=">이하</option>
              <option value=">">초과</option>
              <option value="<">미만</option>
            </select>

            <div className="flex gap-2">
              <input
                type="number"
                value={condition.value}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  updateCondition(condition.id, { value });
                }}
                step={condition.type === 'changePercent' ? 0.01 : 1}
                min={0}
                placeholder="값 입력"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => removeCondition(condition.id)}
                className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                aria-label="조건 삭제"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      ))}

      {conditions.length < maxConditions && (
        <button
          onClick={addCondition}
          className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors"
        >
          + 조건 추가
        </button>
      )}
    </div>
  );
}

