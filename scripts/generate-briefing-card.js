const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// 브리핑 카드 데이터
const cardData = {
  title: '당신이 잠든 사이',
  date: '2025.12.05',
  stock: 'TESLA',
  symbol: 'TSLA',
  changePercent: '+8.7%',
  criteria: '거래량 1위',
  headline: '사이버트럭 판매량 급증'
};

// 이미지 크기
const width = 1200;
const height = 630;

// SVG 생성
function generateSVG(data) {
  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- 배경 그라데이션 -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
    </linearGradient>

    <!-- 액센트 그라데이션 -->
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#f59e0b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#fbbf24;stop-opacity:1" />
    </linearGradient>

    <!-- 상승 그라데이션 -->
    <linearGradient id="upGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#22c55e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4ade80;stop-opacity:1" />
    </linearGradient>

    <!-- 글로우 효과 -->
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- 달 글로우 -->
    <filter id="moonGlow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="20" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- 배경 -->
  <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>

  <!-- 별들 -->
  <circle cx="100" cy="80" r="1.5" fill="#fff" opacity="0.8"/>
  <circle cx="200" cy="120" r="1" fill="#fff" opacity="0.6"/>
  <circle cx="350" cy="60" r="2" fill="#fff" opacity="0.9"/>
  <circle cx="500" cy="100" r="1" fill="#fff" opacity="0.5"/>
  <circle cx="700" cy="80" r="1.5" fill="#fff" opacity="0.7"/>
  <circle cx="850" cy="150" r="1" fill="#fff" opacity="0.6"/>
  <circle cx="950" cy="90" r="2" fill="#fff" opacity="0.8"/>
  <circle cx="1050" cy="120" r="1" fill="#fff" opacity="0.5"/>
  <circle cx="1100" cy="180" r="1.5" fill="#fff" opacity="0.7"/>
  <circle cx="150" cy="200" r="1" fill="#fff" opacity="0.4"/>
  <circle cx="300" cy="180" r="1.5" fill="#fff" opacity="0.6"/>
  <circle cx="450" cy="220" r="1" fill="#fff" opacity="0.5"/>
  <circle cx="600" cy="170" r="2" fill="#fff" opacity="0.7"/>
  <circle cx="750" cy="210" r="1" fill="#fff" opacity="0.4"/>
  <circle cx="900" cy="250" r="1.5" fill="#fff" opacity="0.6"/>
  <circle cx="1000" cy="200" r="1" fill="#fff" opacity="0.5"/>

  <!-- 달 (오른쪽 상단) -->
  <circle cx="1050" cy="120" r="60" fill="#fef3c7" filter="url(#moonGlow)" opacity="0.3"/>
  <circle cx="1050" cy="120" r="45" fill="#fef3c7" opacity="0.5"/>
  <circle cx="1050" cy="120" r="35" fill="#fefce8" opacity="0.8"/>

  <!-- 도시 실루엣 -->
  <g fill="#1e293b" opacity="0.6">
    <!-- 빌딩들 -->
    <rect x="0" y="520" width="60" height="110"/>
    <rect x="70" y="480" width="50" height="150"/>
    <rect x="130" y="500" width="40" height="130"/>
    <rect x="180" y="450" width="70" height="180"/>
    <rect x="260" y="490" width="45" height="140"/>
    <rect x="315" y="520" width="55" height="110"/>
    <rect x="380" y="470" width="50" height="160"/>
    <rect x="440" y="510" width="40" height="120"/>
    <rect x="490" y="480" width="60" height="150"/>
    <rect x="560" y="530" width="45" height="100"/>
    <rect x="615" y="490" width="55" height="140"/>
    <rect x="680" y="460" width="65" height="170"/>
    <rect x="755" y="510" width="40" height="120"/>
    <rect x="805" y="480" width="50" height="150"/>
    <rect x="865" y="520" width="45" height="110"/>
    <rect x="920" y="470" width="60" height="160"/>
    <rect x="990" y="500" width="50" height="130"/>
    <rect x="1050" y="530" width="40" height="100"/>
    <rect x="1100" y="490" width="55" height="140"/>
    <rect x="1165" y="510" width="35" height="120"/>
  </g>

  <!-- 창문 불빛 -->
  <g fill="#fbbf24" opacity="0.6">
    <rect x="85" y="495" width="8" height="8"/>
    <rect x="100" y="515" width="8" height="8"/>
    <rect x="195" y="470" width="10" height="10"/>
    <rect x="220" y="510" width="10" height="10"/>
    <rect x="400" y="490" width="8" height="8"/>
    <rect x="510" y="500" width="10" height="10"/>
    <rect x="700" y="480" width="10" height="10"/>
    <rect x="720" y="520" width="8" height="8"/>
    <rect x="940" y="490" width="10" height="10"/>
    <rect x="1120" y="510" width="8" height="8"/>
  </g>

  <!-- 메인 컨텐츠 영역 -->
  <g transform="translate(80, 80)">
    <!-- 제목 영역 -->
    <text x="0" y="0" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="url(#accentGradient)" filter="url(#glow)">
      ${data.title}
    </text>
    <text x="0" y="45" font-family="Arial, sans-serif" font-size="24" fill="#94a3b8">
      ${data.date}
    </text>

    <!-- 구분선 -->
    <line x1="0" y1="70" x2="400" y2="70" stroke="url(#accentGradient)" stroke-width="2" opacity="0.5"/>

    <!-- 화제 종목 라벨 -->
    <text x="0" y="120" font-family="Arial, sans-serif" font-size="20" fill="#94a3b8">
      오늘의 화제 종목
    </text>

    <!-- 종목명 -->
    <text x="0" y="180" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="#ffffff">
      ${data.stock}
    </text>
    <text x="320" y="180" font-family="Arial, sans-serif" font-size="32" fill="#64748b">
      (${data.symbol})
    </text>

    <!-- 등락률 -->
    <rect x="0" y="210" width="180" height="60" rx="12" fill="#22c55e" opacity="0.15"/>
    <text x="90" y="252" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#4ade80" text-anchor="middle" filter="url(#glow)">
      ${data.changePercent}
    </text>

    <!-- 선정 기준 -->
    <rect x="200" y="210" width="180" height="60" rx="12" fill="#f59e0b" opacity="0.15"/>
    <text x="290" y="248" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#fbbf24" text-anchor="middle">
      ${data.criteria}
    </text>

    <!-- 핵심 뉴스 -->
    <text x="0" y="330" font-family="Arial, sans-serif" font-size="18" fill="#94a3b8">
      핵심 뉴스
    </text>
    <text x="0" y="370" font-family="Arial, sans-serif" font-size="28" fill="#e2e8f0">
      "${data.headline}"
    </text>
  </g>

  <!-- 워터마크 -->
  <text x="${width - 40}" y="${height - 30}" font-family="Arial, sans-serif" font-size="14" fill="#475569" text-anchor="end">
    While You Were Sleeping
  </text>
</svg>
`;
}

async function generateCard() {
  try {
    const svg = generateSVG(cardData);
    const outputPath = path.join(__dirname, '../output/images/briefing-card-2025-12-05.png');

    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);

    console.log(`브리핑 카드가 생성되었습니다: ${outputPath}`);

    // 파일 크기 확인
    const stats = fs.statSync(outputPath);
    console.log(`파일 크기: ${(stats.size / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('이미지 생성 중 오류 발생:', error);
    process.exit(1);
  }
}

generateCard();
