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
        <div key={condition.id} className="p-4 border-2 border-[var(--border)] bg-[var(--background-secondary)]">
          {/* 논리 연산자 */}
          {index > 0 && (
            <div className="mb-3">
              <select
                value={condition.logicalOperator || 'AND'}
                onChange={(e) =>
                  updateLogicalOperator(
                    condition.id,
                    e.target.value as LogicalOperator
                  )
                }
                className="px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors font-bold"
              >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
              </select>
            </div>
          )}

          {/* 조건 설정 - 삭제 버튼과 같은 행에 배치 */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={condition.type}
                onChange={(e) =>
                  updateCondition(condition.id, {
                    type: e.target.value as ConditionType,
                  })
                }
                className="h-12 px-3 border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
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
                className="h-12 px-3 border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
              >
                <option value=">=">이상</option>
                <option value="<=">이하</option>
                <option value=">">초과</option>
                <option value="<">미만</option>
              </select>

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
                className="h-12 px-3 border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
              />
            </div>

            {/* 삭제 버튼 - 입력 필드와 동일한 높이 */}
            <button
              onClick={() => removeCondition(condition.id)}
              className="h-12 px-4 text-[var(--danger)] border-2 border-[var(--danger)] hover:bg-[var(--danger)] hover:text-white transition-colors font-bold text-sm whitespace-nowrap flex items-center justify-center"
              aria-label="조건 삭제"
            >
              삭제
            </button>
          </div>
        </div>
      ))}

      {conditions.length < maxConditions && (
        <button
          onClick={addCondition}
          className="w-full px-4 py-3 border-2 border-dashed border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-colors font-bold"
        >
          + 조건 추가
        </button>
      )}
    </div>
  );
}

