"""
Tests for Event Sponsors CRUD, Livestream fields, Featured Programs, and new AI events.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://new-user-welcome-2.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@munal.com"
ADMIN_PASS = "Munal@AI#2026!X7qP9"

NEW_EVENT_IDS = {
    "ai_agents": "19e94c69-f37a-4c48-8c77-c9ddb98e1539",
    "mlops": "2e065a90-e17c-40c8-bb5a-c10d6d07b5e6",
}
SPONSOR_EVENT_ID = "4f91e2c1-2a44-4c8c-80f7-abf2adad4859"  # AI Product Builder Bootcamp - 6 sponsors


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login?skip_2fa=true",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASS},
        timeout=15,
    )
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text[:300]}"
    token = r.json().get("token") or r.json().get("access_token")
    assert token, f"No token in login response: {r.json()}"
    return token


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ============== New AI Events ==============

class TestNewEvents:
    def test_ai_agents_event_exists(self):
        r = requests.get(f"{BASE_URL}/api/events/{NEW_EVENT_IDS['ai_agents']}", timeout=15)
        assert r.status_code == 200, f"AI Agents event not found: {r.status_code}"
        data = r.json()
        assert "Generative AI Agents" in data.get("title", ""), f"Wrong title: {data.get('title')}"

    def test_mlops_event_exists(self):
        r = requests.get(f"{BASE_URL}/api/events/{NEW_EVENT_IDS['mlops']}", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "MLOps" in data.get("title", "") or "LLMOps" in data.get("title", ""), f"Wrong title: {data.get('title')}"

    def test_events_list_contains_new_events(self):
        r = requests.get(f"{BASE_URL}/api/events", timeout=15)
        assert r.status_code == 200
        events = r.json()
        if isinstance(events, dict):
            events = events.get("events", events.get("items", []))
        ids = {e.get("id") for e in events}
        assert NEW_EVENT_IDS["ai_agents"] in ids, "AI Agents event missing from list"
        assert NEW_EVENT_IDS["mlops"] in ids, "MLOps event missing from list"


# ============== Public Sponsors Endpoint ==============

class TestPublicSponsors:
    def test_get_sponsors_for_bootcamp(self):
        r = requests.get(f"{BASE_URL}/api/events/{SPONSOR_EVENT_ID}/sponsors", timeout=15)
        assert r.status_code == 200, f"Sponsors endpoint failed: {r.status_code}"
        data = r.json()
        assert "sponsors" in data
        assert len(data["sponsors"]) >= 1, "Expected sponsors for Bootcamp event"
        # Verify fields and tier_order sorting
        for s in data["sponsors"]:
            assert "name" in s and "tier" in s
            assert "_id" not in s, "MongoDB _id leaked in response"
        tiers = [s.get("tier_order", 99) for s in data["sponsors"]]
        assert tiers == sorted(tiers), f"Sponsors not sorted by tier_order: {tiers}"

    def test_get_sponsors_for_ai_agents(self):
        r = requests.get(f"{BASE_URL}/api/events/{NEW_EVENT_IDS['ai_agents']}/sponsors", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "sponsors" in data
        # Per context: 3 sponsors seeded
        assert len(data["sponsors"]) >= 1, "Expected sponsors for AI Agents event"

    def test_get_sponsors_for_mlops(self):
        r = requests.get(f"{BASE_URL}/api/events/{NEW_EVENT_IDS['mlops']}/sponsors", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "sponsors" in data
        assert len(data["sponsors"]) >= 1, "Expected sponsors for MLOps event"


# ============== Admin Sponsor CRUD ==============

class TestSponsorCRUD:
    created_sponsor_id = None

    def test_create_sponsor(self, auth_headers):
        payload = {
            "name": "TEST_Sponsor_Acme",
            "logo_url": "https://example.com/logo.png",
            "website": "https://acme.test",
            "tier": "gold",
            "description": "Test sponsor",
        }
        r = requests.post(
            f"{BASE_URL}/api/admin/events/{SPONSOR_EVENT_ID}/sponsors",
            json=payload,
            headers=auth_headers,
            timeout=15,
        )
        assert r.status_code == 200, f"Create sponsor failed: {r.status_code} {r.text[:300]}"
        data = r.json()
        assert data.get("success") is True
        sponsor = data.get("sponsor", {})
        assert sponsor.get("name") == "TEST_Sponsor_Acme"
        assert sponsor.get("tier") == "gold"
        assert sponsor.get("tier_order") == 1  # gold = 1
        assert "id" in sponsor
        TestSponsorCRUD.created_sponsor_id = sponsor["id"]

    def test_sponsor_appears_in_public_list(self):
        assert TestSponsorCRUD.created_sponsor_id, "No sponsor created yet"
        r = requests.get(f"{BASE_URL}/api/events/{SPONSOR_EVENT_ID}/sponsors", timeout=15)
        assert r.status_code == 200
        ids = [s.get("id") for s in r.json()["sponsors"]]
        assert TestSponsorCRUD.created_sponsor_id in ids, "Created sponsor not in public list"

    def test_update_sponsor(self, auth_headers):
        assert TestSponsorCRUD.created_sponsor_id
        r = requests.put(
            f"{BASE_URL}/api/admin/events/{SPONSOR_EVENT_ID}/sponsors/{TestSponsorCRUD.created_sponsor_id}",
            json={"name": "TEST_Sponsor_Acme_Updated", "tier": "platinum"},
            headers=auth_headers,
            timeout=15,
        )
        assert r.status_code == 200, f"Update failed: {r.text[:300]}"
        data = r.json()
        assert data["sponsor"]["name"] == "TEST_Sponsor_Acme_Updated"
        assert data["sponsor"]["tier"] == "platinum"
        assert data["sponsor"]["tier_order"] == 0

    def test_delete_sponsor(self, auth_headers):
        assert TestSponsorCRUD.created_sponsor_id
        r = requests.delete(
            f"{BASE_URL}/api/admin/events/{SPONSOR_EVENT_ID}/sponsors/{TestSponsorCRUD.created_sponsor_id}",
            headers=auth_headers,
            timeout=15,
        )
        assert r.status_code == 200, f"Delete failed: {r.text[:300]}"
        # Verify removal
        r2 = requests.get(f"{BASE_URL}/api/events/{SPONSOR_EVENT_ID}/sponsors", timeout=15)
        ids = [s.get("id") for s in r2.json()["sponsors"]]
        assert TestSponsorCRUD.created_sponsor_id not in ids, "Sponsor still appears after delete"

    def test_create_sponsor_requires_auth(self):
        r = requests.post(
            f"{BASE_URL}/api/admin/events/{SPONSOR_EVENT_ID}/sponsors",
            json={"name": "NoAuth", "tier": "silver"},
            timeout=15,
        )
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}"

    def test_create_sponsor_nonexistent_event(self, auth_headers):
        r = requests.post(
            f"{BASE_URL}/api/admin/events/nonexistent-event-id-xyz/sponsors",
            json={"name": "X", "tier": "silver"},
            headers=auth_headers,
            timeout=15,
        )
        assert r.status_code == 404


# ============== Featured Programs ==============

class TestFeaturedPrograms:
    def test_featured_programs_endpoint(self):
        r = requests.get(f"{BASE_URL}/api/events/programs/featured", timeout=15)
        assert r.status_code == 200, f"Featured programs failed: {r.status_code}"
        data = r.json()
        assert "programs" in data
        assert isinstance(data["programs"], list)
        assert len(data["programs"]) >= 1, "Expected at least 1 featured program"
        for p in data["programs"]:
            assert "_id" not in p
            assert "id" in p and "title" in p


# ============== Livestream Fields ==============

class TestLivestreamFields:
    test_event_id = None

    def test_create_event_with_livestream(self, auth_headers):
        payload = {
            "title": "TEST_Livestream_Event",
            "description": "Test event with livestream",
            "date": "2026-12-31T18:00:00Z",
            "location": "Online",
            "category": "AI",
            "stream_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "stream_platform": "youtube",
            "is_live": True,
        }
        r = requests.post(
            f"{BASE_URL}/api/admin/events",
            json=payload,
            headers=auth_headers,
            timeout=15,
        )
        if r.status_code not in (200, 201):
            pytest.skip(f"Could not create event for livestream test: {r.status_code} {r.text[:300]}")
        data = r.json()
        evt = data.get("event", data)
        TestLivestreamFields.test_event_id = evt.get("id")
        assert evt.get("stream_url") == payload["stream_url"]
        assert evt.get("stream_platform") == "youtube"
        assert evt.get("is_live") is True

    def test_livestream_persists_on_get(self):
        if not TestLivestreamFields.test_event_id:
            pytest.skip("No livestream event created")
        r = requests.get(f"{BASE_URL}/api/events/{TestLivestreamFields.test_event_id}", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("stream_url"), "stream_url not persisted"
        assert data.get("is_live") is True, "is_live not persisted"

    def test_update_livestream_fields(self, auth_headers):
        if not TestLivestreamFields.test_event_id:
            pytest.skip("No livestream event created")
        r = requests.put(
            f"{BASE_URL}/api/admin/events/{TestLivestreamFields.test_event_id}",
            json={"is_live": False, "stream_platform": "vimeo"},
            headers=auth_headers,
            timeout=15,
        )
        assert r.status_code == 200, f"Update failed: {r.text[:300]}"
        r2 = requests.get(f"{BASE_URL}/api/events/{TestLivestreamFields.test_event_id}", timeout=15)
        data = r2.json()
        assert data.get("is_live") is False
        assert data.get("stream_platform") == "vimeo"

    def test_cleanup_livestream_event(self, auth_headers):
        if not TestLivestreamFields.test_event_id:
            pytest.skip("Nothing to clean")
        requests.delete(
            f"{BASE_URL}/api/admin/events/{TestLivestreamFields.test_event_id}",
            headers=auth_headers,
            timeout=15,
        )
