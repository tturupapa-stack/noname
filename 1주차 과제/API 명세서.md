# API 명세서

**작성일**: 2025-12-11  
**버전**: 1.0  
**Base URL**: `https://api.example.com/v1`

---

## 목차
1. [인증](#1-인증)
2. [종목 데이터](#2-종목-데이터)
3. [브리핑 데이터](#3-브리핑-데이터)
4. [알림 API](#4-알림-api)
5. [사용자 설정](#5-사용자-설정)
6. [에러 처리](#6-에러-처리)

---

## 1. 인증

### 1.1 API 키 인증
모든 API 요청에는 API 키가 필요합니다.

**헤더:**
```
Authorization: Bearer {API_KEY}
```

### 1.2 인증 예시
```bash
curl -X GET "https://api.example.com/v1/stocks" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## 2. 종목 데이터

### 2.1 전체 종목 목록 조회

**엔드포인트:** `GET /stocks`

**설명:** 등록된 모든 종목의 목록을 조회합니다.

**쿼리 파라미터:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| limit | number | 아니오 | 반환할 최대 개수 (기본값: 100) |
| offset | number | 아니오 | 건너뛸 개수 (기본값: 0) |
| sector | string | 아니오 | 섹터 필터 |
| search | string | 아니오 | 종목명/심볼 검색 |

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "stocks": [
      {
        "symbol": "TSLA",
        "shortName": "Tesla, Inc.",
        "currentPrice": 245.67,
        "change": 12.34,
        "changePercent": 5.29,
        "volume": 45234567,
        "marketCap": 780000000000,
        "sector": "Consumer Cyclical",
        "industry": "Auto Manufacturers",
        "compositeScore": 87.45,
        "rank": 1,
        "selectedAt": "2025-12-10T09:30:00Z"
      }
    ],
    "total": 100,
    "limit": 100,
    "offset": 0
  }
}
```

---

### 2.2 특정 종목 상세 조회

**엔드포인트:** `GET /stocks/{symbol}`

**설명:** 특정 종목의 상세 정보를 조회합니다.

**경로 파라미터:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| symbol | string | 예 | 종목 코드 (예: "TSLA") |

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "symbol": "TSLA",
    "shortName": "Tesla, Inc.",
    "currentPrice": 245.67,
    "change": 12.34,
    "changePercent": 5.29,
    "volume": 45234567,
    "marketCap": 780000000000,
    "sector": "Consumer Cyclical",
    "industry": "Auto Manufacturers",
    "compositeScore": 87.45,
    "rank": 1,
    "selectedAt": "2025-12-10T09:30:00Z"
  }
}
```

---

### 2.3 TOP 3 화제 종목 조회

**엔드포인트:** `GET /stocks/trending/top3`

**설명:** 복합 점수 기준 상위 3개 종목을 조회합니다.

**쿼리 파라미터:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| date | string | 아니오 | 날짜 (YYYY-MM-DD), 미지정 시 오늘 |

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "date": "2025-12-10",
    "stocks": [
      {
        "symbol": "TSLA",
        "shortName": "Tesla, Inc.",
        "currentPrice": 245.67,
        "change": 12.34,
        "changePercent": 5.29,
        "volume": 45234567,
        "marketCap": 780000000000,
        "sector": "Consumer Cyclical",
        "industry": "Auto Manufacturers",
        "compositeScore": 87.45,
        "rank": 1,
        "selectedAt": "2025-12-10T09:30:00Z"
      },
      {
        "symbol": "AAPL",
        "shortName": "Apple Inc.",
        "currentPrice": 198.23,
        "change": 5.67,
        "changePercent": 2.94,
        "volume": 52345678,
        "marketCap": 3100000000000,
        "sector": "Technology",
        "industry": "Consumer Electronics",
        "compositeScore": 82.13,
        "rank": 2,
        "selectedAt": "2025-12-10T09:30:00Z"
      },
      {
        "symbol": "NVDA",
        "shortName": "NVIDIA Corporation",
        "currentPrice": 512.45,
        "change": 18.90,
        "changePercent": 3.83,
        "volume": 34567890,
        "marketCap": 1260000000000,
        "sector": "Technology",
        "industry": "Semiconductors",
        "compositeScore": 79.87,
        "rank": 3,
        "selectedAt": "2025-12-10T09:30:00Z"
      }
    ]
  }
}
```

---

### 2.4 종목 주가 차트 데이터 조회

**엔드포인트:** `GET /stocks/{symbol}/chart`

**설명:** 특정 종목의 과거 주가 데이터를 조회합니다.

**경로 파라미터:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| symbol | string | 예 | 종목 코드 |

**쿼리 파라미터:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| period | string | 아니오 | 기간 ("5d", "1m", "3m", "6m", "1y"), 기본값: "5d" |

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "symbol": "TSLA",
    "historicalData": [
      {
        "date": "2025-12-10",
        "price": 245.67,
        "volume": 45234567,
        "open": 233.50,
        "high": 247.20,
        "low": 232.80,
        "close": 245.67
      },
      {
        "date": "2025-12-09",
        "price": 233.33,
        "volume": 32145678,
        "open": 228.90,
        "high": 234.50,
        "low": 227.20,
        "close": 233.33
      }
    ]
  }
}
```

---

### 2.5 종목 검색

**엔드포인트:** `GET /stocks/search`

**설명:** 종목명 또는 심볼로 종목을 검색합니다.

**쿼리 파라미터:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| q | string | 예 | 검색어 |
| limit | number | 아니오 | 최대 반환 개수 (기본값: 10) |

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "symbol": "TSLA",
        "shortName": "Tesla, Inc.",
        "currentPrice": 245.67,
        "change": 12.34,
        "changePercent": 5.29
      }
    ],
    "total": 1
  }
}
```

---

## 3. 브리핑 데이터

### 3.1 브리핑 목록 조회

**엔드포인트:** `GET /briefings`

**설명:** 브리핑 목록을 조회합니다.

**쿼리 파라미터:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| limit | number | 아니오 | 최대 반환 개수 (기본값: 20) |
| offset | number | 아니오 | 건너뛸 개수 (기본값: 0) |
| symbol | string | 아니오 | 종목 코드 필터 |
| date | string | 아니오 | 날짜 필터 (YYYY-MM-DD) |
| status | string | 아니오 | 상태 필터 ("completed", "processing", "failed") |

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "briefings": [
      {
        "briefingId": "brief_20251210_TSLA_001",
        "symbol": "TSLA",
        "date": "2025-12-10",
        "status": "completed",
        "textSummary": {
          "title": "테슬라(TSLA), 신제품 출시 루머로 거래량 급증",
          "summary": "테슬라 주식이 12월 4일 거래량이 평소의 3배 이상 급증하며 주목을 받고 있습니다...",
          "keyPoints": [
            "거래량 4,523만 주로 평균 대비 366% 증가",
            "주가 5.29% 상승 ($245.67)"
          ],
          "investmentInsight": "단기적으로는 루머에 의한 변동성이 높을 수 있으나...",
          "generatedAt": "2025-12-10T10:20:00Z"
        },
        "imageBriefing": {
          "imageUrl": "https://cdn.example.com/briefings/brief_20251210_TSLA_001.png",
          "thumbnailUrl": "https://cdn.example.com/briefings/brief_20251210_TSLA_001_thumb.png",
          "format": "png",
          "dimensions": {
            "width": 1200,
            "height": 630
          },
          "fileSize": 245678,
          "generatedAt": "2025-12-10T10:20:00Z"
        },
        "createdAt": "2025-12-10T10:20:00Z"
      }
    ],
    "total": 50,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 3.2 특정 브리핑 상세 조회

**엔드포인트:** `GET /briefings/{briefingId}`

**설명:** 특정 브리핑의 상세 정보를 조회합니다.

**경로 파라미터:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| briefingId | string | 예 | 브리핑 ID |

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "briefingId": "brief_20251210_TSLA_001",
    "symbol": "TSLA",
    "date": "2025-12-10",
    "status": "completed",
    "textSummary": {
      "title": "테슬라(TSLA), 신제품 출시 루머로 거래량 급증",
      "summary": "테슬라 주식이 12월 4일 거래량이 평소의 3배 이상 급증하며 주목을 받고 있습니다...",
      "keyPoints": [
        "거래량 4,523만 주로 평균 대비 366% 증가",
        "주가 5.29% 상승 ($245.67)",
        "신형 Model Y 출시 루머로 인한 관심 증가",
        "4분기 배송 실적 시장 기대치 초과 달성 가능성"
      ],
      "investmentInsight": "단기적으로는 루머에 의한 변동성이 높을 수 있으나, 실제 신제품 출시 시 추가 상승 여력이 있을 것으로 보입니다...",
      "generatedAt": "2025-12-10T10:20:00Z"
    },
    "imageBriefing": {
      "imageUrl": "https://cdn.example.com/briefings/brief_20251210_TSLA_001.png",
      "thumbnailUrl": "https://cdn.example.com/briefings/brief_20251210_TSLA_001_thumb.png",
      "format": "png",
      "dimensions": {
        "width": 1200,
        "height": 630
      },
      "fileSize": 245678,
      "generatedAt": "2025-12-10T10:20:00Z"
    },
    "createdAt": "2025-12-10T10:20:00Z"
  }
}
```

---

### 3.3 날짜별 브리핑 조회

**엔드포인트:** `GET /briefings/by-date`

**설명:** 날짜별로 그룹화된 브리핑 목록을 조회합니다.

**쿼리 파라미터:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| startDate | string | 아니오 | 시작 날짜 (YYYY-MM-DD) |
| endDate | string | 아니오 | 종료 날짜 (YYYY-MM-DD) |

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "briefingsByDate": [
      {
        "date": "2025-12-10",
        "briefings": [
          {
            "briefingId": "brief_20251210_TSLA_001",
            "symbol": "TSLA",
            "status": "completed"
          }
        ],
        "count": 1
      },
      {
        "date": "2025-12-09",
        "briefings": [
          {
            "briefingId": "brief_20251209_AAPL_001",
            "symbol": "AAPL",
            "status": "completed"
          }
        ],
        "count": 1
      }
    ]
  }
}
```

---

## 4. 알림 API

### 4.1 알림 설정 생성

**엔드포인트:** `POST /alerts`

**설명:** 새로운 알림 설정을 생성합니다.

**요청 본문:**
```json
{
  "symbol": "TSLA",
  "symbolName": "Tesla, Inc.",
  "conditions": [
    {
      "id": "cond_1",
      "type": "price",
      "operator": ">=",
      "value": 250
    },
    {
      "id": "cond_2",
      "type": "changePercent",
      "operator": ">=",
      "value": 5,
      "logicalOperator": "OR"
    }
  ],
  "timeUnit": "1min",
  "enabled": true,
  "browserPush": true,
  "sound": false,
  "vibration": false
}
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "id": "alert_123456",
    "symbol": "TSLA",
    "symbolName": "Tesla, Inc.",
    "conditions": [
      {
        "id": "cond_1",
        "type": "price",
        "operator": ">=",
        "value": 250
      },
      {
        "id": "cond_2",
        "type": "changePercent",
        "operator": ">=",
        "value": 5,
        "logicalOperator": "OR"
      }
    ],
    "timeUnit": "1min",
    "enabled": true,
    "browserPush": true,
    "sound": false,
    "vibration": false,
    "createdAt": "2025-12-10T12:00:00Z"
  }
}
```

---

### 4.2 알림 설정 목록 조회

**엔드포인트:** `GET /alerts`

**설명:** 사용자의 알림 설정 목록을 조회합니다.

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alert_123456",
        "symbol": "TSLA",
        "symbolName": "Tesla, Inc.",
        "conditions": [
          {
            "id": "cond_1",
            "type": "price",
            "operator": ">=",
            "value": 250
          }
        ],
        "timeUnit": "1min",
        "enabled": true,
        "browserPush": true,
        "sound": false,
        "vibration": false,
        "createdAt": "2025-12-10T12:00:00Z",
        "lastTriggered": "2025-12-10T14:30:00Z"
      }
    ],
    "total": 1
  }
}
```

---

### 4.3 알림 설정 수정

**엔드포인트:** `PUT /alerts/{alertId}`

**설명:** 기존 알림 설정을 수정합니다.

**경로 파라미터:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| alertId | string | 예 | 알림 ID |

**요청 본문:** (생성과 동일)

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "id": "alert_123456",
    "symbol": "TSLA",
    "symbolName": "Tesla, Inc.",
    "conditions": [
      {
        "id": "cond_1",
        "type": "price",
        "operator": ">=",
        "value": 260
      }
    ],
    "timeUnit": "5min",
    "enabled": true,
    "browserPush": true,
    "sound": true,
    "vibration": false,
    "createdAt": "2025-12-10T12:00:00Z",
    "updatedAt": "2025-12-10T15:00:00Z"
  }
}
```

---

### 4.4 알림 설정 삭제

**엔드포인트:** `DELETE /alerts/{alertId}`

**설명:** 알림 설정을 삭제합니다.

**경로 파라미터:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| alertId | string | 예 | 알림 ID |

**응답 예시:**
```json
{
  "success": true,
  "message": "알림 설정이 삭제되었습니다."
}
```

---

### 4.5 알림 히스토리 조회

**엔드포인트:** `GET /alerts/history`

**설명:** 알림 발송 이력을 조회합니다.

**쿼리 파라미터:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| limit | number | 아니오 | 최대 반환 개수 (기본값: 10) |
| alertId | string | 아니오 | 특정 알림 ID 필터 |

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "history_789",
        "alertId": "alert_123456",
        "symbol": "TSLA",
        "message": "TSLA 가격이 $250 이상으로 상승했습니다.",
        "triggeredAt": "2025-12-10T14:30:00Z",
        "conditionMet": {
          "id": "cond_1",
          "type": "price",
          "operator": ">=",
          "value": 250
        }
      }
    ],
    "total": 10
  }
}
```

---

## 5. 사용자 설정

### 5.1 관심 종목 추가

**엔드포인트:** `POST /favorites`

**설명:** 관심 종목을 추가합니다.

**요청 본문:**
```json
{
  "symbol": "TSLA",
  "name": "Tesla, Inc."
}
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "id": "TSLA",
    "name": "Tesla, Inc.",
    "addedAt": "2025-12-10T12:00:00Z",
    "order": 1,
    "group": "기본"
  }
}
```

---

### 5.2 관심 종목 목록 조회

**엔드포인트:** `GET /favorites`

**설명:** 사용자의 관심 종목 목록을 조회합니다.

**쿼리 파라미터:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| sortBy | string | 아니오 | 정렬 기준 ("order", "name", "changePercent", "volume") |

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "favorites": [
      {
        "id": "TSLA",
        "name": "Tesla, Inc.",
        "addedAt": "2025-12-10T12:00:00Z",
        "order": 1,
        "group": "기본"
      }
    ],
    "settings": {
      "sortBy": "order",
      "maxItems": 50
    }
  }
}
```

---

### 5.3 관심 종목 삭제

**엔드포인트:** `DELETE /favorites/{symbol}`

**설명:** 관심 종목을 삭제합니다.

**경로 파라미터:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| symbol | string | 예 | 종목 코드 |

**응답 예시:**
```json
{
  "success": true,
  "message": "관심 종목에서 제거되었습니다."
}
```

---

## 6. 에러 처리

### 6.1 에러 응답 형식
모든 에러 응답은 다음 형식을 따릅니다:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지",
    "details": {}
  }
}
```

### 6.2 에러 코드 목록

| 코드 | HTTP 상태 | 설명 |
|------|-----------|------|
| `INVALID_API_KEY` | 401 | 유효하지 않은 API 키 |
| `UNAUTHORIZED` | 401 | 인증 실패 |
| `NOT_FOUND` | 404 | 리소스를 찾을 수 없음 |
| `VALIDATION_ERROR` | 400 | 요청 데이터 검증 실패 |
| `RATE_LIMIT_EXCEEDED` | 429 | 요청 한도 초과 |
| `INTERNAL_SERVER_ERROR` | 500 | 서버 내부 오류 |

### 6.3 에러 응답 예시

**404 Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "종목을 찾을 수 없습니다.",
    "details": {
      "symbol": "INVALID"
    }
  }
}
```

**400 Validation Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "요청 데이터가 유효하지 않습니다.",
    "details": {
      "field": "conditions",
      "reason": "최소 1개 이상의 조건이 필요합니다."
    }
  }
}
```

---

## 부록

### A. Rate Limiting
- 기본: 분당 100회 요청
- 인증된 사용자: 분당 1000회 요청

### B. 데이터 형식
- 날짜: ISO 8601 형식 (YYYY-MM-DD 또는 YYYY-MM-DDTHH:mm:ssZ)
- 숫자: JSON number 타입
- 통화: USD 기준, 소수점 2자리

### C. 참고 자료
- [서비스 기획서](./서비스-기획서.md)
- [화제 종목 수집 방법](./화제-종목-수집-방법.md)

---

**문서 버전 관리**
- v1.0 (2025-12-11): 초안 작성

