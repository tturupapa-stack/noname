'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import StockCard from '@/components/StockCard';
import SelectionCriteriaCard from '@/components/SelectionCriteriaCard';
import BriefingCard from '@/components/BriefingCard';
import CreateBriefingButton from '@/components/CreateBriefingButton';
import Top3Comparison from '@/components/Top3Comparison';
import ThemeToggle from '@/components/ThemeToggle';
import AddAlertButton from '@/components/AddAlertButton';
import AlertList from '@/components/AlertList';
import AlertHistory from '@/components/AlertHistory';
import AlertSettingsModal from '@/components/AlertSettingsModal';
import dynamic from 'next/dynamic';
import FavoriteList from '@/components/FavoriteList';
import StockSearchBar from '@/components/StockSearchBar';

// 코드 스플리팅: 무거운 컴포넌트 동적 로드
const BriefingCalendar = dynamic(() => import('@/components/BriefingCalendar'), {
  loading: () => <div className="text-center py-8 text-gray-500 dark:text-gray-400">로딩 중...</div>,
});
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt';
import { useToast } from '@/components/Toast';
import { AlertSettings, Stock, SelectionCriteria, Briefing, PriceData } from '@/types';
import { saveAlert } from '@/utils/alertStorage';
import {
  mockAllStocks,
} from '@/data/mockData';
import { fetchTrendingStock, fetchTopNStocks, fetchBriefings, fetchStockChart } from '@/services/api';
import { adaptStock, adaptRankedStock, adaptSelectionCriteria, adaptBriefings, adaptChartData } from '@/services/apiAdapters';

export default function Home() {
  const [editingAlert, setEditingAlert] = useState<AlertSettings | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast, ToastContainer } = useToast();

  // API 데이터 상태
  const [topStock, setTopStock] = useState<Stock | null>(null);
  const [selectionCriteria, setSelectionCriteria] = useState<SelectionCriteria | null>(null);
  const [trendingStocks, setTrendingStocks] = useState<Stock[]>([]);
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [chartData, setChartData] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API 데이터 로드
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        // 병렬로 API 호출
        const [trendingRes, topNRes, briefingsRes] = await Promise.all([
          fetchTrendingStock('most_actives'),
          fetchTopNStocks('most_actives', 3),
          fetchBriefings(1, 10),
        ]);

        // 화제 종목 (TOP 1)
        const adaptedTopStock = adaptStock(trendingRes.stock, trendingRes.score, 1);
        setTopStock(adaptedTopStock);

        // 선정 기준
        const adaptedCriteria = adaptSelectionCriteria(trendingRes.score, trendingRes.why_hot);
        setSelectionCriteria(adaptedCriteria);

        // TOP 3 종목
        const adaptedTrendingStocks = topNRes.stocks.map(adaptRankedStock);
        setTrendingStocks(adaptedTrendingStocks);

        // 브리핑 히스토리
        const adaptedBriefings = adaptBriefings(briefingsRes.briefings);
        setBriefings(adaptedBriefings);

        // 화제 종목 차트 데이터 로드
        if (adaptedTopStock) {
          try {
            const chartRes = await fetchStockChart(adaptedTopStock.symbol, '5d');
            const adaptedChartData = adaptChartData(chartRes.data);
            setChartData(adaptedChartData);
          } catch (chartErr) {
            console.error('차트 데이터 로드 실패:', chartErr);
            // 차트 실패해도 다른 데이터는 표시
          }
        }

      } catch (err) {
        console.error('API 호출 실패:', err);
        setError(err instanceof Error ? err.message : 'API 호출 실패');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleEditAlert = useCallback((alert: AlertSettings) => {
    setEditingAlert(alert);
    setIsModalOpen(true);
  }, []);

  const handleSaveAlert = useCallback((alert: AlertSettings) => {
    saveAlert(alert);
    showToast(
      editingAlert
        ? '알림이 수정되었습니다.'
        : '알림이 추가되었습니다.',
      'success'
    );
    setEditingAlert(null);
    setIsModalOpen(false);
  }, [editingAlert, showToast]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setEditingAlert(null);
  }, []);

  const handleAddAlertClick = useCallback(() => {
    setEditingAlert(null);
    setIsModalOpen(true);
  }, []);

  // 모든 종목 목록 - API 데이터 + 검색용 목업 데이터
  const allStocks = useMemo(() => {
    if (trendingStocks.length > 0) {
      return [...trendingStocks, ...mockAllStocks.filter(s => !trendingStocks.find(t => t.symbol === s.symbol))];
    }
    return mockAllStocks;
  }, [trendingStocks]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-blue-50/30 dark:from-black dark:via-gray-900 dark:to-blue-900/20 text-gray-900 dark:text-white transition-colors duration-300">
      {/* 배경 애니메이션 파티클 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="particle w-32 h-32 top-10 left-10 opacity-20" style={{ animationDelay: '0s' }}></div>
        <div className="particle w-24 h-24 top-1/4 right-20 opacity-15" style={{ animationDelay: '2s' }}></div>
        <div className="particle w-40 h-40 bottom-20 left-1/4 opacity-10" style={{ animationDelay: '4s' }}></div>
        <div className="particle w-28 h-28 bottom-1/4 right-1/3 opacity-20" style={{ animationDelay: '6s' }}></div>
        <div className="particle w-36 h-36 top-1/2 left-1/2 opacity-15" style={{ animationDelay: '8s' }}></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Header */}
        <div className="flex flex-col gap-6 mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* 로고 */}
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl gradient-dark flex items-center justify-center shadow-glow overflow-hidden logo-heartbeat">
                  <img 
                    src="/logo-main.png" 
                    alt="로고" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // 로고 로드 실패 시 대체 아이콘
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      if (target.parentElement) {
                        target.parentElement.innerHTML = '<span class="text-2xl animate-float">🌙</span>';
                      }
                    }}
                  />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse glow-pulse"></div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2 gradient-text bg-clip-text text-transparent text-glow">
                  당신이 잠든 사이
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg animate-fade-in-up">오늘의 화제 종목 대시보드</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <AlertHistory />
              <AddAlertButton onClick={handleAddAlertClick} />
              <ThemeToggle />
              <CreateBriefingButton />
            </div>
          </div>
          {/* 종목 검색바 */}
          <div className="flex justify-center">
            <StockSearchBar stocks={allStocks} />
          </div>
        </div>

        {/* 관심 종목 */}
        <div className="mb-8">
          <FavoriteList stocks={allStocks} />
        </div>

        {/* 알림 목록 */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gradient-text bg-clip-text text-transparent">알림 설정</h2>
          </div>
          <AlertList onEdit={handleEditAlert} stocks={allStocks} />
        </div>

        {/* 화제 종목 TOP 3 비교 */}
        <div className="mb-12">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">TOP 3 종목 로딩 중...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">데이터 로드 실패: {error}</div>
          ) : (
            <Top3Comparison stocks={trendingStocks} />
          )}
        </div>

        {/* 오늘의 화제 종목 카드 */}
        <div className="mb-12 relative z-0">
          <h2 className="text-2xl font-bold mb-6 gradient-text bg-clip-text text-transparent">오늘의 화제 종목</h2>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">화제 종목 로딩 중...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">데이터 로드 실패: {error}</div>
          ) : topStock && selectionCriteria ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StockCard
                stock={topStock}
                isLarge={true}
                chartData={chartData}
              />
              <SelectionCriteriaCard
                criteria={selectionCriteria}
                stockSymbol={topStock.symbol}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">화제 종목 데이터가 없습니다</div>
          )}
        </div>

        {/* 브리핑 달력 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 gradient-text bg-clip-text text-transparent">브리핑 달력</h2>
          <BriefingCalendar briefings={briefings} />
        </div>

        {/* 최근 브리핑 히스토리 */}
        <div>
          <h2 className="text-2xl font-bold mb-6 gradient-text bg-clip-text text-transparent">최근 브리핑 히스토리</h2>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">브리핑 히스토리 로딩 중...</div>
          ) : briefings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {briefings.map((briefing, index) => (
                <BriefingCard key={briefing.briefingId} briefing={briefing} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">브리핑 히스토리가 없습니다</div>
          )}
        </div>
      </div>

      {/* 알림 설정 모달 */}
      <AlertSettingsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSaveAlert}
        stocks={allStocks}
        editingAlert={editingAlert}
      />

      <ToastContainer />
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
    </div>
  );
}
