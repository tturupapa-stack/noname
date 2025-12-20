"""
Briefing API Integration Tests

Tests for all briefing-related API endpoints:
- GET /api/briefings
- GET /api/briefings/{date}
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from datetime import datetime

from models.briefing import Briefing, BriefingListResponse, BriefingResponse
from models.stock import StockDetail, ScoreBreakdown, WhyHotItem


class TestBriefingListAPI:
    """Test cases for GET /api/briefings endpoint."""

    def test_get_briefings_default_pagination(self, test_client, sample_briefing_data):
        """Should return briefings with default pagination (page=1, limit=10)."""
        briefing = Briefing(
            id=sample_briefing_data["id"],
            date=sample_briefing_data["date"],
            created_at=datetime.fromisoformat(sample_briefing_data["created_at"]),
            stock=StockDetail(**sample_briefing_data["stock"]),
            score=ScoreBreakdown(**sample_briefing_data["score"]),
            why_hot=[WhyHotItem(**item) for item in sample_briefing_data["why_hot"]],
            news=[]
        )

        mock_response = BriefingListResponse(
            briefings=[briefing],
            total=1,
            page=1,
            limit=10,
            total_pages=1
        )

        with patch('api.briefing.briefing_storage') as mock_storage:
            mock_storage.get_briefings.return_value = mock_response

            response = test_client.get("/api/briefings")

            assert response.status_code == 200
            data = response.json()
            assert "briefings" in data
            assert data["page"] == 1
            assert data["limit"] == 10
            mock_storage.get_briefings.assert_called_once_with(page=1, limit=10)

    def test_get_briefings_custom_pagination(self, test_client, sample_briefing_data):
        """Should respect custom pagination parameters."""
        briefing = Briefing(
            id=sample_briefing_data["id"],
            date=sample_briefing_data["date"],
            created_at=datetime.fromisoformat(sample_briefing_data["created_at"]),
            stock=StockDetail(**sample_briefing_data["stock"]),
            score=ScoreBreakdown(**sample_briefing_data["score"]),
            why_hot=[WhyHotItem(**item) for item in sample_briefing_data["why_hot"]],
            news=[]
        )

        mock_response = BriefingListResponse(
            briefings=[briefing],
            total=50,
            page=2,
            limit=5,
            total_pages=10
        )

        with patch('api.briefing.briefing_storage') as mock_storage:
            mock_storage.get_briefings.return_value = mock_response

            response = test_client.get("/api/briefings?page=2&limit=5")

            assert response.status_code == 200
            data = response.json()
            assert data["page"] == 2
            assert data["limit"] == 5
            assert data["total_pages"] == 10
            mock_storage.get_briefings.assert_called_once_with(page=2, limit=5)

    def test_get_briefings_invalid_page(self, test_client):
        """Should reject page less than 1."""
        response = test_client.get("/api/briefings?page=0")
        assert response.status_code == 422

        response = test_client.get("/api/briefings?page=-1")
        assert response.status_code == 422

    def test_get_briefings_invalid_limit(self, test_client):
        """Should reject limit outside valid range (1-50)."""
        response = test_client.get("/api/briefings?limit=0")
        assert response.status_code == 422

        response = test_client.get("/api/briefings?limit=51")
        assert response.status_code == 422

    def test_get_briefings_empty_list(self, test_client):
        """Should return empty list when no briefings exist."""
        mock_response = BriefingListResponse(
            briefings=[],
            total=0,
            page=1,
            limit=10,
            total_pages=0
        )

        with patch('api.briefing.briefing_storage') as mock_storage:
            mock_storage.get_briefings.return_value = mock_response

            response = test_client.get("/api/briefings")

            assert response.status_code == 200
            data = response.json()
            assert data["briefings"] == []
            assert data["total"] == 0

    def test_get_briefings_service_error(self, test_client):
        """Should return 500 when storage fails."""
        with patch('api.briefing.briefing_storage') as mock_storage:
            mock_storage.get_briefings.side_effect = Exception("Database error")

            response = test_client.get("/api/briefings")

            assert response.status_code == 500
            assert "error" in response.json()["detail"].lower() or "fail" in response.json()["detail"].lower()


class TestBriefingByDateAPI:
    """Test cases for GET /api/briefings/{date} endpoint."""

    def test_get_briefing_by_date_success(self, test_client, sample_briefing_data):
        """Should return briefing for valid date."""
        briefing = Briefing(
            id=sample_briefing_data["id"],
            date=sample_briefing_data["date"],
            created_at=datetime.fromisoformat(sample_briefing_data["created_at"]),
            stock=StockDetail(**sample_briefing_data["stock"]),
            score=ScoreBreakdown(**sample_briefing_data["score"]),
            why_hot=[WhyHotItem(**item) for item in sample_briefing_data["why_hot"]],
            news=[]
        )

        with patch('api.briefing.briefing_storage') as mock_storage:
            mock_storage.get_briefing_by_date.return_value = briefing

            response = test_client.get("/api/briefings/2024-01-15")

            assert response.status_code == 200
            data = response.json()
            assert "briefing" in data
            assert data["briefing"]["date"] == "2024-01-15"
            assert data["briefing"]["stock"]["symbol"] == "TSLA"

    def test_get_briefing_by_date_not_found(self, test_client):
        """Should return 404 when briefing doesn't exist."""
        with patch('api.briefing.briefing_storage') as mock_storage:
            mock_storage.get_briefing_by_date.return_value = None

            response = test_client.get("/api/briefings/2024-12-31")

            assert response.status_code == 404
            assert "2024-12-31" in response.json()["detail"]

    def test_get_briefing_by_date_various_formats(self, test_client, sample_briefing_data):
        """Should handle various date formats."""
        briefing = Briefing(
            id=sample_briefing_data["id"],
            date=sample_briefing_data["date"],
            created_at=datetime.fromisoformat(sample_briefing_data["created_at"]),
            stock=StockDetail(**sample_briefing_data["stock"]),
            score=ScoreBreakdown(**sample_briefing_data["score"]),
            why_hot=[WhyHotItem(**item) for item in sample_briefing_data["why_hot"]],
            news=[]
        )

        with patch('api.briefing.briefing_storage') as mock_storage:
            mock_storage.get_briefing_by_date.return_value = briefing

            # Standard format
            response = test_client.get("/api/briefings/2024-01-15")
            assert response.status_code == 200

    def test_get_briefing_by_date_service_error(self, test_client):
        """Should return 500 when storage fails."""
        with patch('api.briefing.briefing_storage') as mock_storage:
            mock_storage.get_briefing_by_date.side_effect = Exception("Storage error")

            response = test_client.get("/api/briefings/2024-01-15")

            assert response.status_code == 500

    def test_get_briefing_response_structure(self, test_client, sample_briefing_data):
        """Should return proper response structure with all fields."""
        briefing = Briefing(
            id=sample_briefing_data["id"],
            date=sample_briefing_data["date"],
            created_at=datetime.fromisoformat(sample_briefing_data["created_at"]),
            stock=StockDetail(**sample_briefing_data["stock"]),
            score=ScoreBreakdown(**sample_briefing_data["score"]),
            why_hot=[WhyHotItem(**item) for item in sample_briefing_data["why_hot"]],
            news=[]
        )

        with patch('api.briefing.briefing_storage') as mock_storage:
            mock_storage.get_briefing_by_date.return_value = briefing

            response = test_client.get("/api/briefings/2024-01-15")

            assert response.status_code == 200
            data = response.json()

            # Check briefing structure
            briefing_data = data["briefing"]
            assert "id" in briefing_data
            assert "date" in briefing_data
            assert "created_at" in briefing_data
            assert "stock" in briefing_data
            assert "score" in briefing_data
            assert "why_hot" in briefing_data

            # Check stock structure
            stock = briefing_data["stock"]
            assert "symbol" in stock
            assert "name" in stock
            assert "price" in stock
            assert "change" in stock
            assert "change_percent" in stock
            assert "volume" in stock

            # Check score structure
            score = briefing_data["score"]
            assert "volume_score" in score
            assert "price_change_score" in score
            assert "momentum_score" in score
            assert "market_cap_score" in score
            assert "total" in score
