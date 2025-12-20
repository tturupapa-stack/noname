"""
Error Handling Tests

Tests for error handling across all API endpoints:
- HTTP error responses (4xx, 5xx)
- Validation errors
- External service failures
- Graceful degradation
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import pandas as pd

from services.screener_service import ScreenerServiceError
from services.news_service import NewsServiceError


class TestHTTPErrorResponses:
    """Test HTTP error response handling."""

    def test_404_stock_not_found(self, test_client):
        """Should return 404 for non-existent stock."""
        mock_ticker = MagicMock()
        mock_ticker.price = {"INVALID": "No data found"}
        mock_ticker.summary_detail = {"INVALID": {}}

        with patch('api.stock.cache') as mock_cache, \
             patch('yahooquery.Ticker', return_value=mock_ticker):

            mock_cache.get.return_value = None

            response = test_client.get("/api/stocks/INVALIDTICKER123")

            assert response.status_code == 404
            data = response.json()
            assert "detail" in data

    def test_404_briefing_not_found(self, test_client):
        """Should return 404 for non-existent briefing date."""
        with patch('api.briefing.briefing_storage') as mock_storage:
            mock_storage.get_briefing_by_date.return_value = None

            response = test_client.get("/api/briefings/2099-12-31")

            assert response.status_code == 404
            data = response.json()
            assert "2099-12-31" in data["detail"]

    def test_404_chart_not_found(self, test_client):
        """Should return 404 when chart data unavailable."""
        mock_ticker = MagicMock()
        mock_ticker.price = {"INVALID": "No data found"}
        mock_ticker.history = MagicMock(return_value=pd.DataFrame())

        with patch('api.stock.cache') as mock_cache, \
             patch('yahooquery.Ticker', return_value=mock_ticker):

            mock_cache.get.return_value = None

            response = test_client.get("/api/stocks/INVALID/chart")

            assert response.status_code == 404

    def test_422_validation_error_invalid_screener_type(self, test_client):
        """Should return 422 for invalid screener type."""
        response = test_client.get("/api/stocks/trending?type=invalid_type")

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_422_validation_error_invalid_pagination(self, test_client):
        """Should return 422 for invalid pagination parameters."""
        # Invalid page
        response = test_client.get("/api/briefings?page=-1")
        assert response.status_code == 422

        # Invalid limit
        response = test_client.get("/api/briefings?limit=100")
        assert response.status_code == 422

    def test_422_validation_error_invalid_count(self, test_client):
        """Should return 422 for invalid count parameter."""
        response = test_client.get("/api/stocks/trending/top?count=0")
        assert response.status_code == 422

        response = test_client.get("/api/stocks/trending/top?count=20")
        assert response.status_code == 422

    def test_400_compare_too_few_stocks(self, test_client):
        """Should return 400 when comparing less than 2 stocks."""
        response = test_client.post(
            "/api/stocks/compare",
            json={"tickers": ["AAPL"]}
        )

        assert response.status_code == 400
        assert "2" in response.json()["detail"]

    def test_400_compare_too_many_stocks(self, test_client):
        """Should return 400 when comparing more than 5 stocks."""
        response = test_client.post(
            "/api/stocks/compare",
            json={"tickers": ["A", "B", "C", "D", "E", "F"]}
        )

        assert response.status_code == 400
        assert "5" in response.json()["detail"]


class TestExternalServiceFailures:
    """Test handling of external service failures."""

    def test_screener_service_failure(self, test_client):
        """Should return 500 when screener service fails."""
        with patch('api.stock.cache') as mock_cache, \
             patch('api.stock.hot_stock_screener') as mock_screener:

            mock_cache.get.return_value = None
            mock_screener.get_daily_hot_stock.side_effect = ScreenerServiceError(
                "Yahoo Finance API unavailable"
            )

            response = test_client.get("/api/stocks/trending")

            assert response.status_code == 500
            assert "Yahoo Finance" in response.json()["detail"] or "unavailable" in response.json()["detail"].lower()

    def test_screener_unexpected_error(self, test_client):
        """Should return 500 for unexpected screener errors."""
        with patch('api.stock.cache') as mock_cache, \
             patch('api.stock.hot_stock_screener') as mock_screener:

            mock_cache.get.return_value = None
            mock_screener.get_daily_hot_stock.side_effect = RuntimeError("Unexpected error")

            response = test_client.get("/api/stocks/trending")

            assert response.status_code == 500

    def test_briefing_storage_failure(self, test_client):
        """Should return 500 when briefing storage fails."""
        with patch('api.briefing.briefing_storage') as mock_storage:
            mock_storage.get_briefings.side_effect = IOError("File system error")

            response = test_client.get("/api/briefings")

            assert response.status_code == 500


class TestNewsServiceFailure:
    """Test handling of news service failures."""

    def test_news_service_failure_graceful(self, test_client, mock_screener_result):
        """Should return stock data even when news service fails."""
        with patch('api.stock.cache') as mock_cache, \
             patch('api.stock.hot_stock_screener') as mock_screener, \
             patch('api.stock.get_news_service') as mock_news_factory:

            mock_cache.get.return_value = None
            mock_screener.get_daily_hot_stock.return_value = mock_screener_result
            mock_news_factory.side_effect = NewsServiceError("News API unavailable")

            response = test_client.get("/api/stocks/trending")

            # Should still return 200 with stock data
            assert response.status_code == 200
            data = response.json()
            assert data["stock"]["symbol"] == "NVDA"
            assert data["news"] == []  # Empty news due to failure

    def test_stock_detail_news_failure_graceful(self, test_client, mock_yahoo_ticker):
        """Should return stock detail even when news fails."""
        with patch('api.stock.cache') as mock_cache, \
             patch('yahooquery.Ticker', return_value=mock_yahoo_ticker), \
             patch('api.stock.get_news_service') as mock_news_factory:

            mock_cache.get.return_value = None
            mock_news_factory.side_effect = Exception("News error")

            response = test_client.get("/api/stocks/AAPL")

            assert response.status_code == 200
            data = response.json()
            assert data["stock"]["symbol"] == "AAPL"
            assert data["news"] == []


class TestValidationErrors:
    """Test input validation error handling."""

    def test_empty_compare_tickers(self, test_client):
        """Should handle empty tickers list."""
        response = test_client.post(
            "/api/stocks/compare",
            json={"tickers": []}
        )

        assert response.status_code == 400

    def test_compare_with_whitespace_tickers(self, test_client):
        """Should handle tickers with whitespace."""
        mock_ticker = MagicMock()
        mock_ticker.price = {
            "AAPL": {
                "shortName": "Apple",
                "regularMarketPrice": 175.0,
                "regularMarketChange": 2.0,
                "regularMarketChangePercent": 0.0115,
                "regularMarketVolume": 50000000,
                "marketCap": 2800000000000
            },
            "GOOGL": {
                "shortName": "Google",
                "regularMarketPrice": 140.0,
                "regularMarketChange": 1.5,
                "regularMarketChangePercent": 0.0108,
                "regularMarketVolume": 25000000,
                "marketCap": 1800000000000
            }
        }
        mock_ticker.summary_detail = {"AAPL": {}, "GOOGL": {}}

        with patch('yahooquery.Ticker', return_value=mock_ticker):
            response = test_client.post(
                "/api/stocks/compare",
                json={"tickers": ["  AAPL  ", "  GOOGL  "]}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["count"] == 2

    def test_compare_with_invalid_tickers(self, test_client):
        """Should handle invalid tickers gracefully."""
        mock_ticker = MagicMock()
        mock_ticker.price = {
            "INVALID1": "No data found",
            "INVALID2": "No data found"
        }
        mock_ticker.summary_detail = {}

        with patch('yahooquery.Ticker', return_value=mock_ticker):
            response = test_client.post(
                "/api/stocks/compare",
                json={"tickers": ["INVALID1", "INVALID2"]}
            )

            assert response.status_code == 400
            assert "2" in response.json()["detail"]


class TestGracefulDegradation:
    """Test graceful degradation scenarios."""

    def test_partial_data_returned(self, test_client, mock_yahoo_ticker):
        """Should return partial data when some fields are missing."""
        mock_ticker = MagicMock()
        mock_ticker.price = {
            "AAPL": {
                "shortName": "Apple Inc.",
                "regularMarketPrice": 175.0,
                "regularMarketChange": 2.0,
                "regularMarketChangePercent": 0.0115,
                "regularMarketVolume": 50000000,
                # Missing marketCap, pe_ratio, etc.
            }
        }
        mock_ticker.summary_detail = {
            "AAPL": {}  # Empty summary
        }

        with patch('api.stock.cache') as mock_cache, \
             patch('yahooquery.Ticker', return_value=mock_ticker):

            mock_cache.get.return_value = None

            response = test_client.get("/api/stocks/AAPL")

            assert response.status_code == 200
            data = response.json()
            assert data["stock"]["symbol"] == "AAPL"
            # Optional fields should be None or default
            assert data["stock"].get("market_cap") is None


class TestErrorResponseFormat:
    """Test error response format consistency."""

    def test_404_response_format(self, test_client):
        """404 responses should have consistent format."""
        with patch('api.briefing.briefing_storage') as mock_storage:
            mock_storage.get_briefing_by_date.return_value = None

            response = test_client.get("/api/briefings/2099-12-31")

            assert response.status_code == 404
            data = response.json()
            assert "detail" in data
            assert isinstance(data["detail"], str)

    def test_422_response_format(self, test_client):
        """422 responses should have consistent format."""
        response = test_client.get("/api/stocks/trending?type=invalid")

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_500_response_format(self, test_client):
        """500 responses should have consistent format."""
        with patch('api.briefing.briefing_storage') as mock_storage:
            mock_storage.get_briefings.side_effect = Exception("Internal error")

            response = test_client.get("/api/briefings")

            assert response.status_code == 500
            data = response.json()
            assert "detail" in data
