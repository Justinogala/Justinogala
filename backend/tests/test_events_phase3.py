"""
Phase 3 Events tests: AI features, Stripe payments, Gallery, Reviews, Discussions, event_format filter.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://new-user-welcome-2.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login?skip_2fa=true", json={
        "email": "admin@munal.ai", "password": "Admin@123456"
    }, timeout=20)
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text[:200]}")
    return r.json().get("access_token") or r.json().get("token")


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def any_event_id():
    r = requests.get(f"{API}/events?tab=upcoming&limit=5", timeout=15)
    assert r.status_code == 200, r.text
    events = r.json().get("events", [])
    if not events:
        pytest.skip("No upcoming events available")
    return events[0]["id"]


@pytest.fixture(scope="module")
def paid_event_id():
    """Find an event with a non-free price; create one if none."""
    r = requests.get(f"{API}/events?tab=upcoming&limit=50", timeout=15)
    assert r.status_code == 200
    for e in r.json().get("events", []):
        price = e.get("price", "")
        if price and price not in ("Free", "0", "$0", ""):
            return e["id"]
    pytest.skip("No paid event found")


# ====================== event_format field & filter ======================

class TestEventFormat:
    def test_events_have_event_format(self):
        r = requests.get(f"{API}/events?tab=upcoming&limit=50", timeout=15)
        assert r.status_code == 200
        events = r.json().get("events", [])
        assert len(events) > 0, "No events seeded"
        # At least most events should have event_format
        with_format = [e for e in events if e.get("event_format")]
        assert len(with_format) > 0, "No events have event_format field"

    def test_filter_by_event_type_bootcamps(self):
        r = requests.get(f"{API}/events?event_type=Bootcamps&tab=upcoming&limit=50", timeout=15)
        assert r.status_code == 200
        events = r.json().get("events", [])
        # All returned events should have event_format=Bootcamps
        for e in events:
            assert e.get("event_format") == "Bootcamps", f"Got format: {e.get('event_format')}"

    def test_filter_by_event_type_workshops(self):
        r = requests.get(f"{API}/events?event_type=Workshops&tab=upcoming&limit=50", timeout=15)
        assert r.status_code == 200
        events = r.json().get("events", [])
        for e in events:
            assert e.get("event_format") == "Workshops"


# ====================== AI endpoints ======================

class TestAIEndpoints:
    def test_ai_summary_requires_auth(self):
        r = requests.post(f"{API}/admin/events/ai/summary",
                          json={"title": "Test"}, timeout=15)
        assert r.status_code in (401, 403), r.status_code

    def test_ai_summary_generates(self, admin_headers):
        r = requests.post(f"{API}/admin/events/ai/summary",
                          headers=admin_headers,
                          json={
                              "title": "AI Bootcamp 2026",
                              "description": "Intensive 1-day AI bootcamp",
                              "category": "AI",
                              "speakers": [{"name": "John Doe", "title": "AI Lead"}],
                              "agenda": ["Welcome", "Workshop", "Demo"]
                          }, timeout=60)
        assert r.status_code == 200, f"{r.status_code}: {r.text[:300]}"
        data = r.json()
        assert data.get("success") is True
        assert isinstance(data.get("content"), str)
        assert len(data["content"]) > 30

    def test_ai_speaker_bio(self, admin_headers):
        r = requests.post(f"{API}/admin/events/ai/speaker-bio",
                          headers=admin_headers,
                          json={"name": "Jane Doe", "title": "ML Engineer",
                                "company": "Munal", "topics": "LLMs"},
                          timeout=60)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert data.get("success") is True
        assert len(data.get("content", "")) > 30

    def test_ai_agenda(self, admin_headers):
        r = requests.post(f"{API}/admin/events/ai/agenda",
                          headers=admin_headers,
                          json={"title": "AI Workshop", "duration": "4 hours",
                                "category": "AI", "event_format": "Workshops"},
                          timeout=60)
        assert r.status_code == 200, r.text[:300]
        assert len(r.json().get("content", "")) > 30

    def test_ai_marketing_twitter(self, admin_headers):
        r = requests.post(f"{API}/admin/events/ai/marketing",
                          headers=admin_headers,
                          json={"title": "AI Summit", "description": "Big event",
                                "date": "2026-03-15", "location": "Virtual",
                                "price": "Free", "platform": "twitter"},
                          timeout=60)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d.get("platform") == "twitter"
        assert len(d.get("content", "")) > 10


# ====================== Stripe payments ======================

class TestStripePayments:
    def test_checkout_event_not_found(self):
        r = requests.post(f"{API}/events/payments/create-checkout",
                          json={"event_id": "nonexistent-xxxx",
                                "email": "test@x.com", "name": "T"},
                          timeout=15)
        assert r.status_code == 404

    def test_checkout_free_event_400(self, any_event_id):
        # any_event_id likely has price="Free"
        r = requests.get(f"{API}/events/{any_event_id}", timeout=10)
        ev = r.json()
        if ev.get("price", "Free") not in ("Free", "", None, "0"):
            pytest.skip("Selected event is not free")
        r2 = requests.post(f"{API}/events/payments/create-checkout",
                           json={"event_id": any_event_id,
                                 "email": "t@x.com", "name": "T"},
                           timeout=15)
        assert r2.status_code == 400, r2.text[:200]

    def test_checkout_paid_event_response(self, paid_event_id):
        """With test key sk_test_emergent, Stripe will return 401 from API -> we expect 500.
        The endpoint should NOT crash; it should return a JSON error."""
        r = requests.post(f"{API}/events/payments/create-checkout",
                          json={"event_id": paid_event_id,
                                "email": "TEST_payer@x.com", "name": "TEST Payer"},
                          timeout=30)
        # Either 200 (success with valid key) or 500 (stripe rejected key) — but not 502/crash
        assert r.status_code in (200, 400, 500), f"Unexpected: {r.status_code} {r.text[:300]}"
        # Must be JSON
        try:
            r.json()
        except Exception:
            pytest.fail("Non-JSON response")


# ====================== Gallery ======================

class TestGallery:
    def test_get_gallery_empty(self, any_event_id):
        r = requests.get(f"{API}/events/{any_event_id}/gallery", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "items" in data and isinstance(data["items"], list)
        assert "count" in data

    def test_add_gallery_item(self, any_event_id):
        r = requests.post(f"{API}/events/{any_event_id}/gallery",
                          json={"type": "photo", "url": "https://example.com/p.jpg",
                                "caption": "TEST gallery", "uploaded_by": "tester"},
                          timeout=10)
        assert r.status_code == 200, r.text[:200]
        item = r.json().get("item")
        assert item and item.get("url") == "https://example.com/p.jpg"
        assert item.get("type") == "photo"
        # Verify persistence
        g = requests.get(f"{API}/events/{any_event_id}/gallery", timeout=10).json()
        ids = [i["id"] for i in g["items"]]
        assert item["id"] in ids


# ====================== Reviews ======================

class TestReviews:
    def test_get_reviews_initial(self, any_event_id):
        r = requests.get(f"{API}/events/{any_event_id}/reviews", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "reviews" in data and "average_rating" in data

    def test_post_review_and_average(self, any_event_id):
        unique_email = f"TEST_rev_{uuid.uuid4().hex[:8]}@x.com"
        r = requests.post(f"{API}/events/{any_event_id}/reviews",
                          json={"name": "Tester", "email": unique_email,
                                "rating": 5, "comment": "TEST great"},
                          timeout=10)
        assert r.status_code == 200, r.text[:200]
        rv = r.json().get("review")
        assert rv["rating"] == 5
        # Average rating should be > 0 now
        g = requests.get(f"{API}/events/{any_event_id}/reviews", timeout=10).json()
        assert g["average_rating"] > 0
        assert g["count"] >= 1

    def test_duplicate_review_returns_400(self, any_event_id):
        unique_email = f"TEST_dup_{uuid.uuid4().hex[:8]}@x.com"
        r1 = requests.post(f"{API}/events/{any_event_id}/reviews",
                           json={"name": "Tester", "email": unique_email,
                                 "rating": 4, "comment": "first"},
                           timeout=10)
        assert r1.status_code == 200
        r2 = requests.post(f"{API}/events/{any_event_id}/reviews",
                           json={"name": "Tester", "email": unique_email,
                                 "rating": 3, "comment": "second"},
                           timeout=10)
        assert r2.status_code == 400


# ====================== Discussions ======================

class TestDiscussions:
    def test_get_discussions(self, any_event_id):
        r = requests.get(f"{API}/events/{any_event_id}/discussions", timeout=10)
        assert r.status_code == 200
        assert "posts" in r.json()

    def test_post_discussion(self, any_event_id):
        r = requests.post(f"{API}/events/{any_event_id}/discussions",
                          json={"author_name": "TestUser",
                                "author_email": f"TEST_disc_{uuid.uuid4().hex[:6]}@x.com",
                                "content": "TEST discussion post"},
                          timeout=10)
        assert r.status_code == 200, r.text[:200]
        post = r.json().get("post")
        assert post and post["content"] == "TEST discussion post"
        assert post.get("replies") == []

    def test_reply_to_discussion(self, any_event_id):
        # create post first
        cr = requests.post(f"{API}/events/{any_event_id}/discussions",
                           json={"author_name": "TestUser",
                                 "author_email": f"TEST_replyparent_{uuid.uuid4().hex[:6]}@x.com",
                                 "content": "TEST parent"},
                           timeout=10)
        post_id = cr.json()["post"]["id"]
        # reply
        rr = requests.post(f"{API}/events/{any_event_id}/discussions/{post_id}/reply",
                           json={"author_name": "Replier",
                                 "author_email": f"TEST_replyer_{uuid.uuid4().hex[:6]}@x.com",
                                 "content": "TEST reply"},
                           timeout=10)
        assert rr.status_code == 200, rr.text[:200]
        # verify
        g = requests.get(f"{API}/events/{any_event_id}/discussions", timeout=10).json()
        match = [p for p in g["posts"] if p["id"] == post_id]
        assert match and len(match[0]["replies"]) >= 1

    def test_reply_to_nonexistent_post_404(self, any_event_id):
        rr = requests.post(f"{API}/events/{any_event_id}/discussions/nonexistent-id/reply",
                           json={"author_name": "X", "content": "hi"},
                           timeout=10)
        assert rr.status_code == 404
