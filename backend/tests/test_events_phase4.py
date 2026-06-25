"""
Phase 4 Events tests: Rate limits, Calendar (ICS + My Calendar),
Networking Lounge (attendees/connect/connections), AI Matchmaker.
"""
import os
import uuid
import pytest
import requests

def _load_backend_url():
    url = os.environ.get("REACT_APP_BACKEND_URL")
    if not url:
        try:
            with open("/app/frontend/.env") as f:
                for line in f:
                    if line.startswith("REACT_APP_BACKEND_URL="):
                        url = line.split("=", 1)[1].strip()
                        break
        except FileNotFoundError:
            pass
    if not url:
        raise RuntimeError("REACT_APP_BACKEND_URL not set")
    return url.rstrip("/")


BASE_URL = _load_backend_url()
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@munal.ai"
ADMIN_PASSWORD = "Admin@123456"
USER_EMAIL = "recordtest@munal.ai"
USER_PASSWORD = "Record@12345"


# ---------- fixtures ----------

@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login?skip_2fa=true", json={
        "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
    }, timeout=30)
    if r.status_code != 200:
        pytest.skip(f"admin login failed: {r.status_code} {r.text[:200]}")
    return r.json().get("access_token") or r.json().get("token")


@pytest.fixture(scope="session")
def user_token():
    r = requests.post(f"{API}/auth/login?skip_2fa=true", json={
        "email": USER_EMAIL, "password": USER_PASSWORD
    }, timeout=30)
    if r.status_code != 200:
        pytest.skip(f"user login failed: {r.status_code} {r.text[:200]}")
    return r.json().get("access_token") or r.json().get("token")


@pytest.fixture(scope="session")
def sample_event_id():
    r = requests.get(f"{API}/events?tab=upcoming&limit=5", timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    events = data.get("events", [])
    if not events:
        pytest.skip("no upcoming events seeded")
    return events[0]["id"]


# ---------- Pydantic validation ----------

class TestPydanticValidation:
    def test_review_missing_email_returns_422(self, sample_event_id):
        r = requests.post(f"{API}/events/{sample_event_id}/reviews",
                          json={"name": "X", "rating": 4, "comment": "ok"}, timeout=15)
        assert r.status_code == 422, r.text

    def test_review_invalid_rating_returns_422(self, sample_event_id):
        r = requests.post(f"{API}/events/{sample_event_id}/reviews", json={
            "name": "X", "email": f"TEST_{uuid.uuid4().hex[:6]}@x.com",
            "rating": 9, "comment": "bad"
        }, timeout=15)
        assert r.status_code == 422, r.text

    def test_review_valid_payload_succeeds(self, sample_event_id):
        unique_email = f"TEST_{uuid.uuid4().hex[:10]}@munal.ai"
        r = requests.post(f"{API}/events/{sample_event_id}/reviews", json={
            "name": "TEST User", "email": unique_email, "rating": 5,
            "comment": "TEST phase4 review"
        }, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"] is True
        assert data["review"]["rating"] == 5
        # Verify via GET
        g = requests.get(f"{API}/events/{sample_event_id}/reviews", timeout=15)
        assert g.status_code == 200
        emails = [rv.get("email") for rv in g.json().get("reviews", [])]
        assert unique_email.lower() in emails

    def test_discussion_empty_content_returns_422(self, sample_event_id):
        r = requests.post(f"{API}/events/{sample_event_id}/discussions",
                          json={"author_name": "X", "content": ""}, timeout=15)
        assert r.status_code == 422, r.text

    def test_discussion_valid_post_succeeds(self, sample_event_id):
        r = requests.post(f"{API}/events/{sample_event_id}/discussions", json={
            "author_name": "TEST", "author_email": "TEST_disc@x.com",
            "content": "TEST phase4 discussion content"
        }, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json()["post"]["content"] == "TEST phase4 discussion content"

    def test_gallery_missing_url_returns_422(self, sample_event_id):
        r = requests.post(f"{API}/events/{sample_event_id}/gallery",
                          json={"type": "photo", "caption": "no url"}, timeout=15)
        assert r.status_code == 422, r.text

    def test_gallery_valid_payload_succeeds(self, sample_event_id):
        r = requests.post(f"{API}/events/{sample_event_id}/gallery", json={
            "type": "photo", "url": "https://example.com/test.png",
            "caption": "TEST phase4"
        }, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json()["item"]["url"] == "https://example.com/test.png"


# ---------- Calendar ----------

class TestCalendar:
    def test_ics_download_content_type(self, sample_event_id):
        r = requests.get(f"{API}/events/{sample_event_id}/calendar.ics", timeout=15)
        assert r.status_code == 200, r.text
        ct = r.headers.get("content-type", "")
        assert "text/calendar" in ct, ct
        body = r.text
        assert "BEGIN:VCALENDAR" in body
        assert "END:VCALENDAR" in body
        assert "BEGIN:VEVENT" in body
        assert "SUMMARY:" in body

    def test_ics_not_found(self):
        r = requests.get(f"{API}/events/nonexistent-xyz/calendar.ics", timeout=15)
        assert r.status_code == 404

    def test_my_calendar_requires_auth(self):
        r = requests.get(f"{API}/events/user/my-calendar", timeout=15)
        assert r.status_code in (401, 403), r.status_code

    def test_my_calendar_with_auth(self, user_token, sample_event_id):
        # Apply to event first (use a unique email so we don't hit duplicate)
        # NOTE: my-calendar uses logged-in user's email — apply via the user's own email
        # Get user's email
        me = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {user_token}"}, timeout=15)
        if me.status_code != 200:
            pytest.skip("/auth/me failed")
        user_email = me.json().get("email", USER_EMAIL)

        # Try to apply (idempotent — if already applied, that's fine)
        requests.post(f"{API}/events/{sample_event_id}/apply", json={
            "first_name": "Record", "last_name": "Test", "email": user_email,
            "accept_terms": True
        }, timeout=15)

        r = requests.get(f"{API}/events/user/my-calendar",
                         headers={"Authorization": f"Bearer {user_token}"}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "events" in data and "count" in data
        assert isinstance(data["events"], list)


# ---------- Networking ----------

class TestNetworking:
    def test_attendees_directory(self, sample_event_id):
        r = requests.get(f"{API}/events/{sample_event_id}/networking/attendees", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "attendees" in data and "count" in data
        assert isinstance(data["attendees"], list)

    def test_connect_requires_auth(self, sample_event_id):
        r = requests.post(f"{API}/events/{sample_event_id}/networking/connect",
                          json={"target_email": "x@y.com", "message": "hi"}, timeout=15)
        assert r.status_code in (401, 403), r.status_code

    def test_connect_creates_request(self, user_token, sample_event_id):
        target = f"TEST_target_{uuid.uuid4().hex[:6]}@munal.ai"
        r = requests.post(f"{API}/events/{sample_event_id}/networking/connect",
                          json={"target_email": target, "message": "TEST phase4 connect"},
                          headers={"Authorization": f"Bearer {user_token}"}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"] is True
        assert "connection_id" in data
        # Verify it appears in GET connections
        g = requests.get(f"{API}/events/{sample_event_id}/networking/connections",
                         headers={"Authorization": f"Bearer {user_token}"}, timeout=15)
        assert g.status_code == 200, g.text
        ids = [c["id"] for c in g.json().get("connections", [])]
        assert data["connection_id"] in ids

    def test_connections_require_auth(self, sample_event_id):
        r = requests.get(f"{API}/events/{sample_event_id}/networking/connections", timeout=15)
        assert r.status_code in (401, 403), r.status_code

    def test_respond_invalid_status_returns_400(self, user_token):
        r = requests.put(f"{API}/events/networking/connections/{uuid.uuid4()}?status=foo",
                         headers={"Authorization": f"Bearer {user_token}"}, timeout=15)
        assert r.status_code == 400, r.text

    def test_respond_nonexistent_returns_404(self, user_token):
        r = requests.put(f"{API}/events/networking/connections/nonexistent-id?status=accepted",
                         headers={"Authorization": f"Bearer {user_token}"}, timeout=15)
        assert r.status_code == 404, r.text


# ---------- AI Matchmaker ----------

class TestAIMatchmaker:
    def test_recommendations_require_auth(self):
        r = requests.post(f"{API}/events/ai/recommendations",
                          json={"interests": ["AI"]}, timeout=15)
        assert r.status_code in (401, 403), r.status_code

    def test_recommendations_returns_events(self, user_token):
        r = requests.post(
            f"{API}/events/ai/recommendations",
            json={"interests": ["AI", "Cloud"], "industry": "Tech",
                  "experience_level": "Senior", "preferred_formats": ["Workshops", "Bootcamps"]},
            headers={"Authorization": f"Bearer {user_token}"},
            timeout=60  # AI can take 5-10s
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "recommendations" in data
        assert isinstance(data["recommendations"], list)
        # Up to 5 recommendations
        assert len(data["recommendations"]) <= 5


# ---------- Rate Limits ----------

class TestRateLimits:
    def test_apply_rate_limit_10_per_min(self, sample_event_id):
        # 12 rapid POSTs with unique emails — at least one should hit 429
        statuses = []
        for i in range(13):
            payload = {
                "first_name": "TEST", "last_name": f"RL{i}",
                "email": f"TEST_rl_{uuid.uuid4().hex[:10]}@munal.ai",
                "accept_terms": True
            }
            r = requests.post(f"{API}/events/{sample_event_id}/apply", json=payload, timeout=15)
            statuses.append(r.status_code)
            if 429 in statuses:
                break
        assert 429 in statuses, f"Expected 429 in {statuses}"

    def test_matchmaker_rate_limit_5_per_min(self, user_token):
        # Fire 7 requests; AI is rate-limited at 5/min. Use short timeout because we expect 429 fast.
        statuses = []
        for i in range(7):
            r = requests.post(
                f"{API}/events/ai/recommendations",
                json={"interests": ["AI"]},
                headers={"Authorization": f"Bearer {user_token}"},
                timeout=60
            )
            statuses.append(r.status_code)
            if 429 in statuses:
                break
        # 429 expected after 5 successful calls
        assert 429 in statuses, f"Expected 429 in {statuses}"
