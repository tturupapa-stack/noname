'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import AlertList from '@/components/AlertList';
import AlertHistory from '@/components/AlertHistory';
import AlertSettingsModal from '@/components/AlertSettingsModal';
import AddAlertButton from '@/components/AddAlertButton';
import ThemeToggle from '@/components/ThemeToggle';
import Logo from '@/components/Logo';
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
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <header className="mb-8 sm:mb-10 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 sm:gap-4 group">
              <div className="transition-transform group-hover:scale-105">
                <Logo variant="icon" size="md" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-[var(--foreground)] tracking-tight group-hover:text-[var(--primary-500)] transition-colors">
                  당신이 잠든 사이
                </h1>
                <p className="text-xs text-[var(--foreground-muted)]">
                  오늘의 시장 브리핑
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <Navigation />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Page Title */}
        <section className="mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '0.05s', opacity: 0 }}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="section-header mb-2">
                <h2 className="section-title text-xl sm:text-2xl">알림 설정</h2>
              </div>
              <p className="text-sm text-[var(--foreground-secondary)]">
                종목별 가격/변동률 알림을 설정하고 관리하세요
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <AlertHistory />
              <AddAlertButton onClick={handleAddAlertClick} />
            </div>
          </div>
        </section>

        {/* 알림 목록 */}
        <section className="mb-8 sm:mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <div className="section-header">
            <h3 className="section-title text-base sm:text-lg">활성 알림</h3>
          </div>
          <AlertList onEdit={handleEditAlert} stocks={mockAllStocks} />
        </section>

        {/* 알림 설정 안내 */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
          <div className="card p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-[var(--foreground)] flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--background)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base sm:text-lg text-[var(--foreground)] mb-3">알림 설정 안내</h3>
                <ul className="space-y-2 text-sm text-[var(--foreground-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--foreground)] mt-0.5">-</span>
                    <span>종목별로 가격, 변동률, 거래량 조건을 설정할 수 있습니다</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--foreground)] mt-0.5">-</span>
                    <span>최대 3개의 복합 조건을 AND/OR로 연결할 수 있습니다</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--foreground)] mt-0.5">-</span>
                    <span>브라우저 푸시, 소리, 진동 알림을 선택할 수 있습니다</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
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
