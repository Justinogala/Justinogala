"""
Tests for Munal Academy Phase 1 + Subscriptions:
- Academy courses CRUD (admin), public catalog, course detail with has_access gating
- Enrollment (free + premium gating), lesson completion + certificate
- Dashboard (continue_learning, certificates, stats)
- Subscription plans, status, Stripe checkout creation
- Events livestream-access endpoint behavior
"""
import os
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://new-user-welcome-2.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@munal.com"
ADMIN_PASSWORD = "Munal@AI#2026!X7qP9"


# ---------- Fixtures ----------

@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login?skip_2fa=true",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("access_token") or data.get("token")
    assert token, f"No token in response: {data}"
    return token


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def regular_user():
    """Create a fresh regular user via /api/auth/register"""
    suffix = uuid.uuid4().hex[:8]
    email = f"TEST_academy_{suffix}@example.com"
    password = "TestAcademy@2026!Strong#X9"
    payload = {"email": email, "password": password, "name": "Test Academy User"}
    r = requests.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=30)
    assert r.status_code in (200, 201), f"register failed: {r.status_code} {r.text}"
    body = r.json()
    token = body.get("access_token") or body.get("token")
    # If no token in register response, login
    if not token:
        lr = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password}, timeout=30)
        assert lr.status_code == 200, lr.text
        token = lr.json().get("access_token") or lr.json().get("token")
    assert token, "No user token obtained"
    user_id = body.get("user", {}).get("id") or body.get("id")
    return {"email": email, "password": password, "token": token, "user_id": user_id}


@pytest.fixture(scope="session")
def user_headers(regular_user):
    return {"Authorization": f"Bearer {regular_user['token']}", "Content-Type": "application/json"}


# ---------- Public catalog ----------

class TestPublicCatalog:
    def test_list_courses_published(self):
        r = requests.get(f"{BASE_URL}/api/academy/courses", timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "courses" in data and "total" in data
        assert isinstance(data["courses"], list)
        # Per seed data: 4 published
        assert data["total"] >= 4, f"Expected >=4 courses, got {data['total']}"
        for c in data["courses"]:
            assert "id" in c and "title" in c
            assert "category" in c
            assert "level" in c
            assert "is_premium" in c
            assert c.get("status") == "published"

    def test_list_courses_filter_premium(self):
        r = requests.get(f"{BASE_URL}/api/academy/courses?is_premium=true", timeout=20)
        assert r.status_code == 200
        for c in r.json()["courses"]:
            assert c["is_premium"] is True

    def test_get_course_detail_unauth(self):
        # Pick first free course
        r = requests.get(f"{BASE_URL}/api/academy/courses?is_premium=false", timeout=20)
        assert r.status_code == 200
        courses = r.json()["courses"]
        assert courses, "No free courses seeded"
        cid = courses[0]["id"]
        d = requests.get(f"{BASE_URL}/api/academy/courses/{cid}", timeout=20)
        assert d.status_code == 200
        body = d.json()
        assert body["id"] == cid
        assert "lessons" in body
        assert "has_access" in body
        assert body["has_access"] is True  # free course

    def test_get_premium_course_detail_unauth_hides_video(self):
        r = requests.get(f"{BASE_URL}/api/academy/courses?is_premium=true", timeout=20)
        courses = r.json()["courses"]
        if not courses:
            pytest.skip("No premium courses seeded")
        cid = courses[0]["id"]
        d = requests.get(f"{BASE_URL}/api/academy/courses/{cid}", timeout=20)
        assert d.status_code == 200
        body = d.json()
        assert body["has_access"] is False
        for lesson in body.get("lessons", []):
            assert lesson.get("video_url") == ""


# ---------- Admin CRUD ----------

class TestAdminCRUD:
    created_course_id = None

    def test_admin_create_course(self, admin_headers):
        payload = {
            "title": "TEST_Academy_Phase1_Course",
            "description": "Testing course CRUD",
            "category": "AI",
            "level": "beginner",
            "is_premium": False,
            "status": "published",
            "lessons": [
                {"title": "Lesson 1", "video_url": "https://youtube.com/watch?v=abc", "duration": "5m", "order": 0},
                {"title": "Lesson 2", "video_url": "https://youtube.com/watch?v=def", "duration": "6m", "order": 1},
            ],
        }
        r = requests.post(f"{BASE_URL}/api/academy/admin/courses", json=payload, headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["success"] is True
        course = body["course"]
        assert course["title"] == payload["title"]
        assert len(course["lessons"]) == 2
        assert all("id" in les for les in course["lessons"])
        TestAdminCRUD.created_course_id = course["id"]

    def test_admin_list_courses(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/academy/admin/courses", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert "courses" in data and "total" in data
        # Our created course should be present
        ids = [c["id"] for c in data["courses"]]
        assert TestAdminCRUD.created_course_id in ids

    def test_non_admin_cannot_create(self, user_headers):
        r = requests.post(f"{BASE_URL}/api/academy/admin/courses",
                          json={"title": "TEST_Forbidden"}, headers=user_headers, timeout=20)
        assert r.status_code == 403


# ---------- Enrollment ----------

class TestEnrollment:
    def test_enroll_free_course(self, user_headers):
        r = requests.get(f"{BASE_URL}/api/academy/courses?is_premium=false", timeout=20)
        cid = r.json()["courses"][0]["id"]
        e = requests.post(f"{BASE_URL}/api/academy/courses/{cid}/enroll",
                          headers=user_headers, timeout=20)
        assert e.status_code == 200, e.text
        body = e.json()
        assert body["success"] is True

    def test_enroll_premium_without_sub_403(self, user_headers):
        r = requests.get(f"{BASE_URL}/api/academy/courses?is_premium=true", timeout=20)
        courses = r.json()["courses"]
        if not courses:
            pytest.skip("No premium courses")
        cid = courses[0]["id"]
        e = requests.post(f"{BASE_URL}/api/academy/courses/{cid}/enroll",
                          headers=user_headers, timeout=20)
        assert e.status_code == 403, f"expected 403, got {e.status_code}: {e.text}"
        assert "pro" in e.text.lower() or "subscription" in e.text.lower()

    def test_enroll_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/academy/courses?is_premium=false", timeout=20)
        cid = r.json()["courses"][0]["id"]
        e = requests.post(f"{BASE_URL}/api/academy/courses/{cid}/enroll", timeout=20)
        assert e.status_code in (401, 403)

    def test_complete_lesson_and_progress(self, user_headers):
        # Find a free course we enrolled in
        r = requests.get(f"{BASE_URL}/api/academy/courses?is_premium=false", timeout=20)
        cid = r.json()["courses"][0]["id"]
        # Get detail to get lessons
        d = requests.get(f"{BASE_URL}/api/academy/courses/{cid}",
                         headers=user_headers, timeout=20).json()
        lessons = d.get("lessons", [])
        if not lessons:
            pytest.skip("Free course has no lessons")
        # Ensure enrolled
        requests.post(f"{BASE_URL}/api/academy/courses/{cid}/enroll", headers=user_headers, timeout=20)
        lid = lessons[0]["id"]
        c = requests.post(f"{BASE_URL}/api/academy/courses/{cid}/lessons/{lid}/complete",
                          headers=user_headers, timeout=20)
        assert c.status_code == 200, c.text
        body = c.json()
        assert body["success"] is True
        assert "progress" in body
        assert body["progress"] > 0


# ---------- Dashboard ----------

class TestDashboard:
    def test_dashboard_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/academy/dashboard", timeout=20)
        assert r.status_code in (401, 403)

    def test_dashboard_personalized(self, user_headers):
        r = requests.get(f"{BASE_URL}/api/academy/dashboard", headers=user_headers, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("continue_learning", "completed_courses", "certificates",
                  "upcoming_events", "recommended", "subscription", "stats"):
            assert k in d, f"Missing key {k}"
        for stat_k in ("courses_enrolled", "courses_completed", "certificates_earned", "learning_streak"):
            assert stat_k in d["stats"]
        # After enrolling in free course in earlier test, should have >= 1 enrollment
        assert d["stats"]["courses_enrolled"] >= 1


# ---------- Subscriptions ----------

class TestSubscriptions:
    def test_get_plans(self):
        r = requests.get(f"{BASE_URL}/api/academy/subscriptions/plans", timeout=20)
        assert r.status_code == 200
        plans = r.json()["plans"]
        for key in ("free", "pro", "enterprise"):
            assert key in plans
        assert plans["pro"]["price"] == 29.00
        assert plans["enterprise"]["price"] == 99.00
        assert plans["free"]["price"] == 0

    def test_status_unauth(self):
        r = requests.get(f"{BASE_URL}/api/academy/subscriptions/status", timeout=20)
        assert r.status_code in (401, 403)

    def test_status_for_new_user(self, user_headers):
        r = requests.get(f"{BASE_URL}/api/academy/subscriptions/status", headers=user_headers, timeout=20)
        assert r.status_code == 200
        d = r.json()
        # New user — no active sub
        assert d["active"] is False
        assert d["plan"] == "free"

    def test_checkout_invalid_plan(self, user_headers):
        r = requests.post(f"{BASE_URL}/api/academy/subscriptions/checkout",
                          json={"plan": "invalid", "origin_url": "https://munal.ai"},
                          headers=user_headers, timeout=30)
        assert r.status_code == 400

    def test_checkout_creates_stripe_session(self, user_headers):
        r = requests.post(f"{BASE_URL}/api/academy/subscriptions/checkout",
                          json={"plan": "pro", "origin_url": "https://munal.ai"},
                          headers=user_headers, timeout=60)
        assert r.status_code == 200, f"checkout failed: {r.status_code} {r.text}"
        d = r.json()
        assert d["success"] is True
        assert d["checkout_url"].startswith("http")
        assert "session_id" in d


# ---------- Livestream access ----------

class TestLivestreamAccess:
    def _get_event_with_stream(self):
        r = requests.get(f"{BASE_URL}/api/events", timeout=20)
        if r.status_code != 200:
            return None
        body = r.json()
        events = body if isinstance(body, list) else body.get("events", [])
        for e in events:
            if e.get("stream_url"):
                return e
        # Fallback: return first event (may yield "no_stream" reason)
        return events[0] if events else None

    def test_livestream_no_user_returns_login_required(self):
        ev = self._get_event_with_stream()
        if not ev:
            pytest.skip("No events available")
        r = requests.get(f"{BASE_URL}/api/events/{ev['id']}/livestream-access", timeout=20)
        assert r.status_code == 200
        d = r.json()
        # If event has stream_url, expected login_required; else no_stream
        if ev.get("stream_url"):
            assert d["has_access"] is False
            assert d.get("reason") == "login_required"
        else:
            assert d.get("reason") in ("no_stream", "login_required")

    def test_livestream_free_event_with_user_id_has_access(self, regular_user):
        # Find a free event with stream_url
        r = requests.get(f"{BASE_URL}/api/events", timeout=20)
        body = r.json()
        events = body if isinstance(body, list) else body.get("events", [])
        free_with_stream = None
        for e in events:
            price = e.get("price", "Free")
            if e.get("stream_url") and (price in (None, "", "Free")):
                free_with_stream = e
                break
        if not free_with_stream:
            pytest.skip("No free events with stream_url available")
        uid = regular_user["user_id"] or "any-id"
        r2 = requests.get(f"{BASE_URL}/api/events/{free_with_stream['id']}/livestream-access",
                          params={"user_id": uid}, timeout=20)
        assert r2.status_code == 200
        d = r2.json()
        assert d["has_access"] is True
        assert "stream_url" in d
