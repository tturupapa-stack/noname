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
  // 날짜 형식이면 그대로 반환
  if (/^\d{4}-\d{2}-\d{2}$/.test(id)) {
    return id;
  }
  return null;
}

export default function BriefingDetailPage({ params }: BriefingDetailPageProps) {
  const { id } = use(params);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

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
      <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">브리핑을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !briefing) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{error || '브리핑을 찾을 수 없습니다'}</h1>
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
          >
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-200">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4 inline-block"
          >
            ← 대시보드로 돌아가기
          </Link>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{briefing.symbol}</h1>
              <p className="text-gray-600 dark:text-gray-400">{formatDate(briefing.date)}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <ShareButton briefing={briefing} variant="button" />
              <button
                onClick={() => setIsPreviewModalOpen(true)}
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-all hover:bg-blue-700"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                미리보기
              </button>
              <button
                onClick={handleSendEmail}
                className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-all hover:bg-green-700"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                이메일 발송
              </button>
              <button
                onClick={handleSendSlack}
                className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white transition-all hover:bg-purple-700"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                슬랙 발송
              </button>
            </div>
          </div>
        </div>

        {/* 브리핑 이미지 미리보기 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">브리핑 이미지</h2>
          <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-6 backdrop-blur-sm">
            <div className="aspect-[3/4] w-full max-w-md mx-auto bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-500 text-sm">
                  {briefing.imageBriefing.dimensions.width} ×{' '}
                  {briefing.imageBriefing.dimensions.height}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {(briefing.imageBriefing.fileSize / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 리포트 텍스트 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">리포트 텍스트</h2>
          <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-6 backdrop-blur-sm space-y-6">
            {/* 제목 */}
            <div>
              <h3 className="text-2xl font-bold mb-4">
                {briefing.textSummary.title}
              </h3>
            </div>

            {/* 요약 */}
            <div>
              <h4 className="text-lg font-semibold mb-2 text-blue-600 dark:text-blue-400">요약</h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {briefing.textSummary.summary}
              </p>
            </div>

            {/* 핵심 포인트 */}
            <div>
              <h4 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">
                핵심 포인트
              </h4>
              <ul className="space-y-2">
                {briefing.textSummary.keyPoints.map((point, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-green-600 dark:text-green-400 font-bold mt-1">•</span>
                    <span className="flex-1">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 투자 인사이트 */}
            <div>
              <h4 className="text-lg font-semibold mb-2 text-blue-600 dark:text-blue-400">
                투자 인사이트
              </h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {briefing.textSummary.investmentInsight}
              </p>
            </div>

            {/* 생성 정보 */}
            <div className="pt-4 border-t border-gray-300 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                생성일시: {formatDate(briefing.textSummary.generatedAt)}
              </p>
            </div>
          </div>
        </div>
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
