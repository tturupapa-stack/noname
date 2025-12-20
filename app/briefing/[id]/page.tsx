'use client';

import { use, useState, useEffect } from 'react';
import { Briefing } from '@/types';
import Link from 'next/link';
import BriefingPreviewModal from '@/components/BriefingPreviewModal';
import ShareButton from '@/components/ShareButton';
import { fetchBriefingByDate } from '@/services/api';
import { adaptBriefing } from '@/services/apiAdapters';

interface BriefingDetailPageProps {
  params: Promise<{ id: string }>;
}

// briefing ID에서 날짜 추출 (brief_YYYYMMDD_SYMBOL_001 -> YYYY-MM-DD)
function extractDateFromBriefingId(id: string): string | null {
  const match = id.match(/^brief_(\d{4})(\d{2})(\d{2})_/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(id)) {
    return id;
  }
  return null;
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

export default function BriefingDetailPage({ params }: BriefingDetailPageProps) {
  const { id } = use(params);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [stars, setStars] = useState<Array<{id: number; left: string; top: string; animationDelay: string; size: number}>>([]);

  useEffect(() => {
    setStars(generateStars(40));
  }, []);

  useEffect(() => {
    async function loadBriefing() {
      setIsLoading(true);
      setError(null);

      try {
        const date = extractDateFromBriefingId(id);
        if (!date) {
          throw new Error('잘못된 브리핑 ID 형식입니다');
        }

        const response = await fetchBriefingByDate(date);
        const adaptedBriefing = adaptBriefing(response.briefing);
        setBriefing(adaptedBriefing);
      } catch (err) {
        console.error('브리핑 로드 실패:', err);
        setError(err instanceof Error ? err.message : '브리핑을 불러올 수 없습니다');
      } finally {
        setIsLoading(false);
      }
    }

    loadBriefing();
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSendEmail = () => {
    alert('이메일 발송 기능은 준비 중입니다.');
  };

  const handleSendSlack = () => {
    alert('슬랙 발송 기능은 준비 중입니다.');
  };

  const handleSendFromModal = (channels: string[]) => {
    console.log('발송 채널:', channels);
  };

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
          <p className="opacity-60">브리핑을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !briefing) {
    return (
      <div className="min-h-screen relative bg-dawn-gradient flex items-center justify-center">
        <div className="text-center card-glass p-10 max-w-md mx-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-3">{error || '브리핑을 찾을 수 없습니다'}</h1>
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

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl relative z-10">
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

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-dawn mb-1">{briefing.shortName}</h1>
              <p className="text-sm text-[var(--foreground-muted)] mb-1">{briefing.symbol}</p>
              <p className="opacity-60 text-sm">{formatDate(briefing.date)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ShareButton briefing={briefing} variant="button" />
              <button
                onClick={() => setIsPreviewModalOpen(true)}
                className="btn btn-secondary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                미리보기
              </button>
              <button
                onClick={handleSendEmail}
                className="btn btn-ghost flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                이메일
              </button>
              <button
                onClick={handleSendSlack}
                className="btn btn-ghost flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                슬랙
              </button>
            </div>
          </div>
        </header>

        {/* 브리핑 이미지 미리보기 */}
        <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <div className="section-header">
            <h2 className="section-title text-lg">브리핑 이미지</h2>
          </div>
          <div className="card p-6">
            <div className="aspect-[3/4] w-full max-w-md mx-auto bg-[var(--background-secondary)] border-2 border-[var(--border)] flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[var(--foreground)] flex items-center justify-center">
                  <svg className="w-8 h-8 text-[var(--background)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {briefing.imageBriefing.dimensions.width} × {briefing.imageBriefing.dimensions.height}
                </p>
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  {(briefing.imageBriefing.fileSize / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 리포트 텍스트 */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
          <div className="section-header">
            <h2 className="section-title text-lg">리포트 텍스트</h2>
          </div>
          <div className="card-glass p-6 sm:p-8 space-y-8">
            {/* 제목 */}
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-dawn leading-tight">
                {briefing.textSummary.title}
              </h3>
            </div>

            {/* 요약 */}
            <div>
              <h4 className="text-sm font-semibold text-[#ff7e5f] mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-[#ff7e5f] to-[#feb47b] rounded-full"></span>
                요약
              </h4>
              <p className="opacity-80 leading-relaxed">
                {briefing.textSummary.summary}
              </p>
            </div>

            {/* 핵심 포인트 */}
            <div>
              <h4 className="text-sm font-semibold text-[#ff7e5f] mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-[#ff7e5f] to-[#feb47b] rounded-full"></span>
                핵심 포인트
              </h4>
              <ul className="space-y-3">
                {briefing.textSummary.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="opacity-80 leading-relaxed pt-0.5">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 투자 인사이트 */}
            <div>
              <h4 className="text-sm font-semibold text-[#ff7e5f] mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-[#ff7e5f] to-[#feb47b] rounded-full"></span>
                투자 인사이트
              </h4>
              <p className="opacity-80 leading-relaxed">
                {briefing.textSummary.investmentInsight}
              </p>
            </div>

            {/* 생성 정보 */}
            <div className="pt-6 border-t border-[var(--card-border)]">
              <p className="text-sm opacity-50">
                생성일시: {formatDate(briefing.textSummary.generatedAt)}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* 미리보기 모달 */}
      {briefing && (
        <BriefingPreviewModal
          briefing={briefing}
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          onSend={handleSendFromModal}
        />
      )}
    </div>
  );
}
