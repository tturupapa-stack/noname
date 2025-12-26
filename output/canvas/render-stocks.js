const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// IMPORTANT: Register fonts BEFORE creating canvas
const fontsDir = '/Users/larkkim/.claude/plugins/cache/anthropic-agent-skills/document-skills/69c0b1a06741/skills/canvas-design/canvas-fonts';

registerFont(path.join(fontsDir, 'GeistMono-Bold.ttf'), { family: 'GeistMono', weight: 'bold' });
registerFont(path.join(fontsDir, 'GeistMono-Regular.ttf'), { family: 'GeistMono', weight: 'normal' });
registerFont(path.join(fontsDir, 'WorkSans-Bold.ttf'), { family: 'WorkSans', weight: 'bold' });
registerFont(path.join(fontsDir, 'WorkSans-Regular.ttf'), { family: 'WorkSans', weight: 'normal' });
console.log('Fonts registered');

// Canvas setup - create AFTER font registration
const width = 1200;
const height = 800;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Color palette
const colors = {
  background: '#1a1a2e',
  cardBg: '#16213e',
  cardBorder: '#0f3460',
  textPrimary: '#ffffff',
  textSecondary: '#a0a0b0',
  textMuted: '#707080',
  positive: '#00ff88',
  negative: '#ff4d6d',
  accent: '#4cc9f0',
  gold: '#ffd700',
  silver: '#c0c0c0',
  bronze: '#cd7f32'
};

// Stock data
const stocks = [
  { symbol: 'HYMC', name: 'Hycroft Mining', price: 24.96, change: -8.03, volumeRatio: 2.9, isPositive: false, highlight: 'Volume 2.9x' },
  { symbol: 'DJT', name: 'Trump Media', price: 14.95, change: 5.65, volumeRatio: 0.42, isPositive: true, highlight: 'Uptrend' },
  { symbol: 'FOLD', name: 'Amicus Therapeutics', price: 14.18, change: 30.21, volumeRatio: 22.82, isPositive: true, highlight: 'Volume 22.8x' }
];

// Helper function for rounded rectangles
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// =====================
// DRAW BACKGROUND
// =====================
const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
bgGrad.addColorStop(0, '#1a1a2e');
bgGrad.addColorStop(1, '#0f0f1a');
ctx.fillStyle = bgGrad;
ctx.fillRect(0, 0, width, height);

// Subtle grid
ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
ctx.lineWidth = 1;
for (let i = 0; i < width; i += 40) {
  ctx.beginPath();
  ctx.moveTo(i, 0);
  ctx.lineTo(i, height);
  ctx.stroke();
}
for (let i = 0; i < height; i += 40) {
  ctx.beginPath();
  ctx.moveTo(0, i);
  ctx.lineTo(width, i);
  ctx.stroke();
}

// =====================
// HEADER SECTION
// =====================
ctx.fillStyle = colors.accent;
ctx.font = '12px GeistMono';
ctx.fillText('DAILY HOT STOCKS', 60, 55);

ctx.fillStyle = colors.textPrimary;
ctx.font = 'bold 44px WorkSans';
ctx.fillText('Hot Stocks Comparison', 60, 105);

ctx.fillStyle = colors.textSecondary;
ctx.font = '15px WorkSans';
ctx.fillText('2025.12.25  |  While You Were Sleeping', 60, 135);

// Accent line
const lineGrad = ctx.createLinearGradient(60, 155, 500, 155);
lineGrad.addColorStop(0, colors.accent);
lineGrad.addColorStop(1, 'transparent');
ctx.strokeStyle = lineGrad;
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(60, 155);
ctx.lineTo(500, 155);
ctx.stroke();

// =====================
// STOCK CARDS
// =====================
const cardWidth = 340;
const cardHeight = 500;
const cardStartY = 185;
const cardGap = 40;

stocks.forEach((stock, index) => {
  const x = 60 + (cardWidth + cardGap) * index;
  const y = cardStartY;

  // Card background
  const cardGrad = ctx.createLinearGradient(x, y, x, y + cardHeight);
  cardGrad.addColorStop(0, colors.cardBg);
  cardGrad.addColorStop(1, '#0a0a15');
  roundRect(x, y, cardWidth, cardHeight, 16);
  ctx.fillStyle = cardGrad;
  ctx.fill();
  ctx.strokeStyle = colors.cardBorder;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Rank badge
  const badgeColors = [colors.gold, colors.silver, colors.bronze];
  ctx.fillStyle = badgeColors[index];
  ctx.beginPath();
  ctx.arc(x + 35, y + 40, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 11px GeistMono';
  ctx.textAlign = 'center';
  ctx.fillText(['1ST', '2ND', '3RD'][index], x + 35, y + 44);
  ctx.textAlign = 'left';

  // Symbol
  ctx.fillStyle = colors.textPrimary;
  ctx.font = 'bold 38px GeistMono';
  ctx.fillText(stock.symbol, x + 24, y + 110);

  // Company name
  ctx.fillStyle = colors.textSecondary;
  ctx.font = '14px WorkSans';
  ctx.fillText(stock.name, x + 24, y + 135);

  // Highlight tag
  ctx.font = '11px GeistMono';
  const tagWidth = ctx.measureText(stock.highlight).width + 20;
  ctx.fillStyle = stock.isPositive ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 77, 109, 0.15)';
  roundRect(x + 24, y + 150, tagWidth, 26, 6);
  ctx.fill();
  ctx.fillStyle = stock.isPositive ? colors.positive : colors.negative;
  ctx.fillText(stock.highlight, x + 34, y + 168);

  // Price label
  ctx.fillStyle = colors.textMuted;
  ctx.font = '11px GeistMono';
  ctx.fillText('CURRENT PRICE', x + 24, y + 215);

  // Price value
  ctx.fillStyle = colors.textPrimary;
  ctx.font = 'bold 42px GeistMono';
  ctx.fillText('$' + stock.price.toFixed(2), x + 24, y + 265);

  // Change percentage
  const changeColor = stock.isPositive ? colors.positive : colors.negative;
  const changeText = (stock.isPositive ? '+' : '') + stock.change.toFixed(2) + '%';
  ctx.font = 'bold 22px GeistMono';
  const changeWidth = ctx.measureText(changeText).width + 45;

  ctx.fillStyle = stock.isPositive ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 77, 109, 0.15)';
  roundRect(x + 24, y + 280, changeWidth, 44, 8);
  ctx.fill();

  ctx.fillStyle = changeColor;
  ctx.font = '16px sans-serif';
  ctx.fillText(stock.isPositive ? '\u25B2' : '\u25BC', x + 36, y + 308);
  ctx.font = 'bold 22px GeistMono';
  ctx.fillText(changeText, x + 56, y + 310);

  // Divider
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.moveTo(x + 24, y + 350);
  ctx.lineTo(x + cardWidth - 24, y + 350);
  ctx.stroke();

  // Volume ratio label
  ctx.fillStyle = colors.textMuted;
  ctx.font = '11px GeistMono';
  ctx.fillText('VOLUME RATIO', x + 24, y + 385);

  // Volume ratio value
  ctx.fillStyle = colors.textPrimary;
  ctx.font = 'bold 30px GeistMono';
  ctx.fillText(stock.volumeRatio.toFixed(2) + 'x', x + 24, y + 420);

  // Volume bar
  const barMaxWidth = cardWidth - 48;
  const barH = 10;
  const barY = y + 440;
  const volumePercent = Math.min(stock.volumeRatio / 25, 1);

  roundRect(x + 24, barY, barMaxWidth, barH, 5);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fill();

  if (volumePercent > 0.02) {
    const barGrad = ctx.createLinearGradient(x + 24, barY, x + 24 + barMaxWidth * volumePercent, barY);
    barGrad.addColorStop(0, colors.accent);
    barGrad.addColorStop(1, stock.isPositive ? colors.positive : colors.negative);
    roundRect(x + 24, barY, Math.max(barMaxWidth * volumePercent, 10), barH, 5);
    ctx.fillStyle = barGrad;
    ctx.fill();
  }

  // Status indicator
  const statusY = y + cardHeight - 40;
  ctx.fillStyle = changeColor;
  ctx.beginPath();
  ctx.arc(x + 36, statusY, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colors.textSecondary;
  ctx.font = '13px WorkSans';
  ctx.fillText(stock.isPositive ? 'Bullish Trend' : 'Bearish Trend', x + 52, statusY + 5);
});

// =====================
// FOOTER
// =====================
ctx.fillStyle = colors.textMuted;
ctx.font = '10px GeistMono';
ctx.fillText('QUANTITATIVE ELEGANCE  |  CANVAS-DESIGN', 60, height - 30);
ctx.textAlign = 'right';
ctx.fillText('While You Were Sleeping Dashboard', width - 60, height - 30);

// =====================
// EXPORT
// =====================
const buffer = canvas.toBuffer('image/png');
const outputPath = path.join(__dirname, 'hot-stocks-comparison.png');
fs.writeFileSync(outputPath, buffer);
console.log('Image saved:', outputPath);
console.log('Size:', (buffer.length / 1024).toFixed(1), 'KB');
