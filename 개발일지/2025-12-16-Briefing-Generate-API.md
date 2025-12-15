# 개발일지 - 브리핑 생성 API

**작성 시각**: 2025-12-16

## 해결하고자 한 문제

브리핑 마크다운 콘텐츠를 생성하는 API 구현
- 종목 정보, 점수, WHY HOT, 뉴스를 포함한 템플릿 기반 브리핑 생성
- 특정 종목 지정 또는 자동 선정 기능

## 해결된 것

✅ **브리핑 생성 서비스** (`services/briefing_generator.py`)
- `BriefingGenerator` 클래스 구현
- 마크다운 템플릿 기반 콘텐츠 생성
- 시가총액 포맷팅 (T/B/M 단위)
- 점수별 설명 생성
- WHY HOT 및 뉴스 포맷팅

✅ **Pydantic 모델 추가** (`models/briefing.py`)
- `GenerateBriefingRequest`: 생성 요청 (ticker, type)
- `GenerateBriefingResponse`: 생성 응답 (ticker, markdown, generated_at)

✅ **API 엔드포인트** (`api/briefing_generate.py`)
```
POST /api/briefing/generate
```

✅ **테스트 완료**
```bash
# 특정 종목 브리핑 생성
curl -X POST "http://localhost:8000/api/briefing/generate" \
  -H "Content-Type: application/json" \
  -d '{"ticker": "TSLA", "type": "most_actives"}'
→ TSLA 브리핑 마크다운 생성 성공

# 자동 선정 (ticker 빈 문자열)
curl -X POST "http://localhost:8000/api/briefing/generate" \
  -H "Content-Type: application/json" \
  -d '{"ticker": "", "type": "most_actives"}'
→ IMNM (TOP 1 종목) 자동 선정 및 브리핑 생성
```

## 해결되지 않은 것

없음

## 향후 개발을 위한 컨텍스트 정리

### API 사용법

```bash
# 특정 종목 브리핑 생성
curl -X POST "http://localhost:8000/api/briefing/generate" \
  -H "Content-Type: application/json" \
  -d '{"ticker": "AAPL", "type": "most_actives"}'

# 자동 선정 종목 브리핑 생성
curl -X POST "http://localhost:8000/api/briefing/generate" \
  -H "Content-Type: application/json" \
  -d '{"ticker": "", "type": "day_gainers"}'
```

### 응답 형식

```json
{
  "ticker": "TSLA",
  "markdown": "# 🌙 당신이 잠든 사이 - 오늘의 브리핑\n...",
  "generated_at": "2025-12-16T00:10:07.542965"
}
```

### 마크다운 템플릿 구조

```markdown
# 🌙 당신이 잠든 사이 - 오늘의 브리핑
> 날짜 기준

## 🔥 오늘의 화제 종목
### {심볼} - {종목명}
| 현재가 | 전일대비 | 거래량 | 시가총액 | 선정 기준 |

## 📊 복합 점수 분석 ({점수}/40점)
| 지표 | 점수 | 설명 |

## 💡 WHY HOT?
- 항목들...

## 📰 관련 뉴스
1. 뉴스 링크들...

## 📝 투자 참고사항
> 면책 조항
```

### 전체 API 목록

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| /api/stocks/trending | GET | 화제 종목 TOP 1 |
| /api/stocks/trending/top | GET | TOP N 종목 리스트 |
| /api/stocks/{ticker} | GET | 종목 상세 정보 |
| /api/briefings | GET | 브리핑 리스트 |
| /api/briefings/{date} | GET | 특정 날짜 브리핑 |
| /api/briefing/generate | POST | 브리핑 마크다운 생성 |
