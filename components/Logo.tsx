'use client';

import React from 'react';

interface LogoProps {
  variant?: 'symbol' | 'text' | 'combined' | 'icon';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
}

const sizeMap = {
  symbol: {
    xs: 32,
    sm: 40,
    md: 56,
    lg: 72,
    xl: 96,
  },
  icon: {
    xs: 28,
    sm: 36,
    md: 44,
    lg: 56,
    xl: 72,
  },
  combined: {
    xs: 140,
    sm: 180,
    md: 240,
    lg: 320,
    xl: 400,
  },
  text: {
    xs: 80,
    sm: 120,
    md: 160,
    lg: 220,
    xl: 280,
  },
};

// Dawn Breaking Theme Colors
const colors = {
  gradientStart: '#0f172a',
  gradientEnd: '#1e3a5f',
  accent: '#ff7e5f',
  accentLight: '#feb47b',
  gold: '#f59e0b',
  white: '#ffffff',
  star: '#fbbf24',
};

// Symbol Logo - Moon with stars and glow
const SymbolLogo: React.FC<{ size: number; className?: string }> = ({ size, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="당신이 잠든 사이 Logo"
  >
    <defs>
      {/* Background gradient */}
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={colors.gradientStart} />
        <stop offset="100%" stopColor={colors.gradientEnd} />
      </linearGradient>
      {/* Moon glow */}
      <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={colors.accentLight} stopOpacity="0.6" />
        <stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
      </radialGradient>
      {/* Star glow filter */}
      <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Background */}
    <rect width="64" height="64" rx="12" fill="url(#bgGradient)" />

    {/* Moon glow effect */}
    <circle cx="24" cy="24" r="18" fill="url(#moonGlow)" />

    {/* Crescent Moon */}
    <circle cx="22" cy="22" r="14" fill={colors.accentLight} />
    <circle cx="30" cy="18" r="11" fill="url(#bgGradient)" />

    {/* Stars */}
    <g filter="url(#starGlow)">
      <circle cx="48" cy="16" r="2" fill={colors.star} />
      <circle cx="52" cy="28" r="1.5" fill={colors.star} />
      <circle cx="44" cy="38" r="1" fill={colors.star} />
      <circle cx="38" cy="12" r="1" fill={colors.white} opacity="0.8" />
      <circle cx="56" cy="44" r="1.5" fill={colors.white} opacity="0.6" />
    </g>

    {/* City silhouette */}
    <g fill={colors.gradientStart} opacity="0.7">
      <rect x="8" y="50" width="6" height="10" />
      <rect x="16" y="46" width="8" height="14" />
      <rect x="26" y="52" width="5" height="8" />
      <rect x="33" y="48" width="7" height="12" />
      <rect x="42" y="54" width="4" height="6" />
      <rect x="48" y="50" width="6" height="10" />
    </g>

    {/* Horizon glow */}
    <rect x="0" y="56" width="64" height="8" rx="0" fill="url(#moonGlow)" opacity="0.3" />
  </svg>
);

// Icon Logo - Simplified for header/navbar
const IconLogo: React.FC<{ size: number; className?: string }> = ({ size, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="당신이 잠든 사이"
  >
    <defs>
      <linearGradient id="iconBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={colors.gradientStart} />
        <stop offset="100%" stopColor={colors.gradientEnd} />
      </linearGradient>
      <radialGradient id="iconMoonGlow" cx="40%" cy="40%" r="50%">
        <stop offset="0%" stopColor={colors.accentLight} stopOpacity="0.5" />
        <stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Background */}
    <rect width="48" height="48" rx="10" fill="url(#iconBgGrad)" />

    {/* Moon glow */}
    <circle cx="18" cy="18" r="14" fill="url(#iconMoonGlow)" />

    {/* Crescent Moon */}
    <circle cx="17" cy="17" r="11" fill={colors.accentLight} />
    <circle cx="24" cy="13" r="9" fill="url(#iconBgGrad)" />

    {/* Stars */}
    <circle cx="36" cy="14" r="1.5" fill={colors.star} />
    <circle cx="40" cy="24" r="1" fill={colors.star} />
    <circle cx="32" cy="10" r="1" fill={colors.white} opacity="0.7" />

    {/* Subtle city */}
    <g fill={colors.gradientStart} opacity="0.5">
      <rect x="6" y="38" width="5" height="8" />
      <rect x="13" y="35" width="6" height="11" />
      <rect x="21" y="40" width="4" height="6" />
      <rect x="27" y="36" width="5" height="10" />
      <rect x="34" y="39" width="4" height="7" />
      <rect x="40" y="37" width="5" height="9" />
    </g>
  </svg>
);

// Text Logo - 당신이 잠든 사이 with styling
const TextLogo: React.FC<{ width: number; className?: string; showSubtitle?: boolean }> = ({
  width,
  className,
  showSubtitle = false,
}) => {
  const fontSize = width * 0.16;
  const subtitleSize = width * 0.07;

  return (
    <div className={`flex flex-col ${className || ''}`}>
      {/* Main title */}
      <span
        className="font-bold bg-gradient-to-r from-[#ff7e5f] to-[#feb47b] bg-clip-text text-transparent leading-tight"
        style={{
          fontSize: `${fontSize}px`,
        }}
      >
        당신이 잠든 사이
      </span>
      {/* Subtitle */}
      {showSubtitle && (
        <span
          className="opacity-50 font-medium mt-0.5"
          style={{
            fontSize: `${subtitleSize}px`,
          }}
        >
          While You Were Sleeping
        </span>
      )}
    </div>
  );
};

// Combined Logo - Icon + Text
const CombinedLogo: React.FC<{
  width: number;
  className?: string;
  showSubtitle?: boolean;
}> = ({ width, className, showSubtitle = false }) => {
  const iconSize = width * 0.2;
  const textSize = width * 0.11;
  const subtitleSize = width * 0.045;

  return (
    <div className={`flex items-center gap-3 ${className || ''}`}>
      <IconLogo size={iconSize} />
      <div className="flex flex-col">
        {/* Main title */}
        <span
          className="font-bold bg-gradient-to-r from-[#ff7e5f] to-[#feb47b] bg-clip-text text-transparent leading-tight"
          style={{
            fontSize: `${textSize}px`,
          }}
        >
          당신이 잠든 사이
        </span>
        {/* Subtitle */}
        {showSubtitle && (
          <span
            className="opacity-50 font-medium mt-0.5"
            style={{
              fontSize: `${subtitleSize}px`,
            }}
          >
            Market Briefing
          </span>
        )}
      </div>
    </div>
  );
};

// Main Logo Component
export default function Logo({
  variant = 'combined',
  size = 'md',
  className = '',
  showSubtitle = false,
}: LogoProps) {
  const sizeValue = sizeMap[variant][size];

  switch (variant) {
    case 'symbol':
      return <SymbolLogo size={sizeValue} className={className} />;
    case 'icon':
      return <IconLogo size={sizeValue} className={className} />;
    case 'text':
      return <TextLogo width={sizeValue} className={className} showSubtitle={showSubtitle} />;
    case 'combined':
    default:
      return <CombinedLogo width={sizeValue} className={className} showSubtitle={showSubtitle} />;
  }
}

// Export individual components
export { SymbolLogo, IconLogo, TextLogo, CombinedLogo };
