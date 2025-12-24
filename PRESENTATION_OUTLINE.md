# 당신이 잠든 사이 - 프로젝트 발표 자료

**작성일**: 2025-12-20
**형식**: 마크다운 슬라이드 아웃라인 (총 10페이지)

---

## Slide 1: 표지 (Cover)

### [Visual]
- **배경**: 검정색 배경에 은은한 달(Moon) 모양 그래픽
- **타이틀**: "당신이 잠든 사이" (Bold, Big)
- **서브**: 아침 7시, 당신을 위한 금융 브리핑
- **로고**: 프로젝트 로고 (달/별 형상화)

### [Script/Text]
- **제목**: 당신이 잠든 사이 (While You Were Sleeping)
- **한줄 소개**: 매일 아침 7시, 복잡한 밤사이 금융 시장을 한눈에 정리해주는 스마트 대시보드
- **발표자**: [이름]

---

## Slide 2: 문제 정의 및 솔루션 (Problem & Solution)

### [Visual]
- **좌측 (Problem)**: 쏟아지는 뉴스, 복잡한 차트, 너무 많은 정보 (Chaotic Image)
- **우측 (Solution)**: 정돈된 카드 UI, 핵심 요약, "TOP 3" (Clean UI)

### [Script/Text]
- **Problem**:
    - "밤새 미국 증시는 어땠을까?"
    - 쏟아지는 뉴스, 너무 많은 데이터로 인한 정보 피로감 (Information Overload).
    - 바쁜 아침, 핵심만 파악하기 어렵습니다.
- **Solution**:
    - **Curated Briefing**: 우리가 잠든 사이 발생한 핵심 이슈만 선별.
    - **Visual First**: 텍스트 대신 직관적인 차트와 숫자로 전달.
    - **Zero Effort**: 검색 없이 접속만으로 상황 파악 완료.

---

## Slide 3: 서비스 개요 (Service Overview)

### [Visual]
- 메인 대시보드 전체 스크린샷 (목업)
- 주요 구역 하이라이트 (TOP 3, 검색, 달력)

### [Script/Text]
- **Core Value**:
    1.  **Morning Ritual**: 아침 7시, 하루의 투자를 준비하는 루틴.
    2.  **Smart Curation**: 알고리즘이 선정한 '오늘의 화제 종목'.
    3.  **Visual Briefing**: 이미지 한 장으로 끝내는 시장 요약.
- **Platform**: Web + PWA (Mobile App experience)

---

## Slide 4: 핵심 기능 1 - 스마트 대시보드 (Smart Dashboard)

### [Visual]
- '오늘의 화제 종목' 카드 확대
- 'TOP 3 비교' 카드 확대
- 동적인 차트 애니메이션 (Recharts)

### [Script/Text]
- **오늘의 화제 종목**:
    - 자체 복합 점수(거래량+변동률+이슈)로 선정된 No.1 종목.
    - 5일간의 주가 흐름을 인터랙티브 차트로 시각화.
- **TOP 3 비교**:
    - 시장을 주도하는 상위 3개 종목을 나란히 비교 분석.
    - 상승/하락 트렌드를 색상(Red/Blue)으로 즉각 인지.

---

## Slide 5: 핵심 기능 2 - 개인화 & 알림 (Personalization)

### [Visual]
- 알림 설정 UI (슬라이더, 토글)
- 브라우저 푸시 알림 예시 화면
- 관심 종목 리스트

### [Script/Text]
- **조건부 실시간 알림**:
    - "삼성전자 7만원 도달 시", "전일 대비 5% 급등 시"
    - 원하는 조건(AND/OR)을 설정하면 즉시 알림 발송.
- **관심 종목 관리**:
    - 나만의 투자 포트폴리오를 구성하고 추적.
    - 한국어 초성 검색 지원으로 빠른 접근성 (예: 'ㅅㅅㅈ' → 삼성전자).

---

## Slide 6: 핵심 기능 3 - 브리핑 아카이브 (Briefing Archive)

### [Visual]
- 캘린더 뷰 (Briefing Calendar)
- 날짜별 브리핑 카드 그리드
- 공유하기 버튼 인터랙션

### [Script/Text]
- **Investment Log**:
    - '그날의 시장'을 기록하는 투자 일기장.
    - 월간/주간 캘린더 뷰로 과거 시장 흐름을 한눈에 조망.
- **Social Share**:
    - 브리핑 내용을 예쁜 이미지 카드로 생성.
    - SNS(카톡, 인스타) 원클릭 공유.

---

## Slide 7: 디자인 시스템 (Design System)

### [Visual]
- **Color Palette**: Pure Black (#000000), Pure White (#FFFFFF), Musinsa Red (#FF0000)
- **Typography**: Bebas Neue (Headlines), Pretendard (Body)
- **Layout**: Grid System & Editorial Style

### [Script/Text]
- **Concept**: "Bold & Minimal" (Musinsa-inspired)
- **Editorial Layout**:
    - 잡지를 읽는 듯한 높은 가독성과 미려한 타이포그래피.
    - 금융 앱의 딱딱함을 탈피한 세련된 UX.
- **Universal Design**:
    - 다크 모드 / 라이트 모드 완벽 지원.
    - 반응형 웹으로 데스크탑과 모바일 모두 최적화.

---

## Slide 8: 기술 스택 (Tech Stack)

### [Visual]
- 기술 로고 배치 (Next.js, React, Tailwind, PWA)
- 시스템 아키텍처 다이어그램 (간략)

### [Script/Text]
- **Frontend**:
    - **Next.js 16 (App Router)**: 최신 React 기능 활용, 서버 사이드 렌더링(SSR)으로 초기 로딩 속도 극대화.
    - **React 19**: Server Components 도입.
    - **Tailwind CSS 4**: 제로 런타임 스타일링으로 성능 최적화.
- **PWA (Progressive Web App)**:
    - 앱 스토어 없이 설치 가능.
    - 오프라인 지원 및 푸시 알림 기능.
- **Visualization**: Recharts, Framer Motion (60fps 애니메이션).

---

## Slide 9: 향후 로드맵 (Roadmap)

### [Visual]
- 타임라인 그래픽 (Phase 1 -> Phase 2 -> Phase 3)

### [Script/Text]
- **Phase 1 (Current)**:
    - 핵심 대시보드 및 알림 기능 안정화.
    - PWA 경험 최적화.
- **Phase 2 (Next)**:
    - **AI Analyst**: LLM 기반 시장 브리핑 자동 생성.
    - **Global Market**: 미국 주식 데이터 연동.
- **Phase 3 (Future)**:
    - 소셜 투자 기능 (유저 간 인사이트 공유).
    - 개인 포트폴리오 진단 서비스.

---

## Slide 10: 마무리 (Closing)

### [Visual]
- "투자의 시작, 당신이 잠든 사이" 문구
- QR코드 (데모 사이트 접속)
- Thanks You

### [Script/Text]
- **Vision**: 정보의 비대칭을 해소하고, 누구나 쉽고 세련되게 금융 정보를 접하는 세상.
- **Call to Action**: 지금 바로 '당신이 잠든 사이'를 홈 화면에 추가하세요.
- **Q&A**

---
