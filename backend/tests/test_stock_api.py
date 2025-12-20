"""
Stock API Integration Tests

Tests for all stock-related API endpoints:
- GET /api/stocks/trending
- GET /api/stocks/trending/top
- GET /api/stocks/{ticker}
- GET /api/stocks/{ticker}/chart
- POST /api/stocks/compare
- POST /api/stocks/cache/clear
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from httpx import AsyncClient
import pandas as pd

from models.stock import (
    ScreenerType, StockDetail, ScoreBreakdown, WhyHotItem,
    HotStockResponse, TopNStocksResponse, RankedStock
)


class TestTrendingStockAPI:
    """Test cases for GET /api/stocks/trending endpoint."""

    def test_get_trending_stock_success(self, test_client, mock_screener_result):
        """Should return trending stock with valid response structure."""
        with patch('api.stock.cache') as mock_cache, \
             patch('api.stock.hot_stock_screener') as mock_screener:

            mock_cache.get.return_value = None
            mock_screener.get_daily_hot_stock.return_value = mock_screener_result

            response = test_client.get("/api/stocks/trending")

            assert response.status_code == 200
            data = response.json()
            assert "stock" in data
            assert "score" in data
            assert "why_hot" in data
            assert data["stock"]["symbol"] == "NVDA"

    def test_get_trending_stock_with_cache_hit(self, test_client):
        """Should return cached data when available."""
        cached_response = {
            "stock": {
                "symbol": "CACHED",
                "name": "Cached Stock",
                "price": 100.0,
                "change": 1.0,
                "change_percent": 1.0,
                "volume": 1000000,
                "currency": "USD"
            },
            "score": {
                "volume_score": 5,
                "price_change_score": 5,
                "momentum_score": 5,
                "market_cap_score": 5,
                "total": 20
            },
            "why_hot": [],
            "news": []
        }

        with patch('api.stock.cache') as mock_cache:
            mock_cache.get.return_value = cached_response

            response = test_client.get("/api/stocks/trending")

            assert response.status_code == 200
            data = response.json()
            assert data["stock"]["symbol"] == "CACHED"

    def test_get_trending_stock_with_screener_type(self, test_client, mock_screener_result):
        """Should accept different screener types."""
        with patch('api.stock.cache') as mock_cache, \
             patch('api.stock.hot_stock_screener') as mock_screener:

            mock_cache.get.return_value = None
            mock_screener.get_daily_hot_stock.return_value = mock_screener_result

            # Test with day_gainers
            response = test_client.get("/api/stocks/trending?type=day_gainers")
            assert response.status_code == 200

            # Test with day_losers
            response = test_client.get("/api/stocks/trending?type=day_losers")
            assert response.status_code == 200

    def test_get_trending_stock_invalid_type(self, test_client):
        """Should return 422 for invalid screener type."""
        response = test_client.get("/api/stocks/trending?type=invalid_type")
        assert response.status_code == 422

    def test_get_trending_stock_service_error(self, test_client):
        """Should return 500 when screener service fails."""
        from services.screener_service import ScreenerServiceError

        with patch('api.stock.cache') as mock_cache, \
             patch('api.stock.hot_stock_screener') as mock_screener:

            mock_cache.get.return_value = None
            mock_screener.get_daily_hot_stock.side_effect = ScreenerServiceError("Service unavailable")

            response = test_client.get("/api/stocks/trending")

            assert response.status_code == 500
            assert "Service unavailable" in response.json()["detail"]


class TestTopNStocksAPI:
    """Test cases for GET /api/stocks/trending/top endpoint."""

    def test_get_top_n_stocks_default(self, test_client):
        """Should return top 5 stocks by default."""
        mock_response = TopNStocksResponse(
            screener_type=ScreenerType.MOST_ACTIVES,
            count=5,
            stocks=[
                RankedStock(
                    rank=i,
                    stock=StockDetail(
                        symbol=f"STOCK{i}",
                        name=f"Stock {i}",
                        price=100.0 + i,
                        change=1.0,
                        change_percent=1.0,
                        volume=1000000,
                        currency="USD"
                    ),
                    score=ScoreBreakdown(total=30 - i)
                )
                for i in range(1, 6)
            ]
        )

        with patch('api.stock.cache') as mock_cache, \
             patch('api.stock.hot_stock_screener') as mock_screener:

            mock_cache.get.return_value = None
            mock_screener.get_top_n_stocks.return_value = mock_response

            response = test_client.get("/api/stocks/trending/top")

            assert response.status_code == 200
            data = response.json()
            assert data["count"] == 5
            assert len(data["stocks"]) == 5

    def test_get_top_n_stocks_custom_count(self, test_client):
        """Should respect count parameter."""
        mock_response = TopNStocksResponse(
            screener_type=ScreenerType.MOST_ACTIVES,
            count=3,
            stocks=[
                RankedStock(
                    rank=i,
                    stock=StockDetail(
                        symbol=f"STOCK{i}",
                        name=f"Stock {i}",
                        price=100.0,
                        change=1.0,
                        change_percent=1.0,
                        volume=1000000,
                        currency="USD"
                    ),
                    score=ScoreBreakdown(total=30)
                )
                for i in range(1, 4)
            ]
        )

        with patch('api.stock.cache') as mock_cache, \
             patch('api.stock.hot_stock_screener') as mock_screener:

            mock_cache.get.return_value = None
            mock_screener.get_top_n_stocks.return_value = mock_response

            response = test_client.get("/api/stocks/trending/top?count=3")

            assert response.status_code == 200
            data = response.json()
            assert data["count"] == 3

    def test_get_top_n_stocks_invalid_count(self, test_client):
        """Should reject count outside valid range (1-10)."""
        # Count too small
        response = test_client.get("/api/stocks/trending/top?count=0")
        assert response.status_code == 422

        # Count too large
        response = test_client.get("/api/stocks/trending/top?count=11")
        assert response.status_code == 422

    def test_get_top_n_stocks_cached(self, test_client):
        """Should return cached response when available."""
        cached_data = {
            "screener_type": "most_actives",
            "count": 3,
            "stocks": [
                {
                    "rank": 1,
                    "stock": {
                        "symbol": "CACHED1",
                        "name": "Cached Stock 1",
                        "price": 100.0,
                        "change": 1.0,
                        "change_percent": 1.0,
                        "volume": 1000000,
                        "currency": "USD"
                    },
                    "score": {"total": 30}
                }
            ]
        }

        with patch('api.stock.cache') as mock_cache:
            mock_cache.get.return_value = cached_data

            response = test_client.get("/api/stocks/trending/top?count=3")

            assert response.status_code == 200
            data = response.json()
            assert data["stocks"][0]["stock"]["symbol"] == "CACHED1"


class TestStockDetailAPI:
    """Test cases for GET /api/stocks/{ticker} endpoint."""

    def test_get_stock_detail_success(self, test_client, mock_yahoo_ticker):
        """Should return stock detail for valid ticker."""
        with patch('api.stock.cache') as mock_cache, \
             patch('yahooquery.Ticker', return_value=mock_yahoo_ticker):

            mock_cache.get.return_value = None

            response = test_client.get("/api/stocks/AAPL")

            assert response.status_code == 200
            data = response.json()
            assert data["stock"]["symbol"] == "AAPL"
            assert data["stock"]["name"] == "Apple Inc."
            assert "news" in data

    def test_get_stock_detail_lowercase_ticker(self, test_client, mock_yahoo_ticker):
        """Should normalize ticker to uppercase."""
        with patch('api.stock.cache') as mock_cache, \
             patch('yahooquery.Ticker', return_value=mock_yahoo_ticker):

            mock_cache.get.return_value = None

            response = test_client.get("/api/stocks/aapl")

            assert response.status_code == 200
            data = response.json()
            assert data["stock"]["symbol"] == "AAPL"

    def test_get_stock_detail_not_found(self, test_client):
        """Should return 404 for invalid ticker."""
        mock_ticker = MagicMock()
        mock_ticker.price = {"INVALID": "No data found"}
        mock_ticker.summary_detail = {"INVALID": {}}

        with patch('api.stock.cache') as mock_cache, \
             patch('yahooquery.Ticker', return_value=mock_ticker):

            mock_cache.get.return_value = None

            response = test_client.get("/api/stocks/INVALID")

            assert response.status_code == 404
            assert "INVALID" in response.json()["detail"]

    def test_get_stock_detail_cached(self, test_client):
        """Should return cached data when available."""
        cached_data = {
            "stock": {
                "symbol": "CACHED",
                "name": "Cached",
                "price": 200.0,
                "change": 2.0,
                "change_percent": 1.0,
                "volume": 5000000,
                "currency": "USD"
            },
            "news": []
        }

        with patch('api.stock.cache') as mock_cache:
            mock_cache.get.return_value = cached_data

            response = test_client.get("/api/stocks/CACHED")

            assert response.status_code == 200
            data = response.json()
            assert data["stock"]["symbol"] == "CACHED"


class TestStockChartAPI:
    """Test cases for GET /api/stocks/{ticker}/chart endpoint."""

    def test_get_chart_default_period(self, test_client, mock_yahoo_ticker):
        """Should return 5d chart data by default."""
        with patch('api.stock.cache') as mock_cache, \
             patch('yahooquery.Ticker', return_value=mock_yahoo_ticker):

            mock_cache.get.return_value = None

            response = test_client.get("/api/stocks/AAPL/chart")

            assert response.status_code == 200
            data = response.json()
            assert data["symbol"] == "AAPL"
            assert data["period"] == "5d"
            assert len(data["data"]) > 0
            assert "date" in data["data"][0]
            assert "close" in data["data"][0]

    def test_get_chart_custom_period(self, test_client, mock_yahoo_ticker):
        """Should accept custom period parameter."""
        with patch('api.stock.cache') as mock_cache, \
             patch('yahooquery.Ticker', return_value=mock_yahoo_ticker):

            mock_cache.get.return_value = None

            # Test various periods
            for period in ["5d", "1mo", "3mo", "6mo", "1y"]:
                response = test_client.get(f"/api/stocks/AAPL/chart?period={period}")
                assert response.status_code == 200
                assert response.json()["period"] == period

    def test_get_chart_invalid_ticker(self, test_client):
        """Should return 404 for invalid ticker."""
        mock_ticker = MagicMock()
        mock_ticker.price = {"INVALID": "No data found"}

        with patch('api.stock.cache') as mock_cache, \
             patch('yahooquery.Ticker', return_value=mock_ticker):

            mock_cache.get.return_value = None

            response = test_client.get("/api/stocks/INVALID/chart")

            assert response.status_code == 404

    def test_get_chart_cached(self, test_client):
        """Should return cached chart data."""
        cached_data = {
            "symbol": "AAPL",
            "name": "Apple Inc.",
            "period": "5d",
            "data": [
                {"date": "2024-01-01", "open": 170.0, "high": 175.0, "low": 168.0, "close": 173.0, "volume": 50000000}
            ]
        }

        with patch('api.stock.cache') as mock_cache:
            mock_cache.get.return_value = cached_data

            response = test_client.get("/api/stocks/AAPL/chart")

            assert response.status_code == 200
            data = response.json()
            assert len(data["data"]) == 1


class TestCompareStocksAPI:
    """Test cases for POST /api/stocks/compare endpoint."""

    def test_compare_stocks_success(self, test_client):
        """Should compare multiple stocks successfully."""
        mock_ticker = MagicMock()
        mock_ticker.price = {
            "AAPL": {
                "shortName": "Apple Inc.",
                "regularMarketPrice": 175.0,
                "regularMarketChange": 2.0,
                "regularMarketChangePercent": 0.0115,
                "regularMarketVolume": 50000000,
                "marketCap": 2800000000000
            },
            "GOOGL": {
                "shortName": "Alphabet Inc.",
                "regularMarketPrice": 140.0,
                "regularMarketChange": 1.5,
                "regularMarketChangePercent": 0.0108,
                "regularMarketVolume": 25000000,
                "marketCap": 1800000000000
            }
        }
        mock_ticker.summary_detail = {
            "AAPL": {"trailingPE": 28.5},
            "GOOGL": {"trailingPE": 25.0}
        }

        with patch('yahooquery.Ticker', return_value=mock_ticker):
            response = test_client.post(
                "/api/stocks/compare",
                json={"tickers": ["AAPL", "GOOGL"]}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["count"] == 2
            assert len(data["stocks"]) == 2
            assert "rankings" in data

    def test_compare_stocks_too_few(self, test_client):
        """Should require at least 2 stocks."""
        response = test_client.post(
            "/api/stocks/compare",
            json={"tickers": ["AAPL"]}
        )

        assert response.status_code == 400
        assert "2" in response.json()["detail"]

    def test_compare_stocks_too_many(self, test_client):
        """Should limit to maximum 5 stocks."""
        response = test_client.post(
            "/api/stocks/compare",
            json={"tickers": ["AAPL", "GOOGL", "MSFT", "AMZN", "META", "NVDA"]}
        )

        assert response.status_code == 400
        assert "5" in response.json()["detail"]

    def test_compare_stocks_duplicates_removed(self, test_client):
        """Should remove duplicate tickers."""
        mock_ticker = MagicMock()
        mock_ticker.price = {
            "AAPL": {
                "shortName": "Apple Inc.",
                "regularMarketPrice": 175.0,
                "regularMarketChange": 2.0,
                "regularMarketChangePercent": 0.0115,
                "regularMarketVolume": 50000000,
                "marketCap": 2800000000000
            },
            "GOOGL": {
                "shortName": "Alphabet Inc.",
                "regularMarketPrice": 140.0,
                "regularMarketChange": 1.5,
                "regularMarketChangePercent": 0.0108,
                "regularMarketVolume": 25000000,
                "marketCap": 1800000000000
            }
        }
        mock_ticker.summary_detail = {
            "AAPL": {},
            "GOOGL": {}
        }

        with patch('yahooquery.Ticker', return_value=mock_ticker):
            response = test_client.post(
                "/api/stocks/compare",
                json={"tickers": ["AAPL", "AAPL", "GOOGL"]}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["count"] == 2


class TestCacheClearAPI:
    """Test cases for POST /api/stocks/cache/clear endpoint."""

    def test_clear_cache_success(self, test_client):
        """Should clear cache successfully."""
        with patch('api.stock.cache') as mock_cache:
            mock_cache.clear = MagicMock()

            response = test_client.post("/api/stocks/cache/clear")

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
            mock_cache.clear.assert_called_once()
