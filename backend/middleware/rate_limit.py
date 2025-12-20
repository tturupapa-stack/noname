"""
Rate Limit 미들웨어

모든 요청에 대해 Rate Limit을 체크하고,
초과 시 429 응답을 반환합니다.
"""

import logging
from datetime import datetime, timezone
from typing import Callable, List

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from services.rate_limit_service import rate_limit_service, RateLimitResult
from config import rate_limit_settings

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate Limit 미들웨어"""

    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self._exclude_paths: List[str] = self._parse_exclude_paths()

    def _parse_exclude_paths(self) -> List[str]:
        """제외 경로 파싱"""
        paths_str = rate_limit_settings.rate_limit_exclude_paths
        return [p.strip() for p in paths_str.split(",") if p.strip()]

    def _is_excluded(self, path: str) -> bool:
        """제외 경로 여부 확인"""
        for exclude in self._exclude_paths:
            if path == exclude or path.startswith(exclude + "/"):
                return True
        return False

    def _get_client_ip(self, request: Request) -> str:
        """클라이언트 IP 추출 (프록시 고려)"""
        # X-Forwarded-For 헤더 확인 (프록시/로드밸런서)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # 첫 번째 IP가 실제 클라이언트
            return forwarded_for.split(",")[0].strip()

        # X-Real-IP 헤더 확인
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()

        # 직접 연결된 클라이언트 IP
        if request.client:
            return request.client.host

        return "unknown"

    def _add_rate_limit_headers(
        self,
        response: Response,
        result: RateLimitResult
    ):
        """Rate Limit 헤더 추가"""
        if not rate_limit_settings.rate_limit_include_headers:
            return

        response.headers["X-RateLimit-Limit"] = str(result.limit)
        response.headers["X-RateLimit-Remaining"] = str(result.remaining)
        response.headers["X-RateLimit-Reset"] = str(int(result.reset_at))

        if result.retry_after:
            response.headers["Retry-After"] = str(result.retry_after)

    async def dispatch(
        self,
        request: Request,
        call_next: Callable
    ) -> Response:
        """요청 처리"""
        # Rate Limit 비활성화 시 바이패스
        if not rate_limit_settings.rate_limit_enabled:
            return await call_next(request)

        # 제외 경로 체크
        path = request.url.path
        if self._is_excluded(path):
            return await call_next(request)

        # 클라이언트 식별자 추출
        identifier = self._get_client_ip(request)

        try:
            # Rate Limit 체크
            result = await rate_limit_service.check(identifier)

            if not result.allowed:
                # 429 Too Many Requests 응답
                reset_dt = datetime.fromtimestamp(result.reset_at, tz=timezone.utc)
                response = JSONResponse(
                    status_code=429,
                    content={
                        "error": "rate_limit_exceeded",
                        "message": "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
                        "retry_after": result.retry_after,
                        "limit": result.limit,
                        "remaining": 0,
                        "reset_at": reset_dt.isoformat()
                    }
                )
                self._add_rate_limit_headers(response, result)
                logger.warning(
                    f"Rate limit exceeded: {identifier} - "
                    f"path={path}, retry_after={result.retry_after}s"
                )
                return response

            # 정상 요청 처리
            response = await call_next(request)
            self._add_rate_limit_headers(response, result)
            return response

        except Exception as e:
            # Rate Limit 체크 실패 시 요청 허용 (fail-open)
            logger.error(f"Rate limit check failed: {e}")
            return await call_next(request)
