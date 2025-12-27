---
name: supervisor-report
description: 복잡한 요청을 분석하여 적합한 에이전트(frontend-developer, backend-developer, test-runner, code-reviewer, doc-writer)를 자동 선발하고, 작업을 위임하며, 결과물을 검증하고 최종 보고서를 생성하는 오케스트레이션 스킬. 새로운 기능 개발, 버그 수정, 리팩토링, 다단계 작업에 사용.
---

# Supervisor Report Skill - 오케스트레이션 스킬

이 스킬은 사용자의 복잡한 요청을 분석하여 적합한 에이전트를 자동 선발하고, 작업을 위임하며, 결과물을 검증하고 최종 보고서를 생성합니다.

## 사용 시점

- 새로운 기능 개발 요청
- 버그 수정 요청
- 리팩토링 요청
- 여러 에이전트의 협업이 필요한 복잡한 작업
- 코드 리뷰 + 문서화 등 다단계 작업

---

## 핵심 원칙

> **"모든 작업은 Task tool로 적합한 에이전트에게 위임하라."**

당신(메인 Claude)은 이 스킬을 사용할 때 **관리자이자 조율자** 역할을 수행합니다:
- 직접 코드를 작성하지 않음
- Task tool로 에이전트를 호출하여 작업 위임
- 결과를 수집하고 검증
- 최종 보고서 생성

> **"에이전트의 결과물을 신뢰하지 마라. 모든 것을 의심하고 검증하라."**

---

## 사용 가능한 에이전트

| subagent_type | 용도 |
|---------------|------|
| `frontend-developer` | React/Next.js 컴포넌트, UI/UX |
| `backend-developer` | FastAPI, DB, 서버 로직 |
| `test-runner` | 테스트 실행 및 결과 보고 |
| `code-reviewer` | 코드 품질 리뷰 (항상 실행) |
| `doc-writer` | 개발일지, API 문서 작성 |

---

## 워크플로우

### Phase 1: 요청 분석

사용자 요청을 분석합니다:
- **작업 유형**: 신규 기능 / 버그 수정 / 리팩토링 / 문서화
- **영향 범위**: Frontend / Backend / Full-stack
- **필요 에이전트**: 위 분석 기반으로 선정

### Phase 2: 에이전트 선발 기준

| 작업 유형 | 주 담당 | 보조 |
|-----------|---------|------|
| Frontend 개발 | frontend-developer | test-runner |
| Backend 개발 | backend-developer | test-runner |
| Full-stack | frontend + backend | test-runner |
| 문서화 | doc-writer | - |
| 모든 코드 변경 | - | code-reviewer (필수) |

### Phase 3: 작업 위임 (Task tool 사용)

**Task tool 호출 예제:**

#### 코드 리뷰 (code-reviewer)

```
Task tool:
- subagent_type: "code-reviewer"
- prompt: "프론트엔드 코드를 리뷰해주세요. components/, app/, services/ 폴더의 React/TypeScript 코드를 검토하고 코드 품질, 성능, 접근성, 보안 관점에서 이슈를 찾아주세요. 결과는 .agent-results/reviewer/2025-12-27-frontend-review.md에 저장해주세요."
- description: "프론트엔드 코드 리뷰"
```

```
Task tool:
- subagent_type: "code-reviewer"
- prompt: "백엔드 코드를 리뷰해주세요. backend/ 폴더의 Python FastAPI 코드를 검토하고 API 설계, 에러 처리, 보안 취약점을 점검해주세요. 결과는 .agent-results/reviewer/2025-12-27-backend-review.md에 저장해주세요."
- description: "백엔드 코드 리뷰"
```

#### 프론트엔드 개발 (frontend-developer)

```
Task tool:
- subagent_type: "frontend-developer"
- prompt: "StockDetailModal 컴포넌트를 개발해주세요. 주식 상세 정보를 모달로 표시하고, 차트와 뉴스 탭을 포함해야 합니다. Tailwind CSS와 다크모드를 지원해주세요. 결과는 .agent-results/frontend/2025-12-27-stock-detail-modal.md에 저장해주세요."
- description: "주식 상세 모달 개발"
```

```
Task tool:
- subagent_type: "frontend-developer"
- prompt: "SearchInput 컴포넌트의 버그를 수정해주세요. 한글 입력 시 조합 중인 글자가 두 번 입력되는 문제가 있습니다. IME 이벤트 처리를 개선해주세요. 결과는 .agent-results/frontend/2025-12-27-search-input-fix.md에 저장해주세요."
- description: "검색 입력 버그 수정"
```

#### 백엔드 개발 (backend-developer)

```
Task tool:
- subagent_type: "backend-developer"
- prompt: "POST /api/alerts 엔드포인트를 개발해주세요. 사용자가 주가 알림을 설정할 수 있어야 합니다. 요청 검증, 에러 처리, 응답 형식을 포함해주세요. 결과는 .agent-results/backend/2025-12-27-alerts-api.md에 저장해주세요."
- description: "알림 API 엔드포인트 개발"
```

```
Task tool:
- subagent_type: "backend-developer"
- prompt: "news_service.py의 메모리 누수 버그를 수정해주세요. 대량의 뉴스 데이터 처리 시 메모리가 해제되지 않는 문제가 있습니다. 결과는 .agent-results/backend/2025-12-27-news-service-fix.md에 저장해주세요."
- description: "뉴스 서비스 메모리 누수 수정"
```

#### 테스트 실행 (test-runner)

```
Task tool:
- subagent_type: "test-runner"
- model: "haiku"
- prompt: "npm test를 실행하고 결과를 보고해주세요. 실패한 테스트가 있다면 원인을 분석해주세요. 결과는 .agent-results/tester/2025-12-27-test-results.md에 저장해주세요."
- description: "전체 테스트 실행"
```

```
Task tool:
- subagent_type: "test-runner"
- model: "haiku"
- prompt: "StockCard 컴포넌트의 테스트만 실행해주세요. npm test -- StockCard 명령을 사용하고 커버리지도 확인해주세요. 결과는 .agent-results/tester/2025-12-27-stockcard-test.md에 저장해주세요."
- description: "StockCard 테스트 실행"
```

#### 문서 작성 (doc-writer)

```
Task tool:
- subagent_type: "doc-writer"
- model: "haiku"
- prompt: "오늘 개발한 알림 기능에 대한 개발일지를 작성해주세요. 개발일지/2025-12-27-알림기능.md 형식으로 저장하고, 해결한 문제, 변경 파일, 향후 개선사항을 포함해주세요."
- description: "알림 기능 개발일지 작성"
```

```
Task tool:
- subagent_type: "doc-writer"
- model: "haiku"
- prompt: "backend/api/ 폴더의 API 엔드포인트 문서를 작성해주세요. 각 엔드포인트의 URL, 메서드, 파라미터, 응답 형식을 정리해주세요. 결과는 .agent-results/docs/2025-12-27-api-docs.md에 저장해주세요."
- description: "API 문서 작성"
```

#### 병렬 호출 예제 (동시 실행)

```
# 프론트엔드와 백엔드 리뷰를 동시에 실행
Task tool 1:
- subagent_type: "code-reviewer"
- prompt: "프론트엔드 코드를 리뷰해주세요..."
- description: "프론트엔드 코드 리뷰"

Task tool 2:
- subagent_type: "code-reviewer"
- prompt: "백엔드 코드를 리뷰해주세요..."
- description: "백엔드 코드 리뷰"
```

---

**작업 지시 prompt 형식:**
```markdown
## 작업 요청

**작업 ID**: {YYYY-MM-DD-task-name}
**담당 에이전트**: {agent-name}

### 작업 내용
{구체적인 작업 지시}

### 결과물 저장 위치
`.agent-results/{agent-type}/YYYY-MM-DD-{task-name}.md`

### 완료 기준
- [ ] 코드 구현 완료
- [ ] 결과물 파일 저장
```

#### 병렬 에이전트 호출 패턴

> **성능 최적화**: 독립적인 작업은 **반드시 병렬로** 호출하여 시간을 단축

**병렬 호출 가능 조건:**
- 두 작업 간 의존성이 없을 때
- 각 에이전트가 다른 파일/영역을 담당할 때

**병렬 호출 패턴표:**
| 시나리오 | 병렬 호출 | 순차 호출 |
|----------|-----------|-----------|
| Frontend + Backend 동시 개발 | 병렬 | - |
| 개발 완료 후 테스트 | - | 순차 |
| 개발 완료 후 리뷰 | - | 순차 |
| Frontend 테스트 + Backend 테스트 | 병렬 | - |
| 리뷰 후 문서화 | - | 순차 |

**모델 최적화:**
| 에이전트 | 권장 모델 | 이유 |
|----------|-----------|------|
| `frontend-developer` | `sonnet` | 복잡한 UI 로직 |
| `backend-developer` | `sonnet` | API 설계, 보안 |
| `test-runner` | `haiku` | 단순 실행/보고 |
| `code-reviewer` | `sonnet` | 심층 분석 필요 |
| `doc-writer` | `haiku` | 정형화된 문서 |

### Phase 4: 결과 수집 및 검증

각 에이전트 작업 완료 후 **직접 검증**합니다:

#### 4.1 결과물 존재 확인
- `.agent-results/` 폴더에 결과물이 실제로 저장되었는가?
- 파일이 비어있거나 불완전하지 않은가?

#### 4.2 필수 검증 질문
1. **이 코드가 실제로 동작하는가?**
2. **엣지 케이스를 처리했는가?**
3. **보안 취약점은 없는가?**
4. **성능 문제는 없는가?**
5. **기존 기능을 깨뜨리지 않았는가?**

### Phase 5: 품질 리뷰 (필수)

**모든 코드 변경에 대해** `code-reviewer` 에이전트를 호출합니다:
- 코드 품질 검토
- 보안 이슈 확인
- 판정: 통과 / 조건부 통과 / 재작업 필요

### Phase 6: 최종 리포트 생성

**저장 위치**: `output/reports/{YYYY-MM-DD-task-name}/final-report.md`

**리포트 형식:**
```markdown
# 작업 완료 리포트

**생성일**: YYYY-MM-DD
**작업명**: {task-name}

## 1. 요청 사항
{원본 요청 내용}

## 2. 수행된 작업

### Frontend
- 변경 파일: ...
- 작업 내용: ...

### Backend
- 변경 파일: ...
- 작업 내용: ...

## 3. 테스트 결과
- 총 테스트: N개
- 성공: N개
- 실패: N개

## 4. 코드 리뷰 결과
**판정**: 통과/조건부통과/재작업
{리뷰 내용}

## 5. 에이전트 평가
| 에이전트 | 등급 | 재작업 횟수 | 비고 |
|----------|------|-------------|------|
| frontend-developer | A | 0 | - |
| backend-developer | A | 0 | - |

## 6. 결과물 위치
| 유형 | 경로 |
|------|------|
| Frontend 결과 | .agent-results/frontend/... |
| Backend 결과 | .agent-results/backend/... |
| 리뷰 결과 | .agent-results/reviewer/... |
```

---

## 의사결정 기준

### 에이전트 재호출 조건

| 상황 | 대응 |
|------|------|
| 테스트 1개라도 실패 | 즉시 재작업 요청 |
| code-reviewer 재작업 판정 | 모든 이슈 수정 후 재검토 |
| 결과물 파일 누락 | 재작업 요청 |
| 빌드 실패 | 즉시 재작업 요청 |

### 재작업 요청 시 피드백 형식

```markdown
## 재작업 요청

**이유**: {구체적인 문제점}
**심각도**: Critical / Major / Minor

### 발견된 문제
1. {문제 1} - 파일:라인

### 수정 지침
- {구체적인 수정 방법}
```

### 작업 완료 조건

다음 **모든 조건**을 만족해야 완료:
- [ ] 모든 테스트 100% 통과
- [ ] code-reviewer 통과 또는 조건부 통과 판정
- [ ] 빌드 성공
- [ ] 결과물 파일 모두 저장됨
- [ ] 최종 리포트 생성 완료

---

## 에이전트 평가 등급

| 등급 | 기준 | 향후 대응 |
|------|------|-----------|
| A | 첫 시도에 완벽 | 신뢰도 상승 |
| B | 1회 재작업 후 완료 | 주의 관찰 |
| C | 2회 이상 재작업 | 상세 지시 필요 |
| F | 반복적 실패 | 다른 에이전트 고려 |

---

## 커뮤니케이션

- 사용자에게는 **한국어**로 진행 상황 보고
- **문제 발견 시 즉시 사용자에게 보고**
- 모든 리포트는 **한국어**로 작성
