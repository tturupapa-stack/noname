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
    <div className="rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 backdrop-blur-sm card-hover card-glow shadow-lg hover:shadow-xl relative overflow-hidden">
      {/* 그라데이션 오버레이 - 애니메이션 */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-blue-400 to-purple-400 animate-float"></div>
      <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full blur-2xl opacity-15 bg-gradient-to-br from-purple-400 to-pink-400 animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="flex items-center justify-between relative z-10">
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

