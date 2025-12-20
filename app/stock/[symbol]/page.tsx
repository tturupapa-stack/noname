'use client';

import { use, useState, useEffect } from 'react';
import { Stock, PriceData } from '@/types';
import Link from 'next/link';
import StockChart from '@/components/StockChart';
import FavoriteIcon from '@/components/FavoriteIcon';
import AnimatedNumber from '@/components/AnimatedNumber';
import { fetchStockDetail, fetchStockChart } from '@/services/api';
import { adaptStockDetail, adaptChartData } from '@/services/apiAdapters';

interface StockDetailPageProps {
  params: Promise<{ symbol: string }>;
}

// 별 생성 함수
function generateStars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 60}%`,
    animationDelay: `${Math.random() * 4}s`,
    size: Math.random() * 2 + 1,
  }));
}

export default function StockDetailPage({ params }: StockDetailPageProps) {
  const { symbol } = use(params);
  const [stock, setStock] = useState<Stock | null>(null);
  const [chartData, setChartData] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stars, setStars] = useState<Array<{id: number; left: string; top: string; animationDelay: string; size: number}>>([]);

  useEffect(() => {
    setStars(generateStars(40));
  }, []);

  useEffect(() => {
    async function loadStockData() {
      setIsLoading(true);
      setError(null);

      try {
        const [stockRes, chartRes] = await Promise.all([
          fetchStockDetail(symbol),
          fetchStockChart(symbol, '5d'),
        ]);

        const adaptedStock = adaptStockDetail(stockRes.stock);
        setStock(adaptedStock);

        const adaptedChartData = adaptChartData(chartRes.data);
        setChartData(adaptedChartData);
      } catch (err) {
        console.error('종목 데이터 로드 실패:', err);
        setError(err instanceof Error ? err.message : '데이터 로드 실패');
      } finally {
        setIsLoading(false);
      }
    }

    loadStockData();
  }, [symbol]);

  if (isLoading) {
    return (
      <div className="min-h-screen relative bg-dawn-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#ff7e5f] to-[#feb47b] flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="opacity-60">종목 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="min-h-screen relative bg-dawn-gradient flex items-center justify-center">
        <div className="text-center card-glass p-10 max-w-md mx-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-3">{error || '종목을 찾을 수 없습니다'}</h1>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#ff7e5f] hover:text-[#feb47b] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const isPositive = stock.change >= 0;

  const formatPrice = (price: number) => {
    return stock.symbol.length === 6 ? `₩${price.toLocaleString()}` : `$${price.toFixed(2)}`;
  };

  const formatMarketCap = (marketCap: number) => {
    if (stock.symbol.length === 6) {
      return `₩${(marketCap / 1000000000000).toFixed(1)}T`;
    }
    if (marketCap >= 1000000000000) {
      return `$${(marketCap / 1000000000000).toFixed(2)}T`;
    }
    return `$${(marketCap / 1000000000).toFixed(1)}B`;
  };

  return (
    <div className="min-h-screen relative bg-dawn-gradient">
      {/* 별 배경 */}
      <div className="stars-container">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: star.animationDelay,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl relative z-10">
        {/* Header */}
        <header className="mb-8 animate-fade-in-up">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#ff7e5f] hover:text-[#feb47b] transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            대시보드로 돌아가기
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-display text-4xl sm:text-5xl text-dawn">{stock.symbol}</h1>
                {stock.rank > 0 && (
                  <span className="px-3 py-1 bg-gradient-to-r from-[#ff7e5f] to-[#feb47b] text-white rounded-full text-sm font-semibold">
                    {stock.rank}위
                  </span>
                )}
                <FavoriteIcon stock={stock} size="md" />
              </div>
              <p className="text-lg opacity-60">{stock.shortName}</p>
            </div>
          </div>
        </header>

        {/* 주가 정보 카드 */}
        <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <div className={`card-glass p-6 border-l-4 ${isPositive ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-xs opacity-40 mb-2">현재가</div>
                <div className={`text-3xl font-bold ${isPositive ? 'price-up' : 'price-down'}`}>
                  <AnimatedNumber
                    value={stock.currentPrice}
                    prefix={stock.symbol.length === 6 ? '₩' : '$'}
                    decimals={stock.symbol.length === 6 ? 0 : 2}
                    duration={1.5}
                  />
                </div>
              </div>
              <div>
                <div className="text-xs opacity-40 mb-2">변동률</div>
                <div className={`text-2xl font-bold ${isPositive ? 'price-up' : 'price-down'}`}>
                  <AnimatedNumber
                    value={stock.changePercent}
                    prefix={isPositive ? '+' : ''}
                    suffix="%"
                    decimals={2}
                    duration={1.5}
                  />
                </div>
                <div className={`text-sm ${isPositive ? 'price-up' : 'price-down'} mt-1`}>
                  {isPositive ? '+' : ''}
                  {stock.symbol.length === 6 ? stock.change.toLocaleString() : stock.change.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs opacity-40 mb-2">거래량</div>
                <div className="text-2xl font-bold">
                  <AnimatedNumber
                    value={stock.volume / 1000000}
                    suffix="M"
                    decimals={1}
                    duration={1.5}
                  />
                </div>
              </div>
              <div>
                <div className="text-xs opacity-40 mb-2">시가총액</div>
                <div className="text-2xl font-bold text-[#ff7e5f]">
                  {formatMarketCap(stock.marketCap)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 상세 정보 */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card-glass p-6 animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <h3 className="text-sm font-semibold text-[#ff7e5f] mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-gradient-to-b from-[#ff7e5f] to-[#feb47b] rounded-full"></span>
              기본 정보
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-[var(--card-border)]">
                <span className="opacity-60">심볼</span>
                <span className="font-medium">{stock.symbol}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[var(--card-border)]">
                <span className="opacity-60">종목명</span>
                <span className="font-medium">{stock.shortName}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="opacity-60">시가총액</span>
                <span className="font-medium">{formatMarketCap(stock.marketCap)}</span>
              </div>
            </div>
          </div>

          <div className="card-glass p-6 animate-fade-in-up" style={{ animationDelay: '0.25s', opacity: 0 }}>
            <h3 className="text-sm font-semibold text-[#ff7e5f] mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-gradient-to-b from-[#ff7e5f] to-[#feb47b] rounded-full"></span>
              거래 정보
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-[var(--card-border)]">
                <span className="opacity-60">거래량</span>
                <span className="font-medium">{stock.volume.toLocaleString()} 주</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[var(--card-border)]">
                <span className="opacity-60">등락</span>
                <span className={`font-medium ${isPositive ? 'price-up' : 'price-down'}`}>
                  {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="opacity-60">변동액</span>
                <span className={`font-medium ${isPositive ? 'price-up' : 'price-down'}`}>
                  {isPositive ? '+' : ''}{formatPrice(Math.abs(stock.change))}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 주가 차트 */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
          <div className="section-header">
            <h3 className="section-title text-lg">최근 5일간 주가 추이</h3>
          </div>
          <div className="card-glass p-6">
            {chartData.length > 0 ? (
              <StockChart data={chartData} isPositive={isPositive} />
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff7e5f]/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#ff7e5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <p className="opacity-60">차트 데이터가 없습니다</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
