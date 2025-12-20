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
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 dark:bg-black/80 backdrop-blur-sm modal-backdrop"
      style={{ zIndex: 'var(--z-modal-backdrop)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--background)] border-2 border-[var(--foreground)] shadow-2xl overflow-hidden flex flex-col modal-content"
        style={{ zIndex: 'var(--z-modal)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b-2 border-[var(--foreground)]">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)]">브리핑 미리보기</h2>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              {briefing.symbol} · {formatDate(briefing.date)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
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
            <h3 className="text-lg font-bold mb-3 text-[var(--foreground)]">브리핑 이미지</h3>
            <div className="border border-[var(--border)] bg-[var(--background-secondary)] p-4">
              <div className="aspect-[3/4] w-full max-w-xs mx-auto bg-[var(--background-tertiary)] border border-[var(--border)] flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-[var(--foreground-muted)]"
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
                  <p className="text-[var(--foreground-muted)] text-sm">
                    {briefing.imageBriefing.dimensions.width} ×{' '}
                    {briefing.imageBriefing.dimensions.height}
                  </p>
                  <p className="text-[var(--foreground-muted)] text-xs mt-1">
                    {(briefing.imageBriefing.fileSize / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 브리핑 리포트 마크다운 */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-[var(--foreground)]">리포트 텍스트</h3>
            <div className="border border-[var(--border)] bg-[var(--background-secondary)] p-6">
              <div className="prose prose-invert dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-black mb-4 text-[var(--foreground)]">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl font-bold mt-6 mb-3 text-[var(--foreground)]">
                        {children}
                      </h2>
                    ),
                    p: ({ children }) => (
                      <p className="text-[var(--foreground-secondary)] leading-relaxed mb-4">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-2 text-[var(--foreground-secondary)] mb-4">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => (
                      <li className="text-[var(--foreground-secondary)]">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-[var(--foreground)]">
                        {children}
                      </strong>
                    ),
                    hr: () => <hr className="border-[var(--border)] my-6" />,
                    em: ({ children }) => (
                      <em className="text-[var(--foreground-muted)] italic">{children}</em>
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
            <h3 className="text-lg font-bold mb-3 text-[var(--foreground)]">발송 채널 선택</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border border-[var(--border)] bg-[var(--background-secondary)] cursor-pointer hover:border-[var(--foreground)] transition-colors">
                <input
                  type="checkbox"
                  checked={selectedChannels.includes('email')}
                  onChange={() => handleChannelToggle('email')}
                  className="w-5 h-5 border-2 border-[var(--border)] bg-[var(--background)] accent-[var(--foreground)] focus:ring-0"
                />
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-[var(--foreground)]"
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
                  <span className="font-bold text-[var(--foreground)]">이메일</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border border-[var(--border)] bg-[var(--background-secondary)] cursor-pointer hover:border-[var(--foreground)] transition-colors">
                <input
                  type="checkbox"
                  checked={selectedChannels.includes('slack')}
                  onChange={() => handleChannelToggle('slack')}
                  className="w-5 h-5 border-2 border-[var(--border)] bg-[var(--background)] accent-[var(--foreground)] focus:ring-0"
                />
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-[var(--foreground)]"
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
                  <span className="font-bold text-[var(--foreground)]">슬랙</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t-2 border-[var(--foreground)]">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            취소
          </button>
          <button
            onClick={handleSend}
            disabled={isSending || selectedChannels.length === 0}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

