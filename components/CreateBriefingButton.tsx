'use client';

import { useState } from 'react';

export default function CreateBriefingButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateBriefing = async () => {
    setIsLoading(true);
    // 실제로는 API 호출을 하겠지만, 여기서는 시뮬레이션
    setTimeout(() => {
      setIsLoading(false);
      alert('브리핑 생성이 시작되었습니다. 잠시 후 완료됩니다.');
    }, 1000);
  };

  return (
    <button
      onClick={handleCreateBriefing}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-[var(--primary-500)] text-white text-sm font-semibold hover:bg-[var(--primary-600)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin h-4 w-4"
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
          <span className="hidden sm:inline">생성 중...</span>
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="hidden sm:inline">브리핑 생성</span>
        </>
      )}
    </button>
  );
}
