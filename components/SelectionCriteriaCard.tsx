import { memo } from 'react';
import { SelectionCriteria } from '@/types';
import Link from 'next/link';

interface SelectionCriteriaCardProps {
  criteria: SelectionCriteria;
  stockSymbol: string;
}

function SelectionCriteriaCard({
  criteria,
  stockSymbol,
}: SelectionCriteriaCardProps) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'volume':
        return '거래량';
      case 'gain':
        return '상승률';
      case 'composite':
        return '복합 점수';
      default:
        return type;
    }
  };

  return (
    <div className="rounded-lg border border-blue-500/20 bg-white dark:bg-gray-900/50 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">선정 기준</div>
          <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            {getTypeLabel(criteria.type)} {criteria.rank}위
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">{criteria.description}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">종목</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{stockSymbol}</div>
        </div>
      </div>
    </div>
  );
}

export default memo(SelectionCriteriaCard);

