'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';

interface BriefingCardGeneratorProps {
  date: string;
  stockName: string;
  symbol: string;
  changePercent: number;
  criteria: string;
  headline: string;
  sector?: string;  // 종목 섹터
  keywords?: string[];  // 관련 키워드
  onImageGenerated?: (dataUrl: string) => void;
  onImageSaved?: (url: string) => void;  // 이미지 저장 완료 콜백
  autoGenerate?: boolean;
  autoSave?: boolean;  // 이미지 자동 저장 여부
}

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 1600;

// =============================================
// SECTOR THEMES - 섹터별 테마 정의
// =============================================
type SectorType = 'tech' | 'healthcare' | 'finance' | 'energy' | 'default';

interface SectorTheme {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  gradientStops: { color: string; stop: number }[];
  pattern: 'circuit' | 'dna' | 'chart' | 'wave' | 'stars';
}

const SECTOR_THEMES: Record<SectorType, SectorTheme> = {
  tech: {
    name: 'Technology',
    primaryColor: '#00d4ff',
    secondaryColor: '#7c3aed',
    accentColor: '#22d3ee',
    gradientStops: [
      { color: '#0a0f1a', stop: 0 },
      { color: '#0f172a', stop: 0.3 },
      { color: '#1e1b4b', stop: 0.7 },
      { color: '#0f172a', stop: 1 },
    ],
    pattern: 'circuit',
  },
  healthcare: {
    name: 'Healthcare',
    primaryColor: '#34d399',
    secondaryColor: '#14b8a6',
    accentColor: '#6ee7b7',
    gradientStops: [
      { color: '#0a0f1a', stop: 0 },
      { color: '#042f2e', stop: 0.3 },
      { color: '#134e4a', stop: 0.7 },
      { color: '#0f172a', stop: 1 },
    ],
    pattern: 'dna',
  },
  finance: {
    name: 'Finance',
    primaryColor: '#fbbf24',
    secondaryColor: '#f59e0b',
    accentColor: '#fcd34d',
    gradientStops: [
      { color: '#0a0f1a', stop: 0 },
      { color: '#1c1917', stop: 0.3 },
      { color: '#292524', stop: 0.7 },
      { color: '#0f172a', stop: 1 },
    ],
    pattern: 'chart',
  },
  energy: {
    name: 'Energy',
    primaryColor: '#f97316',
    secondaryColor: '#dc2626',
    accentColor: '#fb923c',
    gradientStops: [
      { color: '#0a0f1a', stop: 0 },
      { color: '#1c1917', stop: 0.3 },
      { color: '#431407', stop: 0.7 },
      { color: '#0f172a', stop: 1 },
    ],
    pattern: 'wave',
  },
  default: {
    name: 'Default',
    primaryColor: '#f59e0b',
    secondaryColor: '#fbbf24',
    accentColor: '#fcd34d',
    gradientStops: [
      { color: '#0a0f1a', stop: 0 },
      { color: '#0f172a', stop: 0.3 },
      { color: '#1e293b', stop: 0.7 },
      { color: '#0f172a', stop: 1 },
    ],
    pattern: 'stars',
  },
};

// =============================================
// KEYWORD ICONS - 키워드 기반 아이콘 정의
// =============================================
interface KeywordIcon {
  keywords: string[];
  icon: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => void;
  label: string;
}

const KEYWORD_ICONS: KeywordIcon[] = [
  {
    keywords: ['AI', '인공지능', 'GPT', '챗봇', '머신러닝', 'LLM'],
    label: 'AI',
    icon: (ctx, x, y, size, color) => {
      // AI Chip icon
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.fillStyle = color;

      // Main chip body
      roundRect(ctx, x - size/2, y - size/2, size, size, size/8);
      ctx.stroke();

      // Inner circuit pattern
      ctx.beginPath();
      ctx.arc(x, y, size/4, 0, Math.PI * 2);
      ctx.stroke();

      // Connection pins
      const pinLen = size/6;
      [-1, 1].forEach(dir => {
        ctx.beginPath();
        ctx.moveTo(x + dir * size/2, y - size/4);
        ctx.lineTo(x + dir * (size/2 + pinLen), y - size/4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + dir * size/2, y + size/4);
        ctx.lineTo(x + dir * (size/2 + pinLen), y + size/4);
        ctx.stroke();
      });
    },
  },
  {
    keywords: ['배터리', '전기차', 'EV', '2차전지', '리튬'],
    label: 'Battery',
    icon: (ctx, x, y, size, color) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2;

      // Battery body
      roundRect(ctx, x - size/2, y - size/3, size * 0.85, size * 0.66, size/10);
      ctx.stroke();

      // Battery cap
      ctx.fillRect(x + size/2 - size * 0.15, y - size/6, size * 0.15, size/3);

      // Charge level bars
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(x - size/2 + size/10 + i * (size/4), y - size/5, size/6, size * 0.4);
      }
      ctx.globalAlpha = 1;
    },
  },
  {
    keywords: ['실적', '어닝', '매출', '영업이익', '분기', '흑자', '적자'],
    label: 'Earnings',
    icon: (ctx, x, y, size, color) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2;

      // Chart bars
      const barW = size / 5;
      const heights = [0.4, 0.7, 0.5, 0.9];
      heights.forEach((h, i) => {
        const barH = size * h;
        const bx = x - size/2 + i * (barW + barW/2);
        ctx.fillRect(bx, y + size/2 - barH, barW, barH);
      });

      // Trend line
      ctx.beginPath();
      ctx.moveTo(x - size/2, y + size/4);
      ctx.lineTo(x - size/4, y);
      ctx.lineTo(x + size/8, y + size/6);
      ctx.lineTo(x + size/2, y - size/3);
      ctx.stroke();
    },
  },
  {
    keywords: ['반도체', '칩', '파운드리', 'HBM', 'GPU', 'CPU', '메모리'],
    label: 'Semiconductor',
    icon: (ctx, x, y, size, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;

      // Chip outline
      roundRect(ctx, x - size/2, y - size/2, size, size, 4);
      ctx.stroke();

      // Inner pattern
      ctx.beginPath();
      ctx.rect(x - size/4, y - size/4, size/2, size/2);
      ctx.stroke();

      // Pins on all sides
      const pinCount = 3;
      for (let i = 0; i < pinCount; i++) {
        const offset = -size/3 + (i * size/3);
        // Top & bottom
        ctx.beginPath();
        ctx.moveTo(x + offset, y - size/2);
        ctx.lineTo(x + offset, y - size/2 - size/8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + offset, y + size/2);
        ctx.lineTo(x + offset, y + size/2 + size/8);
        ctx.stroke();
      }
    },
  },
  {
    keywords: ['신약', '임상', 'FDA', '바이오', '치료제', '백신'],
    label: 'Pharma',
    icon: (ctx, x, y, size, color) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2;

      // DNA helix style
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const py = y - size/2 + (i * size/5);
        const px1 = x - size/4 + Math.sin(i * 0.8) * size/4;
        const px2 = x + size/4 - Math.sin(i * 0.8) * size/4;
        ctx.moveTo(px1, py);
        ctx.lineTo(px2, py);
      }
      ctx.stroke();

      // Helix curves
      ctx.beginPath();
      ctx.moveTo(x - size/4, y - size/2);
      ctx.bezierCurveTo(x - size/2, y - size/4, x + size/2, y, x - size/4, y + size/2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + size/4, y - size/2);
      ctx.bezierCurveTo(x + size/2, y - size/4, x - size/2, y, x + size/4, y + size/2);
      ctx.stroke();
    },
  },
  {
    keywords: ['인수', '합병', 'M&A', '인수합병', '스핀오프'],
    label: 'M&A',
    icon: (ctx, x, y, size, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;

      // Two circles merging
      ctx.beginPath();
      ctx.arc(x - size/4, y, size/3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + size/4, y, size/3, 0, Math.PI * 2);
      ctx.stroke();

      // Arrows pointing inward
      ctx.beginPath();
      ctx.moveTo(x - size/2, y - size/2);
      ctx.lineTo(x - size/6, y - size/6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + size/2, y - size/2);
      ctx.lineTo(x + size/6, y - size/6);
      ctx.stroke();
    },
  },
  {
    keywords: ['클라우드', 'SaaS', 'AWS', '데이터센터'],
    label: 'Cloud',
    icon: (ctx, x, y, size, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;

      // Cloud shape
      ctx.beginPath();
      ctx.arc(x - size/4, y, size/4, Math.PI * 0.5, Math.PI * 1.5);
      ctx.arc(x, y - size/4, size/3, Math.PI, Math.PI * 1.8);
      ctx.arc(x + size/4, y, size/4, Math.PI * 1.5, Math.PI * 0.5);
      ctx.lineTo(x - size/4, y + size/4);
      ctx.stroke();
    },
  },
  {
    keywords: ['원유', '천연가스', '정유', '에너지', '석유'],
    label: 'Oil',
    icon: (ctx, x, y, size, color) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2;

      // Oil drop
      ctx.beginPath();
      ctx.moveTo(x, y - size/2);
      ctx.bezierCurveTo(x - size/2, y, x - size/2, y + size/3, x, y + size/2);
      ctx.bezierCurveTo(x + size/2, y + size/3, x + size/2, y, x, y - size/2);
      ctx.stroke();

      // Inner highlight
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(x - size/6, y, size/6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    },
  },
];

// =============================================
// VISUAL ELEMENTS
// =============================================

// Star positions
const STARS = [
  { x: 0.08, y: 0.12, r: 1.5, o: 0.9 },
  { x: 0.15, y: 0.25, r: 1, o: 0.6 },
  { x: 0.22, y: 0.08, r: 2, o: 0.95 },
  { x: 0.35, y: 0.15, r: 1.2, o: 0.7 },
  { x: 0.42, y: 0.22, r: 0.8, o: 0.5 },
  { x: 0.55, y: 0.1, r: 1.8, o: 0.85 },
  { x: 0.68, y: 0.18, r: 1, o: 0.6 },
  { x: 0.75, y: 0.08, r: 1.5, o: 0.8 },
  { x: 0.82, y: 0.25, r: 0.9, o: 0.55 },
  { x: 0.12, y: 0.35, r: 1.2, o: 0.65 },
  { x: 0.28, y: 0.32, r: 0.8, o: 0.5 },
  { x: 0.45, y: 0.35, r: 1.5, o: 0.75 },
  { x: 0.62, y: 0.3, r: 1, o: 0.6 },
  { x: 0.78, y: 0.38, r: 1.3, o: 0.7 },
  { x: 0.92, y: 0.15, r: 1.8, o: 0.85 },
  { x: 0.95, y: 0.32, r: 1, o: 0.55 },
];

// City skyline buildings
const BUILDINGS = [
  { x: 0, w: 50, h: 90 },
  { x: 55, w: 45, h: 130 },
  { x: 105, w: 35, h: 100 },
  { x: 145, w: 60, h: 160 },
  { x: 210, w: 40, h: 120 },
  { x: 255, w: 50, h: 95 },
  { x: 310, w: 45, h: 140 },
  { x: 360, w: 35, h: 105 },
  { x: 400, w: 55, h: 135 },
  { x: 460, w: 40, h: 85 },
  { x: 505, w: 50, h: 125 },
  { x: 560, w: 58, h: 155 },
  { x: 623, w: 35, h: 100 },
  { x: 663, w: 45, h: 135 },
  { x: 713, w: 40, h: 95 },
  { x: 758, w: 55, h: 145 },
  { x: 818, w: 45, h: 115 },
  { x: 868, w: 35, h: 85 },
  { x: 908, w: 50, h: 130 },
  { x: 963, w: 42, h: 100 },
  { x: 1010, w: 48, h: 125 },
  { x: 1063, w: 55, h: 140 },
  { x: 1123, w: 40, h: 105 },
  { x: 1168, w: 35, h: 90 },
];

// Window lights for buildings
const WINDOWS = [
  { bIdx: 1, ox: 10, oy: 20 },
  { bIdx: 1, ox: 25, oy: 50 },
  { bIdx: 3, ox: 15, oy: 30 },
  { bIdx: 3, ox: 35, oy: 70 },
  { bIdx: 3, ox: 20, oy: 110 },
  { bIdx: 6, ox: 12, oy: 25 },
  { bIdx: 6, ox: 28, oy: 80 },
  { bIdx: 8, ox: 15, oy: 40 },
  { bIdx: 8, ox: 35, oy: 90 },
  { bIdx: 11, ox: 18, oy: 35 },
  { bIdx: 11, ox: 38, oy: 85 },
  { bIdx: 11, ox: 25, oy: 120 },
  { bIdx: 15, ox: 15, oy: 45 },
  { bIdx: 15, ox: 35, oy: 100 },
  { bIdx: 18, ox: 12, oy: 30 },
  { bIdx: 18, ox: 30, oy: 75 },
  { bIdx: 21, ox: 15, oy: 40 },
  { bIdx: 21, ox: 35, oy: 95 },
];

// =============================================
// HELPER FUNCTIONS
// =============================================

function getSectorType(sector?: string): SectorType {
  if (!sector) return 'default';
  const s = sector.toLowerCase();

  if (s.includes('tech') || s.includes('기술') || s.includes('it') || s.includes('소프트웨어') || s.includes('반도체')) {
    return 'tech';
  }
  if (s.includes('health') || s.includes('헬스') || s.includes('바이오') || s.includes('제약') || s.includes('의료')) {
    return 'healthcare';
  }
  if (s.includes('financ') || s.includes('금융') || s.includes('은행') || s.includes('보험') || s.includes('증권')) {
    return 'finance';
  }
  if (s.includes('energy') || s.includes('에너지') || s.includes('전력') || s.includes('석유') || s.includes('정유')) {
    return 'energy';
  }
  return 'default';
}

function getMoodColors(changePercent: number): { warm: string; cool: string; intensity: number } {
  const absChange = Math.abs(changePercent);
  const isExtreme = absChange >= 10;
  const intensity = Math.min(absChange / 15, 1); // 0~1 scale

  if (changePercent >= 0) {
    // Positive - warm tones
    return {
      warm: isExtreme ? '#fcd34d' : '#f59e0b',
      cool: isExtreme ? '#22c55e' : '#34d399',
      intensity: 0.3 + intensity * 0.5,
    };
  } else {
    // Negative - cool tones
    return {
      warm: isExtreme ? '#dc2626' : '#ef4444',
      cool: isExtreme ? '#7c3aed' : '#8b5cf6',
      intensity: 0.3 + intensity * 0.5,
    };
  }
}

function findMatchingKeywords(headline: string, keywords?: string[]): KeywordIcon[] {
  const allText = [headline, ...(keywords || [])].join(' ').toUpperCase();
  const matches: KeywordIcon[] = [];

  KEYWORD_ICONS.forEach(iconDef => {
    const hasMatch = iconDef.keywords.some(kw => allText.includes(kw.toUpperCase()));
    if (hasMatch && matches.length < 3) {
      matches.push(iconDef);
    }
  });

  return matches;
}

// =============================================
// PATTERN DRAWING FUNCTIONS
// =============================================

function drawCircuitPattern(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, intensity: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.globalAlpha = intensity * 0.15;

  // Horizontal circuit lines
  for (let y = 50; y < h - 100; y += 80) {
    ctx.beginPath();
    let x = 0;
    while (x < w) {
      const segLen = 30 + Math.random() * 60;
      ctx.moveTo(x, y);
      x += segLen;
      ctx.lineTo(x, y);

      // Random vertical branch
      if (Math.random() > 0.6) {
        const branchLen = 20 + Math.random() * 40;
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + branchLen);

        // Node circle
        ctx.moveTo(x + 4, y + branchLen);
        ctx.arc(x, y + branchLen, 4, 0, Math.PI * 2);
      }
      x += 20;
    }
    ctx.stroke();
  }

  // Neon glow dots at intersections
  ctx.fillStyle = color;
  for (let i = 0; i < 20; i++) {
    const dx = 100 + Math.random() * (w - 200);
    const dy = 80 + Math.random() * (h - 250);
    ctx.beginPath();
    ctx.arc(dx, dy, 3, 0, Math.PI * 2);
    ctx.fill();

    // Glow
    ctx.globalAlpha = intensity * 0.05;
    ctx.beginPath();
    ctx.arc(dx, dy, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function drawDNAPattern(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, intensity: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = intensity * 0.2;

  // Double helix on right side
  const startX = w * 0.75;
  const amplitude = 40;

  for (let y = 0; y < h; y += 5) {
    const phase = y * 0.03;
    const x1 = startX + Math.sin(phase) * amplitude;
    const x2 = startX + Math.sin(phase + Math.PI) * amplitude;

    // Helix strands
    ctx.beginPath();
    ctx.arc(x1, y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x2, y, 2, 0, Math.PI * 2);
    ctx.fill();

    // Connection bars
    if (y % 30 < 5) {
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    }
  }

  // Floating organic circles
  ctx.globalAlpha = intensity * 0.08;
  for (let i = 0; i < 8; i++) {
    const cx = 50 + Math.random() * (w - 100);
    const cy = 50 + Math.random() * (h - 150);
    const r = 20 + Math.random() * 40;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

function drawChartPattern(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, intensity: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.globalAlpha = intensity * 0.15;

  // Grid lines
  const gridSpacing = 60;
  for (let x = 0; x < w; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Candlestick chart silhouette on right
  ctx.globalAlpha = intensity * 0.25;
  ctx.lineWidth = 2;
  const candleData = [0.5, 0.6, 0.4, 0.7, 0.5, 0.8, 0.6, 0.9, 0.7, 0.85];
  const candleW = 25;
  const startX = w * 0.55;
  const chartH = 200;
  const baseY = h * 0.5;

  candleData.forEach((val, i) => {
    const cx = startX + i * (candleW + 15);
    const candleH = val * chartH;
    const isUp = i % 2 === 0;

    ctx.fillStyle = isUp ? '#22c55e' : '#ef4444';
    ctx.globalAlpha = intensity * 0.3;
    ctx.fillRect(cx, baseY - candleH, candleW, candleH);

    // Wick
    ctx.strokeStyle = isUp ? '#22c55e' : '#ef4444';
    ctx.beginPath();
    ctx.moveTo(cx + candleW/2, baseY - candleH - 20);
    ctx.lineTo(cx + candleW/2, baseY + 10);
    ctx.stroke();
  });

  ctx.globalAlpha = 1;
}

function drawWavePattern(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, intensity: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = intensity * 0.2;

  // Multiple sine waves
  for (let wave = 0; wave < 4; wave++) {
    ctx.beginPath();
    const amplitude = 30 + wave * 15;
    const frequency = 0.01 + wave * 0.003;
    const yOffset = h * 0.3 + wave * 50;

    for (let x = 0; x < w; x += 5) {
      const y = yOffset + Math.sin(x * frequency + wave) * amplitude;
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  // Energy pulse circles
  ctx.globalAlpha = intensity * 0.1;
  for (let i = 0; i < 5; i++) {
    const px = 100 + Math.random() * (w - 200);
    const py = 100 + Math.random() * (h - 250);
    for (let r = 10; r < 50; r += 15) {
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Lightning bolt accents
  ctx.globalAlpha = intensity * 0.25;
  ctx.lineWidth = 3;
  const boltX = w * 0.85;
  const boltY = h * 0.25;
  ctx.beginPath();
  ctx.moveTo(boltX, boltY);
  ctx.lineTo(boltX - 20, boltY + 40);
  ctx.lineTo(boltX + 10, boltY + 40);
  ctx.lineTo(boltX - 15, boltY + 90);
  ctx.stroke();

  ctx.globalAlpha = 1;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function drawStarsPattern(ctx: CanvasRenderingContext2D, w: number, h: number, _color: string, _intensity: number) {
  // Default stars pattern - already handled in main draw
  STARS.forEach(star => {
    const sx = star.x * w;
    const sy = star.y * h;

    // Star glow
    const starGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, star.r * 4);
    starGlow.addColorStop(0, `rgba(255, 255, 255, ${star.o})`);
    starGlow.addColorStop(0.5, `rgba(255, 255, 255, ${star.o * 0.3})`);
    starGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.beginPath();
    ctx.arc(sx, sy, star.r * 4, 0, Math.PI * 2);
    ctx.fillStyle = starGlow;
    ctx.fill();

    // Star core
    ctx.beginPath();
    ctx.arc(sx, sy, star.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${star.o})`;
    ctx.fill();
  });
}

// =============================================
// MAIN COMPONENT
// =============================================

export default function BriefingCardGenerator({
  date,
  stockName,
  symbol,
  changePercent,
  criteria,
  headline,
  sector,
  keywords,
  onImageGenerated,
  onImageSaved,
  autoGenerate = true,
  autoSave = false,
}: BriefingCardGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 이미지 저장 함수
  const saveImage = useCallback(async (dataUrl: string) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch('/api/briefing-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageDataUrl: dataUrl,
          date,
          symbol,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save image');
      }

      const result = await response.json();
      setSavedImageUrl(result.url);

      if (onImageSaved) {
        onImageSaved(result.url);
      }

      console.log(`Briefing image saved: ${result.url} (${(result.size / 1024).toFixed(1)} KB)`);
    } catch (error) {
      console.error('Error saving briefing image:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save image');
    } finally {
      setIsSaving(false);
    }
  }, [date, symbol, onImageSaved]);

  const drawCard = useCallback((ctx: CanvasRenderingContext2D) => {
    const w = CARD_WIDTH;
    const h = CARD_HEIGHT;

    // Get dynamic theme based on sector and change
    const sectorType = getSectorType(sector);
    const theme = SECTOR_THEMES[sectorType];
    const moodColors = getMoodColors(changePercent);
    const matchedKeywords = findMatchingKeywords(headline, keywords);

    // === BACKGROUND ===
    const bgGradient = ctx.createLinearGradient(0, 0, w, h);
    theme.gradientStops.forEach(stop => {
      bgGradient.addColorStop(stop.stop, stop.color);
    });
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, w, h);

    // Mood overlay based on change percent
    const moodGradient = ctx.createRadialGradient(w * 0.3, h * 0.3, 0, w * 0.5, h * 0.5, w * 0.8);
    moodGradient.addColorStop(0, `${moodColors.warm}15`);
    moodGradient.addColorStop(0.5, `${moodColors.cool}08`);
    moodGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = moodGradient;
    ctx.fillRect(0, 0, w, h);

    // Extreme change effect - additional dramatic glow
    if (Math.abs(changePercent) >= 10) {
      const extremeGlow = ctx.createRadialGradient(w * 0.2, h * 0.4, 0, w * 0.2, h * 0.4, w * 0.5);
      extremeGlow.addColorStop(0, `${moodColors.warm}20`);
      extremeGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = extremeGlow;
      ctx.fillRect(0, 0, w, h);
    }

    // Subtle noise texture overlay
    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 2000; i++) {
      const nx = Math.random() * w;
      const ny = Math.random() * h;
      ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
      ctx.fillRect(nx, ny, 1, 1);
    }
    ctx.globalAlpha = 1;

    // === SECTOR-SPECIFIC PATTERN ===
    const patternColor = theme.primaryColor;
    const patternIntensity = moodColors.intensity;

    switch (theme.pattern) {
      case 'circuit':
        drawCircuitPattern(ctx, w, h, patternColor, patternIntensity);
        break;
      case 'dna':
        drawDNAPattern(ctx, w, h, patternColor, patternIntensity);
        break;
      case 'chart':
        drawChartPattern(ctx, w, h, patternColor, patternIntensity);
        break;
      case 'wave':
        drawWavePattern(ctx, w, h, patternColor, patternIntensity);
        break;
      case 'stars':
      default:
        drawStarsPattern(ctx, w, h, patternColor, patternIntensity);
        break;
    }

    // === MOON (always present) - larger for vertical format ===
    const moonX = w * 0.82;
    const moonY = h * 0.12;
    const moonR = 80;

    // Moon color varies with mood
    const moonHue = changePercent >= 0 ? '#fef3c7' : '#e0e7ff';

    // Moon outer glow
    for (let i = 3; i >= 0; i--) {
      const glowR = moonR + (i + 1) * 25;
      const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR, moonX, moonY, glowR);
      moonGlow.addColorStop(0, `${moonHue}${Math.floor((0.15 - i * 0.03) * 255).toString(16).padStart(2, '0')}`);
      moonGlow.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(moonX, moonY, glowR, 0, Math.PI * 2);
      ctx.fillStyle = moonGlow;
      ctx.fill();
    }

    // Moon body gradient
    const moonBodyGradient = ctx.createRadialGradient(
      moonX - moonR * 0.3, moonY - moonR * 0.3, 0,
      moonX, moonY, moonR
    );
    if (changePercent >= 0) {
      moonBodyGradient.addColorStop(0, '#fefce8');
      moonBodyGradient.addColorStop(0.7, '#fef3c7');
      moonBodyGradient.addColorStop(1, '#fde68a');
    } else {
      moonBodyGradient.addColorStop(0, '#f0f4ff');
      moonBodyGradient.addColorStop(0.7, '#e0e7ff');
      moonBodyGradient.addColorStop(1, '#c7d2fe');
    }

    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fillStyle = moonBodyGradient;
    ctx.fill();

    // Moon craters
    ctx.globalAlpha = 0.08;
    ctx.beginPath();
    ctx.arc(moonX - 15, moonY + 10, 12, 0, Math.PI * 2);
    ctx.fillStyle = changePercent >= 0 ? '#d4a574' : '#6366f1';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moonX + 20, moonY - 5, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moonX + 5, moonY + 25, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // === CITY SKYLINE ===
    const skylineY = h - 10;

    // Building silhouettes
    ctx.fillStyle = '#1e293b';
    ctx.globalAlpha = 0.7;
    BUILDINGS.forEach(b => {
      ctx.fillRect(b.x, skylineY - b.h, b.w, b.h + 10);
    });
    ctx.globalAlpha = 1;

    // Window lights - color varies with mood
    ctx.fillStyle = changePercent >= 0 ? '#fbbf24' : '#818cf8';
    ctx.globalAlpha = 0.6;
    WINDOWS.forEach(win => {
      const b = BUILDINGS[win.bIdx];
      if (b) {
        ctx.fillRect(b.x + win.ox, skylineY - b.h + win.oy, 8, 8);
      }
    });
    ctx.globalAlpha = 1;

    // === CONTENT AREA - adjusted for vertical 1200x1600 format ===
    const contentX = 100;
    const contentY = 420;  // Start content lower to leave space for moon and patterns
    const maxContentWidth = w - contentX - 100;  // 여백 고려한 최대 너비

    // Title with dynamic gradient - larger for vertical format
    ctx.font = 'bold 64px "Pretendard", "Apple SD Gothic Neo", sans-serif';
    const titleGradient = ctx.createLinearGradient(contentX, contentY, contentX + 500, contentY);
    titleGradient.addColorStop(0, theme.primaryColor);
    titleGradient.addColorStop(0.5, theme.secondaryColor);
    titleGradient.addColorStop(1, theme.primaryColor);
    ctx.fillStyle = titleGradient;

    // Title shadow for glow effect
    ctx.shadowColor = `${theme.primaryColor}80`;
    ctx.shadowBlur = 25;
    ctx.fillText('당신이 잠든 사이', contentX, contentY);
    ctx.shadowBlur = 0;

    // Date - larger and more spaced
    const formattedDate = date.replace(/-/g, '.');
    ctx.font = '500 32px "Pretendard", "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(formattedDate, contentX, contentY + 70);

    // Divider line with theme gradient - wider
    const lineGradient = ctx.createLinearGradient(contentX, 0, contentX + 600, 0);
    lineGradient.addColorStop(0, theme.primaryColor);
    lineGradient.addColorStop(0.5, theme.secondaryColor);
    lineGradient.addColorStop(1, 'transparent');
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(contentX, contentY + 110);
    ctx.lineTo(contentX + 600, contentY + 110);
    ctx.stroke();

    // "오늘의 화제 종목" label - larger
    ctx.font = '500 28px "Pretendard", "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('오늘의 화제 종목', contentX, contentY + 180);

    // === 종목명 처리 (긴 이름 자동 축소/줄바꿈) ===
    let stockNameFontSize = 96;
    const minFontSize = 52;
    const displayStockName = stockName;
    let stockNameLines: string[] = [];
    const stockNameY = contentY + 280;

    // 종목명이 최대 너비를 초과하면 폰트 축소 또는 줄바꿈
    ctx.font = `bold ${stockNameFontSize}px "Pretendard", "Apple SD Gothic Neo", sans-serif`;
    let stockNameWidth = ctx.measureText(stockName).width;

    // 폰트 크기를 줄여도 안 맞으면 줄바꿈
    while (stockNameWidth > maxContentWidth && stockNameFontSize > minFontSize) {
      stockNameFontSize -= 4;
      ctx.font = `bold ${stockNameFontSize}px "Pretendard", "Apple SD Gothic Neo", sans-serif`;
      stockNameWidth = ctx.measureText(stockName).width;
    }

    // 여전히 너무 길면 줄바꿈 처리
    if (stockNameWidth > maxContentWidth) {
      // 줄바꿈 지점 찾기 (공백, 콤마, 하이픈 기준)
      const breakChars = [' ', ',', '-', '.'];
      let breakIndex = -1;

      // 중간 지점 근처에서 break 문자 찾기
      const midPoint = Math.floor(stockName.length / 2);
      for (let offset = 0; offset < midPoint; offset++) {
        if (breakChars.includes(stockName[midPoint + offset])) {
          breakIndex = midPoint + offset;
          break;
        }
        if (breakChars.includes(stockName[midPoint - offset])) {
          breakIndex = midPoint - offset;
          break;
        }
      }

      if (breakIndex > 0) {
        stockNameLines = [
          stockName.slice(0, breakIndex + 1).trim(),
          stockName.slice(breakIndex + 1).trim()
        ];
      } else {
        // break 문자 없으면 그냥 중간에서 자르기
        stockNameLines = [
          stockName.slice(0, midPoint),
          stockName.slice(midPoint)
        ];
      }

      // 두 줄일 때 폰트 크기 조정
      stockNameFontSize = Math.min(stockNameFontSize, 72);
      ctx.font = `bold ${stockNameFontSize}px "Pretendard", "Apple SD Gothic Neo", sans-serif`;
    } else {
      stockNameLines = [displayStockName];
    }

    // 종목명 렌더링
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${stockNameFontSize}px "Pretendard", "Apple SD Gothic Neo", sans-serif`;

    stockNameLines.forEach((line, idx) => {
      ctx.fillText(line, contentX, stockNameY + idx * (stockNameFontSize + 10));
    });

    // 마지막 줄 이후 Y 위치 계산
    const afterStockNameY = stockNameY + (stockNameLines.length - 1) * (stockNameFontSize + 10);

    // === Symbol - 종목명 아래 별도 줄에 표시 ===
    const symbolFontSize = Math.max(36, stockNameFontSize * 0.45);
    ctx.font = `600 ${symbolFontSize}px "Pretendard", "Apple SD Gothic Neo", sans-serif`;
    ctx.fillStyle = theme.primaryColor;
    const symbolY = afterStockNameY + symbolFontSize + 20;
    ctx.fillText(symbol, contentX, symbolY);

    // === SECTOR BADGE (if sector provided) - 심볼 옆에 배치 ===
    if (sector) {
      const symbolWidth = ctx.measureText(symbol).width;
      ctx.font = '500 24px "Pretendard", "Apple SD Gothic Neo", sans-serif';
      const sectorBadgeWidth = ctx.measureText(sector).width + 32;

      ctx.fillStyle = `${theme.primaryColor}30`;
      roundRect(ctx, contentX + symbolWidth + 30, symbolY - 30, sectorBadgeWidth, 42, 10);
      ctx.fill();
      ctx.fillStyle = theme.primaryColor;
      ctx.fillText(sector, contentX + symbolWidth + 46, symbolY - 2);
    }

    // === BADGES - 심볼/섹터 아래 배치 ===
    const badgeY = symbolY + 60;

    // Change percent badge (with safety check for undefined/NaN) - larger for vertical
    const safeChangePercent = typeof changePercent === 'number' && !isNaN(changePercent) ? changePercent : 0;
    const isPositive = safeChangePercent >= 0;
    const isExtreme = Math.abs(safeChangePercent) >= 10;
    const changeColor = isPositive ? '#22c55e' : '#ef4444';
    const changeBgColor = isPositive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
    const changeText = `${isPositive ? '+' : ''}${safeChangePercent.toFixed(1)}%`;

    // Badge background - larger
    ctx.fillStyle = changeBgColor;
    roundRect(ctx, contentX, badgeY, 200, 70, 16);
    ctx.fill();

    // Extreme change - extra glow effect
    if (isExtreme) {
      ctx.shadowColor = changeColor;
      ctx.shadowBlur = 20;
      roundRect(ctx, contentX, badgeY, 200, 70, 16);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Badge text - larger
    ctx.font = 'bold 40px "Pretendard", "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = changeColor;
    ctx.shadowColor = changeColor;
    ctx.shadowBlur = 12;
    ctx.textAlign = 'center';
    ctx.fillText(changeText, contentX + 100, badgeY + 48);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';

    // Criteria badge - larger
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    roundRect(ctx, contentX + 230, badgeY, 240, 70, 16);
    ctx.fill();

    ctx.font = 'bold 30px "Pretendard", "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.fillText(criteria, contentX + 350, badgeY + 46);
    ctx.textAlign = 'left';

    // === KEYWORD ICONS - larger and repositioned ===
    if (matchedKeywords.length > 0) {
      const iconStartX = contentX + 510;
      const iconY = badgeY + 35;
      const iconSize = 48;
      const iconSpacing = 70;

      matchedKeywords.forEach((kwIcon, idx) => {
        const ix = iconStartX + idx * iconSpacing;

        // Icon background circle
        ctx.fillStyle = `${theme.primaryColor}20`;
        ctx.beginPath();
        ctx.arc(ix, iconY, iconSize/2 + 6, 0, Math.PI * 2);
        ctx.fill();

        // Draw the icon
        kwIcon.icon(ctx, ix, iconY, iconSize, theme.primaryColor);
      });
    }

    // === HEADLINE - 동적 위치 계산 ===
    const headlineLabelY = badgeY + 120;

    ctx.font = '500 26px "Pretendard", "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('핵심 뉴스', contentX, headlineLabelY);

    ctx.font = '500 38px "Pretendard", "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = '#e2e8f0';

    // Truncate headline if too long - allow more width for vertical format
    const maxHeadlineWidth = w - contentX - 120;
    let displayHeadline = `"${headline}"`;
    while (ctx.measureText(displayHeadline).width > maxHeadlineWidth && displayHeadline.length > 10) {
      displayHeadline = displayHeadline.slice(0, -4) + '..."';
    }
    ctx.fillText(displayHeadline, contentX, headlineLabelY + 60);

    // === WATERMARK ===
    ctx.font = '400 16px "Pretendard", "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'right';
    ctx.fillText('While You Were Sleeping', w - 40, h - 30);
    ctx.textAlign = 'left';

    // === DECORATIVE CORNER ACCENT ===
    ctx.strokeStyle = `${theme.primaryColor}50`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 60);
    ctx.lineTo(30, 30);
    ctx.lineTo(60, 30);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w - 30, h - 60);
    ctx.lineTo(w - 30, h - 30);
    ctx.lineTo(w - 60, h - 30);
    ctx.stroke();

  }, [date, stockName, symbol, changePercent, criteria, headline, sector, keywords]);

  const generateImage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsGenerating(false);
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    // Draw the card
    drawCard(ctx);

    // Generate data URL
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    setImageDataUrl(dataUrl);

    if (onImageGenerated) {
      onImageGenerated(dataUrl);
    }

    setIsGenerating(false);

    // 자동 저장
    if (autoSave) {
      await saveImage(dataUrl);
    }
  }, [drawCard, onImageGenerated, autoSave, saveImage]);

  // Auto-generate on mount or when props change
  useEffect(() => {
    if (autoGenerate) {
      // Use requestAnimationFrame to avoid synchronous setState in effect
      const frameId = requestAnimationFrame(() => {
        generateImage();
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [autoGenerate, generateImage]);

  const handleDownload = () => {
    if (!imageDataUrl) return;

    const link = document.createElement('a');
    link.download = `briefing-${date}-${symbol}.png`;
    link.href = imageDataUrl;
    link.click();
  };

  return (
    <div className="briefing-card-generator">
      {/* Hidden canvas for rendering */}
      <canvas
        ref={canvasRef}
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        className="hidden"
      />

      {/* Preview */}
      <div className="relative">
        {imageDataUrl ? (
          <div className="space-y-4">
            <div
              className="relative overflow-hidden rounded-xl shadow-2xl mx-auto"
              style={{
                aspectRatio: '1200/1600',
                maxWidth: '450px',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageDataUrl}
                alt={`${stockName} 브리핑 카드`}
                className="w-full h-full object-cover"
              />

              {/* Shine effect overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, transparent 100%)',
                }}
              />
            </div>

            {/* Save status indicator */}
            {(savedImageUrl || isSaving || saveError) && (
              <div className="text-center text-sm">
                {isSaving && (
                  <span className="text-amber-400 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    이미지 저장 중...
                  </span>
                )}
                {savedImageUrl && !isSaving && (
                  <span className="text-emerald-400 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M5 13l4 4L19 7" />
                    </svg>
                    저장됨: {savedImageUrl}
                  </span>
                )}
                {saveError && (
                  <span className="text-red-400 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    저장 실패: {saveError}
                  </span>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={handleDownload}
                className="group relative px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500
                         text-slate-900 font-semibold rounded-lg overflow-hidden
                         transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25
                         hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  다운로드
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-400
                              opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>

              <button
                onClick={() => saveImage(imageDataUrl!)}
                disabled={isSaving || !imageDataUrl}
                className="px-6 py-3 bg-emerald-600/80 text-white font-medium rounded-lg
                         transition-all duration-300 hover:bg-emerald-500
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-2">
                  <svg className={`w-5 h-5 ${isSaving ? 'animate-spin' : ''}`}
                       fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isSaving ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    )}
                  </svg>
                  {isSaving ? '저장 중...' : '서버에 저장'}
                </span>
              </button>

              <button
                onClick={generateImage}
                disabled={isGenerating}
                className="px-6 py-3 bg-slate-700/50 text-slate-200 font-medium rounded-lg
                         border border-slate-600/50 transition-all duration-300
                         hover:bg-slate-600/50 hover:border-slate-500/50
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-2">
                  <svg className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`}
                       fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isGenerating ? '생성 중...' : '다시 생성'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center justify-center bg-slate-800/50 rounded-xl border border-slate-700/50 mx-auto"
            style={{ aspectRatio: '1200/1600', maxWidth: '450px' }}
          >
            <div className="text-center text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>이미지 생성 중...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to draw rounded rectangles
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
