'use client';

import { Briefing } from '@/types';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface BriefingPreviewModalProps {
  briefing: Briefing;
  isOpen: boolean;
  onClose: () => void;
  onSend: (channels: string[]) => void;
}

export default function BriefingPreviewModal({
  briefing,
  isOpen,
  onClose,
  onSend,
}: BriefingPreviewModalProps) {
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    // ESC 키로 모달 닫기
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChannelToggle = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const handleSend = async () => {
    if (selectedChannels.length === 0) {
      alert('발송 채널을 선택해주세요.');
      return;
    }

    setIsSending(true);
    // 실제로는 API 호출
    setTimeout(() => {
      setIsSending(false);
      onSend(selectedChannels);
      onClose();
      alert(`${selectedChannels.join(', ')}로 발송되었습니다.`);
    }, 1000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 리포트를 마크다운 형식으로 변환
  const markdownContent = `# ${briefing.textSummary.title}

## 요약

${briefing.textSummary.summary}

## 핵심 포인트

${briefing.textSummary.keyPoints.map((point) => `- ${point}`).join('\n')}

## 투자 인사이트

${briefing.textSummary.investmentInsight}

---

*생성일시: ${formatDate(briefing.textSummary.generatedAt)}*`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 dark:bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col z-[101]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">브리핑 미리보기</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {briefing.symbol} · {formatDate(briefing.date)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="닫기"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 브리핑 이미지 프리뷰 */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">브리핑 이미지</h3>
            <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
              <div className="aspect-[3/4] w-full max-w-xs mx-auto bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded flex items-center justify-center">
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

          {/* 브리핑 리포트 마크다운 */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">리포트 텍스트</h3>
            <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6">
              <div className="prose prose-invert dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl font-semibold mt-6 mb-3 text-blue-600 dark:text-blue-400">
                        {children}
                      </h2>
                    ),
                    p: ({ children }) => (
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => (
                      <li className="text-gray-700 dark:text-gray-300">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-gray-900 dark:text-white">
                        {children}
                      </strong>
                    ),
                    hr: () => <hr className="border-gray-300 dark:border-gray-600 my-6" />,
                    em: ({ children }) => (
                      <em className="text-gray-600 dark:text-gray-400 italic">{children}</em>
                    ),
                  }}
                >
                  {markdownContent}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          {/* 발송 채널 선택 */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">발송 채널 선택</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedChannels.includes('email')}
                  onChange={() => handleChannelToggle('email')}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-green-600 focus:ring-green-500 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                />
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-500"
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
                  <span className="font-medium text-gray-900 dark:text-white">이메일</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedChannels.includes('slack')}
                  onChange={() => handleChannelToggle('slack')}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-purple-600 focus:ring-purple-500 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                />
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-purple-500"
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
                  <span className="font-medium text-gray-900 dark:text-white">슬랙</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-300 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSend}
            disabled={isSending || selectedChannels.length === 0}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSending ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                발송 중...
              </>
            ) : (
              <>
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
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                발송하기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

