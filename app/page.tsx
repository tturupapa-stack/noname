'use client';

import { useState, useMemo, useCallback } from 'react';
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
import { AlertSettings } from '@/types';
import { saveAlert } from '@/utils/alertStorage';
import {
  mockTopStock,
  mockSelectionCriteria,
  mockBriefings,
  mockTopStockChartData,
  mockTrendingStocks,
  mockAllStocks,
} from '@/data/mockData';

export default function Home() {
  const [editingAlert, setEditingAlert] = useState<AlertSettings | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast, ToastContainer } = useToast();

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

  // 모든 종목 목록 (실제로는 API에서 가져올 데이터) - useMemo로 메모이제이션
  const allStocks = useMemo(() => mockTrendingStocks, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-200">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">당신이 잠든 사이</h1>
              <p className="text-gray-600 dark:text-gray-400">오늘의 화제 종목 대시보드</p>
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
            <StockSearchBar stocks={mockAllStocks} />
          </div>
        </div>

        {/* 관심 종목 */}
        <div className="mb-8">
          <FavoriteList stocks={allStocks} />
        </div>

        {/* 알림 목록 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">알림 설정</h2>
          </div>
          <AlertList onEdit={handleEditAlert} stocks={allStocks} />
        </div>

        {/* 화제 종목 TOP 3 비교 */}
        <Top3Comparison stocks={mockTrendingStocks} />

        {/* 오늘의 화제 종목 카드 */}
        <div className="mb-8 relative z-0">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">오늘의 화제 종목</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StockCard
              stock={mockTopStock}
              isLarge={true}
              chartData={mockTopStockChartData}
            />
            <SelectionCriteriaCard
              criteria={mockSelectionCriteria}
              stockSymbol={mockTopStock.symbol}
            />
          </div>
        </div>

        {/* 브리핑 달력 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">브리핑 달력</h2>
          <BriefingCalendar briefings={mockBriefings} />
        </div>

        {/* 최근 브리핑 히스토리 */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">최근 브리핑 히스토리</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockBriefings.map((briefing, index) => (
                  <BriefingCard key={briefing.briefingId} briefing={briefing} index={index} />
                ))}
          </div>
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
