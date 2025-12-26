'use client';

import { useState, useEffect, useRef } from 'react';
import { Briefing } from '@/types';
import {
  generateBriefingImage,
  generateShareText,
  copyToClipboard,
  downloadImage,
  isNativeShareSupported,
  nativeShare,
} from '@/utils/shareUtils';
import { saveShareHistory } from '@/utils/shareStorage';
import { useToast } from './Toast';

interface ShareModalProps {
  briefing: Briefing;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({
  briefing,
  isOpen,
  onClose,
}: ShareModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const { showToast, ToastContainer } = useToast();

  // 이미지 미리 생성
  useEffect(() => {
    if (isOpen && !previewImage && !isGenerating) {
      generatePreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Intentionally only trigger on isOpen change, not on every previewImage/isGenerating update

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // 외부 클릭으로 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const generatePreview = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const imageUrl = await generateBriefingImage(briefing, {
        width: 1080,
        height: 1080,
        quality: 0.9,
      });
      setPreviewImage(imageUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to generate image:', message);
      setError('이미지 생성에 실패했습니다. 텍스트 공유를 이용해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async (channel: string) => {
    const shareText = generateShareText(briefing);
    const shareUrl = `${window.location.origin}/briefing/${briefing.briefingId}`;

    try {
      switch (channel) {
        case 'kakao':
          // 카카오톡 공유 (Web Share API 또는 링크 복사)
          if (isNativeShareSupported()) {
            await nativeShare(briefing.textSummary.title, shareText, shareUrl);
          } else {
            await copyToClipboard(`${shareText}\n${shareUrl}`);
            showToast('링크가 클립보드에 복사되었습니다.', 'success');
          }
          break;

        case 'twitter':
          // 트위터 공유
          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            shareText
          )}&url=${encodeURIComponent(shareUrl)}`;
          window.open(twitterUrl, '_blank', 'width=550,height=420');
          break;

        case 'facebook':
          // 페이스북 공유
          const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            shareUrl
          )}`;
          window.open(facebookUrl, '_blank', 'width=550,height=420');
          break;

        case 'link':
          // 링크 복사
          await copyToClipboard(shareUrl);
          showToast('링크가 클립보드에 복사되었습니다.', 'success');
          break;

        case 'text':
          // 텍스트 복사
          await copyToClipboard(shareText);
          showToast('텍스트가 클립보드에 복사되었습니다.', 'success');
          break;

        case 'image':
          // 이미지 다운로드
          if (previewImage) {
            const date = new Date(briefing.date);
            const filename = `브리핑_${briefing.symbol}_${date.toISOString().split('T')[0]}.png`;
            downloadImage(previewImage, filename);
            showToast('이미지가 다운로드되었습니다.', 'success');
          } else {
            showToast('이미지를 생성하는 중입니다. 잠시 후 다시 시도해주세요.', 'info');
          }
          break;

        case 'native':
          // 네이티브 공유
          if (previewImage) {
            // 이미지와 함께 공유하려면 Blob 변환이 필요
            const blob = await (await fetch(previewImage)).blob();
            const file = new File([blob], 'briefing.png', { type: 'image/png' });
            
            if (navigator.share && navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: briefing.textSummary.title,
                text: shareText,
                files: [file],
              });
            } else {
              await nativeShare(briefing.textSummary.title, shareText, shareUrl);
            }
          } else {
            await nativeShare(briefing.textSummary.title, shareText, shareUrl);
          }
          break;

        default:
          break;
      }

      // 공유 히스토리 저장
      saveShareHistory(briefing.briefingId, channel);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error('Failed to share:', error.message);
      if (error.name !== 'AbortError') {
        showToast('공유에 실패했습니다. 다시 시도해주세요.', 'error');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 dark:bg-black/80 backdrop-blur-sm modal-backdrop"
      style={{ zIndex: 'var(--z-modal-backdrop)' }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] bg-[var(--background)] border-2 border-[var(--foreground)] shadow-2xl overflow-hidden flex flex-col modal-content"
        style={{ zIndex: 'var(--z-modal)' }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b-2 border-[var(--foreground)]">
          <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)]">브리핑 공유하기</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors text-[var(--foreground)]"
            aria-label="닫기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 미리보기 */}
        <div className="flex-1 overflow-y-auto p-6">
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin h-12 w-12 border-2 border-[var(--foreground)] border-t-transparent mb-4"></div>
              <p className="text-[var(--foreground-muted)]">이미지 생성 중...</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-[var(--danger-light)] border-2 border-[var(--danger)]">
              <p className="text-[var(--danger)] text-sm">{error}</p>
            </div>
          )}

          {previewImage && !isGenerating && (
            <div className="mb-6">
              <div className="relative border-2 border-[var(--border)] overflow-hidden bg-[var(--background-secondary)]">
                <img
                  src={previewImage}
                  alt="브리핑 미리보기"
                  className="w-full h-auto"
                />
              </div>
              <button
                onClick={generatePreview}
                className="btn btn-secondary mt-4 w-full"
              >
                이미지 다시 생성
              </button>
            </div>
          )}

          {/* 공유 옵션 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* 카카오톡 */}
            <button
              onClick={() => handleShare('kakao')}
              className="flex flex-col items-center gap-2 p-4 border border-[var(--border)] bg-[var(--background)] hover:border-[var(--foreground)] transition-colors"
            >
              <div className="w-12 h-12 bg-[var(--foreground)] flex items-center justify-center text-[var(--background)] text-2xl">
                K
              </div>
              <span className="text-sm font-bold text-[var(--foreground)]">카카오톡</span>
            </button>

            {/* 트위터 */}
            <button
              onClick={() => handleShare('twitter')}
              className="flex flex-col items-center gap-2 p-4 border border-[var(--border)] bg-[var(--background)] hover:border-[var(--foreground)] transition-colors"
            >
              <div className="w-12 h-12 bg-[var(--foreground)] flex items-center justify-center text-[var(--background)] text-xl font-black">
                X
              </div>
              <span className="text-sm font-bold text-[var(--foreground)]">트위터</span>
            </button>

            {/* 페이스북 */}
            <button
              onClick={() => handleShare('facebook')}
              className="flex flex-col items-center gap-2 p-4 border border-[var(--border)] bg-[var(--background)] hover:border-[var(--foreground)] transition-colors"
            >
              <div className="w-12 h-12 bg-[var(--foreground)] flex items-center justify-center text-[var(--background)] text-xl font-black">
                f
              </div>
              <span className="text-sm font-bold text-[var(--foreground)]">페이스북</span>
            </button>

            {/* 링크 복사 */}
            <button
              onClick={() => handleShare('link')}
              className="flex flex-col items-center gap-2 p-4 border border-[var(--border)] bg-[var(--background)] hover:border-[var(--foreground)] transition-colors"
            >
              <div className="w-12 h-12 bg-[var(--background-secondary)] border border-[var(--border)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-[var(--foreground)]">링크 복사</span>
            </button>

            {/* 텍스트 복사 */}
            <button
              onClick={() => handleShare('text')}
              className="flex flex-col items-center gap-2 p-4 border border-[var(--border)] bg-[var(--background)] hover:border-[var(--foreground)] transition-colors"
            >
              <div className="w-12 h-12 bg-[var(--background-secondary)] border border-[var(--border)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-[var(--foreground)]">텍스트 복사</span>
            </button>

            {/* 이미지 다운로드 */}
            <button
              onClick={() => handleShare('image')}
              disabled={!previewImage || isGenerating}
              className="flex flex-col items-center gap-2 p-4 border border-[var(--border)] bg-[var(--background)] hover:border-[var(--foreground)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 bg-[var(--background-secondary)] border border-[var(--border)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <span className="text-sm font-bold text-[var(--foreground)]">이미지 저장</span>
            </button>

            {/* 네이티브 공유 (모바일) */}
            {isNativeShareSupported() && (
              <button
                onClick={() => handleShare('native')}
                className="flex flex-col items-center gap-2 p-4 border border-[var(--border)] bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-colors col-span-2 sm:col-span-1"
              >
                <div className="w-12 h-12 bg-[var(--background)] flex items-center justify-center">
                  <svg className="w-6 h-6 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <span className="text-sm font-bold">공유하기</span>
              </button>
            )}
          </div>
        </div>

        <ToastContainer />
      </div>
    </div>
  );
}

