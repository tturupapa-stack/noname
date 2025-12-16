'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import AlertList from '@/components/AlertList';
import AlertHistory from '@/components/AlertHistory';
import AlertSettingsModal from '@/components/AlertSettingsModal';
import AddAlertButton from '@/components/AddAlertButton';
import ThemeToggle from '@/components/ThemeToggle';
import { useToast } from '@/components/Toast';
import { AlertSettings } from '@/types';
import { saveAlert } from '@/utils/alertStorage';
import { mockAllStocks } from '@/data/mockData';

export default function AlertsPage() {
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
      editingAlert ? '알림이 수정되었습니다.' : '알림이 추가되었습니다.',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50/30 dark:from-black dark:via-gray-900 dark:to-blue-900/20 text-gray-900 dark:text-white transition-colors duration-300">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-dark flex items-center justify-center">
              <span className="text-lg">🌙</span>
            </div>
            <span className="text-xl font-bold gradient-text bg-clip-text text-transparent">
              당신이 잠든 사이
            </span>
          </Link>
          <Navigation />
          <ThemeToggle />
        </div>

        {/* Page Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text bg-clip-text text-transparent mb-2">
              알림 설정
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              종목별 가격/변동률 알림을 설정하고 관리하세요
            </p>
          </div>
          <div className="flex items-center gap-3">
            <AlertHistory />
            <AddAlertButton onClick={handleAddAlertClick} />
          </div>
        </div>

        {/* 알림 목록 */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">활성 알림</h2>
          <AlertList onEdit={handleEditAlert} stocks={mockAllStocks} />
        </div>

        {/* 알림 설정 안내 */}
        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-3">알림 설정 안내</h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>종목별로 가격, 변동률, 거래량 조건을 설정할 수 있습니다</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>최대 3개의 복합 조건을 AND/OR로 연결할 수 있습니다</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>브라우저 푸시, 소리, 진동 알림을 선택할 수 있습니다</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 알림 설정 모달 */}
      <AlertSettingsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSaveAlert}
        stocks={mockAllStocks}
        editingAlert={editingAlert}
      />

      <ToastContainer />
    </div>
  );
}
