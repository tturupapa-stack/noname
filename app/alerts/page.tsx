'use client';

import { useState, useCallback, useEffect } from 'react';
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

export default function AlertsPage() {
  const [editingAlert, setEditingAlert] = useState<AlertSettings | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast, ToastContainer } = useToast();
  const [stars, setStars] = useState<Array<{id: number; left: string; top: string; animationDelay: string; size: number}>>([]);

  useEffect(() => {
    setStars(generateStars(40));
  }, []);

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

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl relative z-10">
        {/* Header */}
        <header className="mb-10 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4 group">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff7e5f] to-[#feb47b] flex items-center justify-center shadow-lg animate-glow overflow-hidden">
                  <img
                    src="/logo-main.png"
                    alt="로고"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      if (target.parentElement) {
                        target.parentElement.innerHTML = '<span class="text-xl">🌅</span>';
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <h1 className="text-display text-xl sm:text-2xl text-dawn group-hover:opacity-80 transition-opacity">
                  당신이 잠든 사이
                </h1>
                <p className="text-xs text-[#1a1a2e]/50 dark:text-[#faf8f5]/40">
                  새벽이 밝아올 때
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Navigation />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Page Title */}
        <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="section-header mb-0">
              <h2 className="section-title text-2xl sm:text-3xl">알림 설정</h2>
              <p className="text-sm opacity-60 mt-2">
                종목별 가격/변동률 알림을 설정하고 관리하세요
              </p>
            </div>
            <div className="flex items-center gap-3">
              <AlertHistory />
              <AddAlertButton onClick={handleAddAlertClick} />
            </div>
          </div>
        </section>

        {/* 알림 목록 */}
        <section className="mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
          <div className="section-header">
            <h3 className="section-title text-lg">활성 알림</h3>
          </div>
          <AlertList onEdit={handleEditAlert} stocks={mockAllStocks} />
        </section>

        {/* 알림 설정 안내 */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
          <div className="card-glass p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff7e5f]/20 to-[#feb47b]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#ff7e5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-3">알림 설정 안내</h3>
                <ul className="space-y-2 text-sm opacity-70">
                  <li className="flex items-start gap-2">
                    <span className="text-[#ff7e5f] mt-0.5">•</span>
                    <span>종목별로 가격, 변동률, 거래량 조건을 설정할 수 있습니다</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#ff7e5f] mt-0.5">•</span>
                    <span>최대 3개의 복합 조건을 AND/OR로 연결할 수 있습니다</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#ff7e5f] mt-0.5">•</span>
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
