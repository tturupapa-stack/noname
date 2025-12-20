import { Stock } from '@/types';
import Top3ComparisonCard from './Top3ComparisonCard';

interface Top3ComparisonProps {
  stocks: Stock[];
}

export default function Top3Comparison({ stocks }: Top3ComparisonProps) {
  const top3Stocks = stocks.slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {top3Stocks.map((stock, index) => (
        <Top3ComparisonCard
          key={stock.symbol}
          stock={stock}
          rank={stock.rank || index + 1}
          index={index}
        />
      ))}
    </div>
  );
}
