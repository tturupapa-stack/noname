# 클로드 코드에서 MCP 스킬 사용하기

다음 프롬프트를 클로드 코드에 입력하세요:

---

## 프롬프트

```
"당신이 잠든 사이" 프로젝트에 MCP (Model Context Protocol) 스킬을 추가했습니다. 
이 스킬은 화제 종목의 최신 뉴스를 수집하고, Claude LLM이 뉴스를 요약하며 종목 그래프를 참고해서 해석한 브리핑을 생성합니다.

프로젝트 구조:
- mcp-server/server.py: MCP 서버 메인 파일
- mcp-server/services/llm_service.py: Anthropic Claude API 통합
- mcp-server/services/chart_service.py: 차트 데이터 수집
- 2주차 과제/claude_desktop_config.json: Claude Desktop 설정 (참고용)

현재 프로젝트 루트에 .env 파일이 있고 다음 환경 변수가 설정되어 있습니다:
- ANTHROPIC_API_KEY
- EXA_API_KEY

클로드 코드에서 이 MCP 스킬을 사용할 수 있도록 설정해주세요. 
MCP 서버는 stdio transport를 사용하며, Python으로 실행됩니다.

필요한 작업:
1. 클로드 코드의 MCP 설정 파일 위치 확인
2. mcp-server/server.py를 MCP 서버로 등록
3. 환경 변수가 올바르게 전달되는지 확인
4. 테스트를 위한 간단한 사용 예시 제공

클로드 코드에서 MCP 서버를 설정하는 방법을 알려주세요.
```

---

## 추가 정보

### MCP 서버 실행 경로
```
/Users/larkkim/while-you-were-sleeping-dashboard/mcp-server/server.py
```

### 필요한 환경 변수
- `ANTHROPIC_API_KEY`: Anthropic Claude API 키
- `EXA_API_KEY`: Exa 뉴스 API 키

### 사용 가능한 툴
- `generate_briefing`: 브리핑 생성
  - 파라미터:
    - `ticker` (선택): 종목 심볼 (예: "TSLA", "AAPL"). 비어있으면 자동 선정
    - `news_count` (선택): 뉴스 개수 (기본값: 3, 최소: 1, 최대: 10)

### 사용 예시
```
@generate_briefing ticker="TSLA" news_count=3
```

또는

```
@generate_briefing  # 자동으로 화제 종목 선정
```

