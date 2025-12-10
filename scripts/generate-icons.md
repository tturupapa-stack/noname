# PWA 아이콘 생성 가이드

PWA를 사용하려면 다음 크기의 아이콘이 필요합니다:

- `icon-192.png` (192x192)
- `icon-512.png` (512x512)
- `icon-maskable.png` (512x512, maskable)
- `icon-180.png` (180x180, iOS)

## 아이콘 생성 방법

1. **온라인 도구 사용**:
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator

2. **ImageMagick 사용** (터미널):
   ```bash
   # SVG를 PNG로 변환
   convert icon-placeholder.svg -resize 192x192 icon-192.png
   convert icon-placeholder.svg -resize 512x512 icon-512.png
   convert icon-placeholder.svg -resize 180x180 icon-180.png
   
   # Maskable icon (안전 영역 포함)
   convert icon-placeholder.svg -resize 512x512 -background transparent -gravity center -extent 512x512 icon-maskable.png
   ```

3. **디자인 도구 사용**:
   - Figma, Sketch, Adobe Illustrator 등에서 디자인 후 PNG로 export

## 아이콘 디자인 가이드

- **배경**: 브랜드 컬러 (보라/파랑 그라데이션)
- **아이콘**: 달, 별, 신문 등 모티프
- **텍스트**: "잠든사이" 또는 "🌙"
- **Maskable**: 안전 영역 80% 내에 핵심 요소 배치

