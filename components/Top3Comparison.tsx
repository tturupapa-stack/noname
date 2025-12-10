import { Stock } from '@/types';
import Top3ComparisonCard from './Top3ComparisonCard';

interface Top3ComparisonProps {
  stocks: Stock[];
}

export default function Top3Comparison({ stocks }: Top3ComparisonProps) {
  // 상위 3개만 선택
  const top3Stocks = stocks.slice(0, 3);

  return (
    <div className="mb-8 relative z-10">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">화제 종목 TOP 3 비교</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
        {top3Stocks.map((stock, index) => (
          <Top3ComparisonCard
            key={stock.symbol}
            stock={stock}
            rank={stock.rank || index + 1}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

