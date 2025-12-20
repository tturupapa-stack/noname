"""
Pytest Configuration and Fixtures

This module contains shared fixtures for all backend tests.
"""

import pytest
import asyncio
from typing import AsyncGenerator, Generator
from unittest.mock import MagicMock, AsyncMock, patch

from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport

# Import the FastAPI app
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_cache():
    """Mock cache for testing without actual cache dependency."""
    cache = MagicMock()
    cache.get = MagicMock(return_value=None)
    cache.set = MagicMock()
    cache.clear = MagicMock()
    return cache


@pytest.fixture
def mock_yahoo_ticker():
    """Mock yahooquery Ticker for testing without actual API calls."""
    mock_ticker = MagicMock()

    # Mock price data
    mock_ticker.price = {
        "AAPL": {
            "shortName": "Apple Inc.",
            "longName": "Apple Inc.",
            "regularMarketPrice": 175.50,
            "regularMarketChange": 2.50,
            "regularMarketChangePercent": 0.0145,
            "regularMarketVolume": 50000000,
            "marketCap": 2800000000000,
            "currency": "USD"
        }
    }

    # Mock summary detail
    mock_ticker.summary_detail = {
        "AAPL": {
            "averageVolume": 45000000,
            "trailingPE": 28.5,
            "fiftyTwoWeekHigh": 200.00,
            "fiftyTwoWeekLow": 140.00
        }
    }

    # Mock history data
    import pandas as pd
    mock_history = pd.DataFrame({
        "open": [170.0, 172.0, 173.0, 174.0, 175.0],
        "high": [172.0, 174.0, 175.0, 176.0, 177.0],
        "low": [169.0, 171.0, 172.0, 173.0, 174.0],
        "close": [171.5, 173.0, 174.5, 175.0, 175.5],
        "volume": [45000000, 48000000, 52000000, 49000000, 50000000]
    }, index=pd.MultiIndex.from_tuples([
        ("AAPL", pd.Timestamp("2024-01-01")),
        ("AAPL", pd.Timestamp("2024-01-02")),
        ("AAPL", pd.Timestamp("2024-01-03")),
        ("AAPL", pd.Timestamp("2024-01-04")),
        ("AAPL", pd.Timestamp("2024-01-05")),
    ]))
    mock_ticker.history = MagicMock(return_value=mock_history)

    return mock_ticker


@pytest.fixture
def mock_screener_result():
    """Mock screener result for testing."""
    from models.stock import StockDetail, ScoreBreakdown, WhyHotItem, HotStockResponse

    stock = StockDetail(
        symbol="NVDA",
        name="NVIDIA Corporation",
        price=450.00,
        change=15.00,
        change_percent=3.45,
        volume=80000000,
        avg_volume=60000000,
        volume_ratio=1.33,
        market_cap=1100000000000,
        pe_ratio=65.0,
        fifty_two_week_high=500.00,
        fifty_two_week_low=200.00,
        currency="USD"
    )

    score = ScoreBreakdown(
        volume_score=8,
        price_change_score=7,
        momentum_score=9,
        market_cap_score=8,
        total=32
    )

    why_hot = [
        WhyHotItem(icon="check", message="Volume surged 1.33x above average"),
        WhyHotItem(icon="check", message="Price increased 3.45% today"),
        WhyHotItem(icon="check", message="Strong momentum in recent days")
    ]

    return HotStockResponse(
        stock=stock,
        score=score,
        why_hot=why_hot
    )


@pytest.fixture
def sample_briefing_data():
    """Sample briefing data for testing."""
    return {
        "id": "2024-01-15",
        "date": "2024-01-15",
        "created_at": "2024-01-15T09:00:00",
        "stock": {
            "symbol": "TSLA",
            "name": "Tesla, Inc.",
            "price": 220.00,
            "change": 5.50,
            "change_percent": 2.56,
            "volume": 100000000,
            "market_cap": 700000000000,
            "currency": "USD"
        },
        "score": {
            "volume_score": 8,
            "price_change_score": 6,
            "momentum_score": 7,
            "market_cap_score": 9,
            "total": 30
        },
        "why_hot": [
            {"icon": "check", "message": "High trading volume"},
            {"icon": "check", "message": "Significant price movement"}
        ],
        "news": []
    }


@pytest.fixture
def mock_rate_limit_settings():
    """Mock rate limit settings for testing."""
    settings = MagicMock()
    settings.rate_limit_enabled = True
    settings.rate_limit_requests = 10
    settings.rate_limit_window_seconds = 60
    settings.rate_limit_exclude_paths = "/health,/"
    settings.rate_limit_include_headers = True
    settings.rate_limit_use_redis = False
    return settings


# Skip the lifespan for testing
@pytest.fixture
def app_without_lifespan():
    """Create app without lifespan for simpler testing."""
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from api.stock import router as stock_router
    from api.briefing import router as briefing_router

    test_app = FastAPI(title="Test API")

    test_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    test_app.include_router(stock_router)
    test_app.include_router(briefing_router)

    @test_app.get("/")
    async def root():
        return {"message": "Test API", "status": "running"}

    @test_app.get("/health")
    async def health():
        return {"status": "healthy"}

    return test_app


@pytest.fixture
def test_client(app_without_lifespan) -> TestClient:
    """Create a test client for synchronous testing."""
    return TestClient(app_without_lifespan)


@pytest.fixture
async def async_client(app_without_lifespan) -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client for async testing."""
    transport = ASGITransport(app=app_without_lifespan)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
