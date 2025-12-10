// Node.js를 사용한 아이콘 생성 스크립트
// sharp 패키지 필요: npm install sharp

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/icon.svg');
const publicDir = path.join(__dirname, '../public');

// 생성할 아이콘 목록
const icons = [
  { name: 'icon-192', size: 192 },
  { name: 'icon-512', size: 512 },
  { name: 'icon-180', size: 180 },
  { name: 'icon-maskable', size: 512 }, // maskable은 512x512
];

async function generateIcons() {
  try {
    // SVG 파일 확인
    if (!fs.existsSync(svgPath)) {
      console.error('❌ icon.svg 파일을 찾을 수 없습니다.');
      console.log('경로:', svgPath);
      return;
    }

    console.log('🎨 PWA 아이콘 생성 중...\n');

    for (const icon of icons) {
      const outputPath = path.join(publicDir, `${icon.name}.png`);
      
      try {
        await sharp(svgPath)
          .resize(icon.size, icon.size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }, // 투명 배경
          })
          .png()
          .toFile(outputPath);
        
        console.log(`✅ ${icon.name}.png 생성 완료 (${icon.size}x${icon.size})`);
      } catch (error) {
        console.error(`❌ ${icon.name}.png 생성 실패:`, error.message);
      }
    }

    console.log('\n✨ 모든 아이콘 생성 완료!');
    console.log('\n생성된 파일:');
    icons.forEach(icon => {
      const filePath = path.join(publicDir, `${icon.name}.png`);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`  - ${icon.name}.png (${(stats.size / 1024).toFixed(2)} KB)`);
      }
    });
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.log('\n💡 해결 방법:');
    console.log('   1. sharp 패키지 설치: npm install sharp');
    console.log('   2. 또는 ImageMagick 사용: ./scripts/generate-icons.sh');
  }
}

// sharp 패키지 확인
try {
  require.resolve('sharp');
  generateIcons();
} catch (e) {
  console.log('⚠️  sharp 패키지가 설치되어 있지 않습니다.');
  console.log('\n설치 방법:');
  console.log('  npm install sharp');
  console.log('\n또는 ImageMagick 스크립트 사용:');
  console.log('  ./scripts/generate-icons.sh');
}

