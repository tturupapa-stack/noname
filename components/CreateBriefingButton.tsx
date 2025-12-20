'use client';

import { useState } from 'react';

export default function CreateBriefingButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateBriefing = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert('브리핑 생성이 시작되었습니다. 잠시 후 완료됩니다.');
    }, 1000);
  };

  return (
    <button
      onClick={handleCreateBriefing}
      disabled={isLoading}
      className="group relative flex items-center gap-2 px-5 py-2.5 bg-[var(--foreground)] text-[var(--background)] font-bold text-xs uppercase tracking-wider transition-all hover:bg-transparent hover:text-[var(--foreground)] border-2 border-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <span className="w-4 h-4 border-2 border-[var(--background)] border-t-transparent rounded-full animate-spin group-hover:border-[var(--foreground)] group-hover:border-t-transparent" />
          <span className="hidden sm:inline">Creating...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">New Briefing</span>
        </>
      )}
    </button>
  );
}
