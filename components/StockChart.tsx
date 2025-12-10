'use client';

import {
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { PriceData } from '@/types';

interface StockChartProps {
  data: PriceData[];
  isPositive: boolean;
}

export default function StockChart({ data, isPositive }: StockChartProps) {
  // 날짜 포맷팅 (MM/DD)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 차트 데이터 준비 (역순으로 정렬하여 오래된 날짜부터 표시)
  const chartData = [...data].reverse().map((item) => ({
    ...item,
    dateLabel: formatDate(item.date),
  }));

  const lineColor = isPositive ? '#22c55e' : '#ef4444'; // green-500 : red-500
  const barColor = isPositive ? '#22c55e' : '#ef4444';

  return (
    <div className="w-full h-80 mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="dateLabel"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            yAxisId="left"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            domain={['auto', 'auto']}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#f3f4f6',
            }}
            labelStyle={{ color: '#9ca3af' }}
            formatter={(value: number, name: string) => {
              if (name === 'price' || name === 'close') {
                return [`$${value.toFixed(2)}`, '종가'];
              }
              if (name === 'volume') {
                return [`${(value / 1000000).toFixed(1)}M`, '거래량'];
              }
              return [value, name];
            }}
          />
          {/* 주가 라인 차트 */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="close"
            stroke={lineColor}
            strokeWidth={2}
            dot={{ fill: lineColor, r: 4 }}
            activeDot={{ r: 6 }}
            name="price"
          />
          {/* 거래량 바 차트 */}
          <Bar
            yAxisId="right"
            dataKey="volume"
            fill={barColor}
            fillOpacity={0.3}
            name="volume"
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-0.5 ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>종가</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 ${isPositive ? 'bg-green-500/30' : 'bg-red-500/30'}`}></div>
          <span>거래량</span>
        </div>
      </div>
    </div>
  );
}

