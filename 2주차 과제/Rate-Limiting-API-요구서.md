# Rate Limiting API 요구서

## [기능명]
API 호출 제한 기능을 구현해줘.

## [기능 설명]

### 목적
- **외부 API 보호**: Yahoo Finance 등 외부 API 호출을 제한하여 API 할당량 초과 방지
- **서버 리소스 보호**: 과도한 요청으로 인한 서버 부하 방지 및 안정성 확보
- **공정한 사용 보장**: 특정 사용자나 IP의 과도한 요청으로 인한 다른 사용자 영향 최소화
- **비용 관리**: 외부 API 호출 비용 제어 및 예측 가능한 사용량 관리

### 사용 시나리오
1. **일반 사용자**: 정상적인 요청 패턴으로 API 사용 (예: 분당 10회 이하)
2. **과도한 요청**: 봇이나 스크립트로 인한 대량 요청 차단
3. **API 관리자**: Rate Limit 정책 설정 및 모니터링
4. **프론트엔드**: Rate Limit 초과 시 사용자에게 적절한 에러 메시지 표시

## [요구사항]

### 1. 엔드포인트

#### 1.1 Rate Limit 정책 설정
- **Method**: `POST /api/rate-limit/policies`
- **설명**: Rate Limit 정책을 생성하거나 업데이트

#### 1.2 Rate Limit 정책 조회
- **Method**: `GET /api/rate-limit/policies`
- **설명**: 현재 설정된 모든 Rate Limit 정책 조회

#### 1.3 Rate Limit 정책 삭제
- **Method**: `DELETE /api/rate-limit/policies/{policy_id}`
- **설명**: 특정 Rate Limit 정책 삭제

#### 1.4 Rate Limit 상태 조회
- **Method**: `GET /api/rate-limit/status`
- **설명**: 현재 Rate Limit 상태 및 통계 조회

#### 1.5 Rate Limit 리셋 (관리자용)
- **Method**: `POST /api/rate-limit/reset`
- **설명**: 특정 식별자(IP, API Key 등)의 Rate Limit 카운터 리셋

### 2. Request

#### 2.1 정책 생성/수정 (POST /api/rate-limit/policies)
```json
{
  "policy_id": "stock_api_default",
  "name": "주식 API 기본 제한",
  "description": "주식 조회 API 기본 제한 정책",
  "rules": [
    {
      "endpoint_pattern": "/api/stocks/*",
      "limit": 60,
      "window_seconds": 60,
      "identifier_type": "ip"
    },
    {
      "endpoint_pattern": "/api/stocks/*/chart",
      "limit": 30,
      "window_seconds": 60,
      "identifier_type": "ip"
    }
  ],
  "enabled": true
}
```

**필드 설명:**
- `policy_id`: 정책 고유 식별자 (문자열)
- `name`: 정책 이름
- `description`: 정책 설명
- `rules`: 제한 규칙 배열
  - `endpoint_pattern`: 적용할 엔드포인트 패턴 (와일드카드 지원)
  - `limit`: 허용할 최대 요청 수
  - `window_seconds`: 시간 윈도우 (초 단위)
  - `identifier_type`: 제한 기준 (`ip`, `api_key`, `user_id`)
- `enabled`: 정책 활성화 여부

#### 2.2 Rate Limit 리셋 (POST /api/rate-limit/reset)
```json
{
  "identifier": "192.168.1.1",
  "identifier_type": "ip",
  "policy_id": "stock_api_default"  // 선택사항, 없으면 모든 정책 리셋
}
```

### 3. Response

#### 3.1 정책 생성/수정 응답
```json
{
  "success": true,
  "policy": {
    "policy_id": "stock_api_default",
    "name": "주식 API 기본 제한",
    "description": "주식 조회 API 기본 제한 정책",
    "rules": [...],
    "enabled": true,
    "created_at": "2025-12-20T10:00:00Z",
    "updated_at": "2025-12-20T10:00:00Z"
  }
}
```

#### 3.2 정책 조회 응답
```json
{
  "policies": [
    {
      "policy_id": "stock_api_default",
      "name": "주식 API 기본 제한",
      "enabled": true,
      "rules": [...],
      "created_at": "2025-12-20T10:00:00Z"
    }
  ],
  "total": 1
}
```

#### 3.3 Rate Limit 상태 조회 응답
```json
{
  "status": "active",
  "statistics": {
    "total_requests": 1250,
    "blocked_requests": 45,
    "block_rate": 0.036,
    "top_blocked_ips": [
      {
        "identifier": "192.168.1.100",
        "blocked_count": 12,
        "last_blocked_at": "2025-12-20T10:30:00Z"
      }
    ]
  },
  "policies_active": 3
}
```

#### 3.4 Rate Limit 초과 시 응답 (HTTP 429)
```json
{
  "error": "rate_limit_exceeded",
  "message": "요청 한도를 초과했습니다",
  "retry_after": 45,
  "limit": 60,
  "remaining": 0,
  "reset_at": "2025-12-20T10:01:00Z"
}
```

**HTTP 헤더:**
- `X-RateLimit-Limit`: 허용된 최대 요청 수
- `X-RateLimit-Remaining`: 남은 요청 수
- `X-RateLimit-Reset`: 제한 리셋 시각 (Unix timestamp)
- `Retry-After`: 재시도 가능 시각까지 남은 시간 (초)

### 4. 추가 요구사항

#### 4.1 미들웨어 통합
- FastAPI 미들웨어로 구현하여 모든 요청에 자동 적용
- 특정 엔드포인트는 제외 가능 (예: `/health`, `/api/rate-limit/*`)

#### 4.2 Redis 기반 저장
- Rate Limit 카운터는 Redis에 저장하여 분산 환경 지원
- Redis가 없을 경우 메모리 기반 폴백 제공

#### 4.3 슬라이딩 윈도우 알고리즘
- 고정 윈도우 대신 슬라이딩 윈도우 사용으로 더 정확한 제한

#### 4.4 다중 정책 지원
- 하나의 요청에 여러 정책이 적용될 수 있음
- 가장 엄격한 정책이 우선 적용

#### 4.5 로깅
- Rate Limit 초과 시 로그 기록
- 관리자용 통계 수집

## [기술적 고려사항]

### 에러 처리
1. **Rate Limit 초과 (429)**
   - 명확한 에러 메시지와 재시도 정보 제공
   - 프론트엔드에서 사용자 친화적 메시지 표시 가능하도록 구조화

2. **Redis 연결 실패**
   - Redis 연결 실패 시 메모리 기반 폴백으로 전환
   - 로그 기록 및 모니터링 알림

3. **잘못된 정책 설정**
   - Pydantic 모델로 요청 검증
   - 유효하지 않은 정책은 400 에러 반환

4. **정책 충돌**
   - 동일한 엔드포인트에 여러 정책이 적용될 경우 가장 엄격한 정책 적용
   - 경고 로그 기록

### 유효성 검증
1. **정책 생성 시**
   - `limit` > 0
   - `window_seconds` > 0
   - `endpoint_pattern` 유효성 검증
   - `identifier_type` 허용 값 검증 (`ip`, `api_key`, `user_id`)

2. **엔드포인트 패턴**
   - 와일드카드 패턴 지원 (`*`, `**`)
   - 정규식 패턴도 지원 고려

3. **식별자 검증**
   - IP 주소 형식 검증
   - API Key 형식 검증 (선택사항)

### 성능 최적화
1. **Redis 활용**
   - Redis의 `INCR` 및 `EXPIRE` 명령어로 원자적 카운터 관리
   - 파이프라인 사용으로 네트워크 라운드트립 최소화

2. **캐싱**
   - 정책 정보는 메모리에 캐싱하여 매 요청마다 Redis 조회 방지
   - 정책 변경 시 캐시 무효화

3. **비동기 처리**
   - FastAPI의 비동기 특성 활용
   - Redis 비동기 클라이언트 사용 (`redis.asyncio`)

4. **최소한의 오버헤드**
   - Rate Limit 체크는 요청 처리 전에 빠르게 수행
   - 초과 시 즉시 응답하여 불필요한 처리 방지

5. **배치 처리**
   - 여러 엔드포인트의 Rate Limit을 한 번에 조회
   - Redis 파이프라인으로 여러 키 동시 조회

### 보안 고려사항
1. **IP 스푸핑 방지**
   - 프록시/로드밸런서 뒤에서 실제 IP 추출 (X-Forwarded-For 헤더 처리)
   - 신뢰할 수 있는 프록시 설정

2. **관리 API 보호**
   - Rate Limit 정책 설정/삭제는 인증된 관리자만 접근 가능
   - API Key 또는 JWT 토큰 기반 인증

3. **DoS 공격 완화**
   - 매우 짧은 시간 윈도우(예: 1초)에 대한 제한도 지원
   - 글로벌 Rate Limit (전체 API에 대한 제한) 지원

### 확장성
1. **분산 환경 지원**
   - Redis를 통한 다중 서버 간 Rate Limit 공유
   - 서버별 로컬 캐시와 Redis 조합

2. **동적 정책 업데이트**
   - 정책 변경 시 서버 재시작 없이 적용
   - 핫 리로드 지원

3. **모니터링 및 알림**
   - Rate Limit 초과 빈도 모니터링
   - 임계값 초과 시 알림 (선택사항)

## 구현 파일 구조

```
backend/
├── api/
│   └── rate_limit.py          # Rate Limit 관리 API
├── middleware/
│   └── rate_limit_middleware.py  # Rate Limit 미들웨어
├── services/
│   └── rate_limit_service.py  # Rate Limit 비즈니스 로직
├── models/
│   └── rate_limit.py          # Pydantic 모델
└── config.py                   # Rate Limit 설정 추가
```

## 참고 구현 패턴

- **슬라이딩 윈도우**: Redis Sorted Set 또는 Lua 스크립트 사용
- **토큰 버킷**: Redis를 이용한 토큰 버킷 알고리즘 구현
- **고정 윈도우**: Redis INCR + EXPIRE 조합

## 우선순위

1. **Phase 1**: 기본 Rate Limit 미들웨어 (IP 기반, 고정 윈도우)
2. **Phase 2**: 정책 관리 API 및 동적 정책 적용
3. **Phase 3**: 슬라이딩 윈도우 및 고급 기능
4. **Phase 4**: 모니터링 및 통계 대시보드
