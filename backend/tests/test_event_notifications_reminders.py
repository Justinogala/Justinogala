"""Tests for event email notifications + reminders + rate limits.

Covers:
- POST /api/events/host-proposal -> returns proposal_id (notifications fired non-blocking)
- POST /api/events/host-proposal rate limit (5/min)
- POST /api/events/{id}/reviews rate limit (10/min)
- POST /api/admin/events/send-reminders requires auth, returns success when authed
"""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://new-user-welcome-2.preview.emergentagent.com").rstrip("/")
HP_ENDPOINT = f"{BASE_URL}/api/events/host-proposal"
SEND_REMINDERS_ENDPOINT = f"{BASE_URL}/api/admin/events/send-reminders"
ADMIN_EMAIL = "admin@munal.ai"
ADMIN_PWD = "Admin@123456"


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Login as admin (skip_2fa=true as query param)."""
    r = api_client.post(
        f"{BASE_URL}/api/auth/login?skip_2fa=true",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PWD},
    )
    if r.status_code == 200:
        data = r.json()
        tok = data.get("token") or data.get("access_token")
        if tok:
            return tok
    pytest.skip(f"Could not obtain admin token: {r.status_code} {r.text[:200]}")


# ---------- Host proposal email-notification trigger ----------

class TestHostProposalNotification:
    def test_host_proposal_returns_success_and_id(self, api_client):
        payload = {
            "name": "TEST_Notify Host",
            "email": "test_notify_host@example.com",
            "event_title": "TEST_Notify Workshop",
            "description": "Trigger notifications",
            "preferred_date": "2026-06-01",
            "event_format": "Workshop",
            "expected_attendees": "50",
        }
        r = api_client.post(HP_ENDPOINT, json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True
        assert isinstance(data.get("proposal_id"), str)
        assert len(data["proposal_id"]) > 0


# ---------- Rate limit on host-proposal ----------

class TestHostProposalRateLimit:
    def test_5_per_minute_enforced(self, api_client):
        # use unique session to isolate
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        statuses = []
        for i in range(8):
            payload = {
                "name": f"TEST_RL_HP_{i}",
                "email": f"test_rl_hp_{i}@example.com",
                "event_title": f"TEST_RL HP Event {i}",
            }
            r = s.post(HP_ENDPOINT, json=payload)
            statuses.append(r.status_code)
        assert 429 in statuses, f"No 429 observed; statuses={statuses}"


# ---------- Rate limit on event reviews ----------

class TestReviewsRateLimit:
    def test_10_per_minute_enforced(self, api_client):
        # First find an existing event id
        r = api_client.get(f"{BASE_URL}/api/events?limit=1")
        assert r.status_code == 200, r.text
        events = r.json().get("events") or []
        if not events:
            pytest.skip("No events available to test reviews rate limit")
        event_id = events[0]["id"]

        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        statuses = []
        for i in range(13):
            payload = {
                "name": f"TEST_RL_REV_{i}",
                "email": f"test_rl_review_{i}_{int(time.time()*1000)}@example.com",
                "rating": 5,
                "comment": "rate-limit probe",
            }
            r = s.post(f"{BASE_URL}/api/events/{event_id}/reviews", json=payload)
            statuses.append(r.status_code)
        assert 429 in statuses, f"No 429 observed; statuses={statuses}"


# ---------- Admin send-reminders manual trigger ----------

class TestSendReminders:
    def test_requires_auth(self, api_client):
        r = api_client.post(SEND_REMINDERS_ENDPOINT, json={})
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}: {r.text}"

    def test_authed_returns_success(self, api_client, admin_token):
        headers = {"Authorization": f"Bearer {admin_token}"}
        r = api_client.post(SEND_REMINDERS_ENDPOINT, headers=headers, json={})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True
        assert "reminders_sent" in data
        assert isinstance(data["reminders_sent"], int)
