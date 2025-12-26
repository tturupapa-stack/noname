# PWA 설정 가이드

## 아이콘 생성

### 방법 1: 스크립트 사용 (ImageMagick 필요)

```bash
# ImageMagick 설치 (macOS)
brew install imagemagick

# 아이콘 생성
./scripts/generate-icons.sh
```

### 방법 2: 온라인 도구 사용

1. https://realfavicongenerator.net/ 방문
2. `public/icon.svg` 파일 업로드
3. 생성된 아이콘 다운로드
4. `public/` 폴더에 복사

### 방법 3: 수동 생성

필요한 아이콘 파일:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)
- `icon-maskable.png` (512x512, 안전 영역 포함)
- `icon-180.png` (180x180, iOS)

## PWA 테스트

### 개발 모드
```bash
npm run dev
```
- 개발 모드에서는 Service Worker가 비활성화됩니다
- PWA 기능을 테스트하려면 프로덕션 빌드가 필요합니다

### 프로덕션 빌드
```bash
npm run build
npm start
```

### HTTPS 설정 (로컬 테스트)
PWA는 HTTPS에서만 작동합니다 (localhost 제외).

로컬에서 HTTPS 테스트:
```bash
# mkcert 설치
brew install mkcert
mkcert -install

# 인증서 생성
mkcert localhost

# Next.js를 HTTPS로 실행 (next.config.ts 수정 필요)
```

또는 ngrok 사용:
```bash
npm install -g ngrok
ngrok http 3000
```

## 설치 확인

### Android Chrome
1. 브라우저에서 사이트 접속
2. 하단 설치 배너 표시 확인
3. "설치하기" 버튼 클릭
4. 홈 화면에 아이콘 추가 확인

### iOS Safari
1. Safari에서 사이트 접속
2. 공유 버튼(📤) 탭
3. "홈 화면에 추가" 선택
4. 홈 화면에 아이콘 확인

### Desktop Chrome/Edge
1. 주소창 오른쪽의 설치 아이콘 클릭
2. 또는 하단 설치 배너 사용

## Lighthouse 테스트

1. Chrome DevTools 열기 (F12)
2. Lighthouse 탭 선택
3. "Progressive Web App" 체크
4. "Generate report" 클릭
5. PWA 점수 90+ 목표

## 문제 해결

### Service Worker가 등록되지 않음
- HTTPS 사용 확인 (localhost 제외)
- `next.config.ts`에서 `disable: false` 확인
- 브라우저 콘솔에서 에러 확인

### 아이콘이 표시되지 않음
- `public/` 폴더에 아이콘 파일 존재 확인
- `manifest.json`의 경로 확인
- 브라우저 캐시 클리어

### 설치 프롬프트가 표시되지 않음
- PWA 설치 조건 확인:
  - HTTPS 사용
  - manifest.json 유효
  - Service Worker 등록됨
  - 최소 192x192 아이콘 존재
- 로컬스토리지에서 프롬프트 이력 확인

## 참고 자료

- [PWA 가이드](https://web.dev/progressive-web-apps/)
- [Manifest 검증기](https://manifest-validator.appspot.com/)
- [PWA Builder](https://www.pwabuilder.com/)

