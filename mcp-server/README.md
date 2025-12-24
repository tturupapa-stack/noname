# 브리핑 생성 MCP 스킬

"당신이 잠든 사이" 서비스를 위한 Claude Desktop MCP 스킬입니다. 화제 종목 정보를 받아서 최신 뉴스를 수집하고, Claude LLM을 통해 뉴스를 요약하며 종목 그래프 데이터를 참고해 브리핑을 생성합니다.

## 기능

- **최신 뉴스 수집**: Exa API를 통해 종목별 최신 뉴스 수집 (기본 3개)
- **차트 데이터 분석**: Yahoo Finance를 통해 최근 5일 차트 데이터 수집
- **LLM 기반 요약 및 해석**: Claude 3.5 Sonnet 모델을 사용하여 뉴스 요약 및 차트 분석
- **브리핑 생성**: 종합 분석 결과를 마크다운 형식의 브리핑으로 생성

## 설치

### 1. 의존성 설치

```bash
cd mcp-server
pip install -r requirements.txt
```

### 2. 환경 변수 설정

프로젝트 루트의 `.env` 파일에 다음 환경 변수를 추가하세요:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
EXA_API_KEY=your_exa_api_key_here
```

또는 `mcp-server/.env` 파일을 생성하여 설정할 수 있습니다.

### 3. Claude Desktop 설정

`2주차 과제/claude_desktop_config.json` 파일에 다음을 추가하세요:

```json
{
  "mcpServers": {
    "briefing-generator": {
      "command": "python",
      "args": [
        "/absolute/path/to/mcp-server/server.py"
      ],
      "env": {
        "OPENAI_API_KEY": "your_openai_api_key_here",
        "EXA_API_KEY": "your_exa_api_key_here"
      }
    }
  }
}
```

**경로 설정 예시:**
- macOS/Linux: `/Users/username/while-you-were-sleeping-dashboard/mcp-server/server.py`
- Windows: `C:\\Users\\username\\while-you-were-sleeping-dashboard\\mcp-server\\server.py`

## 사용법

Claude Desktop에서 다음과 같이 사용할 수 있습니다:

```
@generate_briefing symbol="TSLA" name="Tesla, Inc." price=248.71 change=8.39 change_percent=3.49
```

뉴스 개수를 조절하려면:

```
@generate_briefing symbol="AAPL" name="Apple Inc." price=254.49 change=-1.06 change_percent=-0.41 news_count=5
```

## 파라미터

### 필수 파라미터
- `symbol`: 종목 심볼 (예: TSLA, AAPL)
- `name`: 종목명 (예: Tesla, Inc.)
- `price`: 현재 주가
- `change`: 전일 대비 변동액
- `change_percent`: 전일 대비 변동률 (%)

### 선택 파라미터
- `news_count`: 수집할 뉴스 개수 (기본값: 3, 최소: 1, 최대: 10)

## 아키텍처

```
기존 화제 종목 선정 시스템
    ↓ 종목 정보 전달
Claude Desktop / MCP Client
    ↓ MCP Protocol (stdio)
MCP Server (generate_briefing)
    ↓ 호출
├── News Service (Exa API 뉴스 수집)
├── Chart Service (Yahoo Finance 차트 데이터)
└── LLM Service (Claude API)
    ↓
브리핑 마크다운 생성
```

## 기술 스택

- **MCP SDK**: Python MCP 라이브러리
- **Anthropic Claude**: Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)
- **Yahoo Finance**: yahooquery
- **Exa API**: 뉴스 수집

## 문제 해결

### MCP 서버가 시작되지 않는 경우

1. Python 경로 확인: `which python` 또는 `where python`
2. 의존성 설치 확인: `pip list | grep mcp`
3. 환경 변수 확인: `.env` 파일이 올바른 위치에 있는지 확인

### Anthropic Claude API 오류

- `ANTHROPIC_API_KEY` 환경 변수가 올바르게 설정되었는지 확인
- API 키가 유효한지 확인
- API 사용량 제한 확인

### 뉴스 수집 실패

- `EXA_API_KEY` 환경 변수 확인
- Exa API 사용량 제한 확인

## 개발

### 로컬 테스트

MCP 서버를 직접 실행하여 테스트할 수 있습니다:

```bash
cd mcp-server
python server.py
```

stdio를 통해 MCP 프로토콜로 통신합니다.

## 라이선스

이 프로젝트는 "당신이 잠든 사이" 서비스의 일부입니다.

