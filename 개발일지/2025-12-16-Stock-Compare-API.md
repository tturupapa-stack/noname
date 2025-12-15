# 개발일지 - 종목 비교 API

**작성 시각**: 2025-12-16

## 해결하고자 한 문제

여러 종목을 비교하는 API 구현
- 최대 5개 종목의 주요 지표 비교
- 변동률, 거래량, 시가총액 순위 제공

## 해결된 것

✅ **Pydantic 모델 추가** (`models/stock.py`)
- `CompareRequest`: 비교 요청 (tickers 리스트)
- `CompareStockItem`: 비교용 종목 정보 (포맷된 값 포함)
- `CompareRanking`: 지표별 순위
- `CompareResponse`: 비교 응답

✅ **API 엔드포인트** (`api/stock.py`)
```
POST /api/stocks/compare
```

✅ **주요 기능**
- 최소 2개, 최대 5개 종목 제한
- 중복 종목 자동 제거
- 대소문자 무관 (자동 대문자 변환)
- 포맷된 숫자 제공 (36.41M, $1.58T 등)
- 지표별 순위 자동 계산

✅ **테스트 완료**
```bash
curl -X POST "http://localhost:8000/api/stocks/compare" \
  -H "Content-Type: application/json" \
  -d '{"tickers": ["TSLA", "NVDA", "AAPL"]}'
```

**응답 예시:**
```json
{
  "count": 3,
  "stocks": [
    {
      "symbol": "TSLA",
      "name": "Tesla, Inc.",
      "price": 473.89,
      "change_percent": 3.25,
      "volume": 36414471,
      "volume_formatted": "36.41M",
      "market_cap_formatted": "$1.58T"
    },
    ...
  ],
  "rankings": {
    "by_change_percent": ["TSLA", "NVDA", "AAPL"],
    "by_volume": ["NVDA", "TSLA", "AAPL"],
    "by_market_cap": ["NVDA", "AAPL", "TSLA"]
  }
}
```

## 해결되지 않은 것

없음

## 향후 개발을 위한 컨텍스트 정리

### API 사용법

```bash
# 3개 종목 비교
curl -X POST "http://localhost:8000/api/stocks/compare" \
  -H "Content-Type: application/json" \
  -d '{"tickers": ["TSLA", "NVDA", "AAPL"]}'

# 5개 종목 비교 (최대)
curl -X POST "http://localhost:8000/api/stocks/compare" \
  -H "Content-Type: application/json" \
  -d '{"tickers": ["TSLA", "NVDA", "AAPL", "MSFT", "GOOGL"]}'
```

### 에러 케이스

| 상황 | HTTP 코드 | 메시지 |
|------|----------|--------|
| 종목 6개 이상 | 400 | 최대 5개 종목까지 비교 가능합니다 |
| 종목 1개 이하 | 400 | 최소 2개 이상의 종목이 필요합니다 |
| 유효하지 않은 종목 | 400 | 유효한 종목을 2개 이상 찾을 수 없습니다 |

### 전체 API 목록

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| /api/stocks/trending | GET | 화제 종목 TOP 1 |
| /api/stocks/trending/top | GET | TOP N 종목 리스트 |
| /api/stocks/compare | POST | 종목 비교 |
| /api/stocks/{ticker} | GET | 종목 상세 정보 |
| /api/briefings | GET | 브리핑 리스트 |
| /api/briefings/{date} | GET | 특정 날짜 브리핑 |
| /api/briefing/generate | POST | 브리핑 마크다운 생성 |
