"""Tests for POST /api/events/host-proposal (Host an Event proposal submission)"""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://new-user-welcome-2.preview.emergentagent.com").rstrip("/")
ENDPOINT = f"{BASE_URL}/api/events/host-proposal"


@pytest.fixture
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestHostProposal:
    def test_submit_valid_proposal_returns_id(self, api_client):
        payload = {
            "name": "TEST_Host User",
            "email": "test_host@example.com",
            "event_title": "TEST_AI Workshop on Quantum",
            "description": "An intro workshop",
            "preferred_date": "2026-05-01",
            "event_format": "Workshop",
            "expected_attendees": "50-100",
        }
        r = api_client.post(ENDPOINT, json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True
        assert "proposal_id" in data
        assert isinstance(data["proposal_id"], str) and len(data["proposal_id"]) > 0

    def test_minimal_required_fields(self, api_client):
        payload = {
            "name": "TEST_Min",
            "email": "min@example.com",
            "event_title": "TEST_Minimal Event",
        }
        r = api_client.post(ENDPOINT, json=payload)
        assert r.status_code == 200, r.text
        assert "proposal_id" in r.json()

    def test_missing_name_returns_422(self, api_client):
        r = api_client.post(ENDPOINT, json={"email": "x@y.com", "event_title": "T"})
        assert r.status_code == 422

    def test_missing_email_returns_422(self, api_client):
        r = api_client.post(ENDPOINT, json={"name": "n", "event_title": "T"})
        assert r.status_code == 422

    def test_missing_event_title_returns_422(self, api_client):
        r = api_client.post(ENDPOINT, json={"name": "n", "email": "x@y.com"})
        assert r.status_code == 422


class TestHostProposalRateLimit:
    def test_rate_limit_5_per_minute(self, api_client):
        """6th rapid request should yield 429."""
        statuses = []
        for i in range(7):
            payload = {
                "name": f"TEST_RL{i}",
                "email": f"test_rl_{i}@example.com",
                "event_title": f"TEST_RL Event {i}",
            }
            r = api_client.post(ENDPOINT, json=payload)
            statuses.append(r.status_code)
        # We expect at least one 429 within 7 attempts (limit 5/min)
        assert 429 in statuses, f"No 429 observed; statuses={statuses}"
