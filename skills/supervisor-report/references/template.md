# 작업 완료 리포트

**생성일**: YYYY-MM-DD
**작업 ID**: {task-id}
**작업명**: {task-name}

---

## 1. 요청 사항

### 원본 요청
{사용자가 요청한 원본 내용}

### 분석된 작업 항목
1. {작업 1}
2. {작업 2}
3. {작업 3}

---

## 2. 수행된 작업

### 2.1 Frontend 작업
**담당**: frontend-developer
**상태**: 완료/미수행

{작업 내용 요약}

**변경된 파일**:
- `components/XXX.tsx` - {변경 내용}
- `app/XXX/page.tsx` - {변경 내용}

### 2.2 Backend 작업
**담당**: backend-developer
**상태**: 완료/미수행

{작업 내용 요약}

**변경된 파일**:
- `backend/api/xxx.py` - {변경 내용}
- `backend/services/xxx_service.py` - {변경 내용}

### 2.3 문서 작업
**담당**: doc-writer
**상태**: 완료/미수행

**작성된 문서**:
- `개발일지/YYYY-MM-DD-xxx.md`

---

## 3. 테스트 결과

**담당**: test-runner
**실행일**: YYYY-MM-DD

### Frontend 테스트 (Jest)
| 항목 | 결과 |
|------|------|
| 총 테스트 | N개 |
| 성공 | N개 |
| 실패 | N개 |

### Backend 테스트 (pytest)
| 항목 | 결과 |
|------|------|
| 총 테스트 | N개 |
| 성공 | N개 |
| 실패 | N개 |

### 빌드 테스트
- 결과: 성공/실패

---

## 4. 코드 리뷰 결과

**담당**: code-reviewer
**최종 판정**: 🟢 통과 / 🟡 조건부 통과 / 🔴 재작업 필요

### 발견된 이슈
| 레벨 | 파일 | 이슈 |
|------|------|------|
| Critical | - | - |
| Major | - | - |
| Minor | - | - |

### 개선 권고사항
{향후 개선할 점}

---

## 5. 결과물 위치

| 유형 | 파일 경로 |
|------|-----------|
| Frontend 결과 | `output/agents/frontend/YYYY-MM-DD-xxx.md` |
| Backend 결과 | `output/agents/backend/YYYY-MM-DD-xxx.md` |
| 테스트 결과 | `output/agents/tester/YYYY-MM-DD-xxx.md` |
| 리뷰 결과 | `output/agents/reviewer/YYYY-MM-DD-xxx.md` |
| 개발일지 | `개발일지/YYYY-MM-DD-xxx.md` |

---

## 6. 다음 단계 (선택)

{향후 작업이 필요한 경우}
1. {다음 작업 1}
2. {다음 작업 2}

---

**Supervisor**: supervisor-agent
**생성 도구**: Claude Code Multi-Agent System
