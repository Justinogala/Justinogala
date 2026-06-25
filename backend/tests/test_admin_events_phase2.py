"""
Backend tests for Admin Events Management (Phase 2):
- CRUD: create / update / delete / duplicate
- Application management: list / update status / CSV export
- Analytics overview
- QR code, check-in, attendance
- Certificate generation and public verification
- Public events location is 'Online (Jizira, Munal AI)' / event_type 'Virtual'
"""
import os
import uuid
import pytest
import requests

def _load_frontend_url():
    p = "/app/frontend/.env"
    if os.path.exists(p):
        with open(p) as fh:
            for line in fh:
                line = line.strip()
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _load_frontend_url()).rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL not configured"
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@munal.ai"
ADMIN_PASSWORD = "Admin@123456"


# ---------- Fixtures ----------

@pytest.fixture(scope="module")
def admin_token():
    """Login admin with skip_2fa flag."""
    # Try query param style first
    r = requests.post(
        f"{API}/auth/login?skip_2fa=true",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=30,
    )
    if r.status_code != 200:
        # Try body flag
        r = requests.post(
            f"{API}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD, "skip_2fa": True},
            timeout=30,
        )
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text[:200]}")
    data = r.json()
    token = data.get("access_token") or data.get("token") or (data.get("data") or {}).get("access_token")
    if not token:
        pytest.skip(f"No token in admin login response: {data}")
    return token


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def created_event(admin_headers):
    """Create an event used by subsequent tests; cleaned up via soft delete at end."""
    payload = {
        "title": f"TEST_AdminEvent_{uuid.uuid4().hex[:6]}",
        "description": "Pytest created event",
        "category": "AI",
        "event_type": "Virtual",
        "date": "2026-12-15",
        "end_date": "2026-12-15",
        "time": "10:00 AM",
        "duration": "2h",
        "location": "Online (Jizira, Munal AI)",
        "status": "registration_open",
        "price": "Free",
        "seats": 50,
        "tags": ["test", "ai"],
    }
    r = requests.post(f"{API}/admin/events", json=payload, headers=admin_headers, timeout=30)
    assert r.status_code == 200, f"Create event failed: {r.status_code} {r.text[:300]}"
    body = r.json()
    assert body.get("success") is True
    event = body["event"]
    assert event["title"] == payload["title"]
    assert event["location"] == "Online (Jizira, Munal AI)"
    yield event
    # Teardown
    requests.delete(f"{API}/admin/events/{event['id']}", headers=admin_headers, timeout=30)


# ---------- CRUD ----------

class TestEventCRUD:
    def test_create_event_persists(self, created_event, admin_headers):
        # GET via admin-listed analytics top events does not guarantee inclusion;
        # use the public events listing (id should appear in some page)
        r = requests.get(f"{API}/events?limit=500", timeout=30)
        assert r.status_code == 200
        ids = [e.get("id") for e in (r.json().get("events") or [])]
        # event is registration_open -> should appear on public list
        assert created_event["id"] in ids

    def test_update_event(self, created_event, admin_headers):
        new_title = created_event["title"] + "_UPD"
        r = requests.put(
            f"{API}/admin/events/{created_event['id']}",
            json={"title": new_title, "seats": 75},
            headers=admin_headers,
            timeout=30,
        )
        assert r.status_code == 200, r.text[:300]
        ev = r.json()["event"]
        assert ev["title"] == new_title
        assert ev["seats"] == 75
        # mutate fixture so duplicate test uses the latest title
        created_event["title"] = new_title

    def test_duplicate_event(self, created_event, admin_headers):
        r = requests.post(
            f"{API}/admin/events/{created_event['id']}/duplicate",
            headers=admin_headers, timeout=30,
        )
        assert r.status_code == 200, r.text[:300]
        dup = r.json()["event"]
        assert dup["id"] != created_event["id"]
        assert dup["title"].endswith("(Copy)")
        assert dup["status"] == "draft"
        # cleanup duplicate
        requests.delete(f"{API}/admin/events/{dup['id']}", headers=admin_headers, timeout=30)

    def test_update_nonexistent_event_404(self, admin_headers):
        r = requests.put(
            f"{API}/admin/events/nonexistent-id-xyz",
            json={"title": "x"}, headers=admin_headers, timeout=30,
        )
        assert r.status_code == 404


# ---------- Applications + CSV ----------

@pytest.fixture(scope="module")
def submitted_application(created_event):
    """Submit an application to created_event via public endpoint."""
    payload = {
        "first_name": "TEST",
        "last_name": "User",
        "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
        "phone": "+10000000000",
        "company": "TestCo",
        "position": "QA",
        "country": "US",
        "linkedin": "",
        "industry": "Tech",
        "years_experience": "1-3",
        "why_attend": "QA",
        "accept_terms": True,
    }
    r = requests.post(f"{API}/events/{created_event['id']}/apply", json=payload, timeout=30)
    assert r.status_code in (200, 201), f"Apply failed: {r.status_code} {r.text[:300]}"
    body = r.json()
    app_obj = body.get("application") or body
    # Make sure we have id and email
    if "id" not in app_obj:
        # fall back: search via admin list
        pass
    app_obj["_submitted_email"] = payload["email"]
    return app_obj


class TestApplications:
    def test_list_applications(self, created_event, admin_headers, submitted_application):
        r = requests.get(
            f"{API}/admin/events/{created_event['id']}/applications",
            headers=admin_headers, timeout=30,
        )
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert "applications" in data and "total" in data and "stats" in data
        assert data["total"] >= 1
        emails = [a.get("email") for a in data["applications"]]
        assert submitted_application["_submitted_email"] in emails

    def test_update_application_status(self, created_event, admin_headers, submitted_application):
        # Find app id from list
        r = requests.get(
            f"{API}/admin/events/{created_event['id']}/applications",
            headers=admin_headers, timeout=30,
        )
        apps = r.json()["applications"]
        target = next(a for a in apps if a["email"] == submitted_application["_submitted_email"])
        app_id = target["id"]
        submitted_application["id"] = app_id

        r = requests.put(
            f"{API}/admin/events/applications/{app_id}",
            json={"status": "accepted"}, headers=admin_headers, timeout=30,
        )
        assert r.status_code == 200, r.text[:300]
        assert r.json()["status"] == "accepted"

        # Verify persistence
        r2 = requests.get(
            f"{API}/admin/events/{created_event['id']}/applications?status=accepted",
            headers=admin_headers, timeout=30,
        )
        assert r2.status_code == 200
        emails = [a["email"] for a in r2.json()["applications"]]
        assert submitted_application["_submitted_email"] in emails

    def test_invalid_status_rejected(self, admin_headers, submitted_application):
        app_id = submitted_application.get("id")
        if not app_id:
            pytest.skip("no app id captured")
        r = requests.put(
            f"{API}/admin/events/applications/{app_id}",
            json={"status": "bogus"}, headers=admin_headers, timeout=30,
        )
        assert r.status_code == 400

    def test_export_csv(self, created_event, admin_headers):
        r = requests.get(
            f"{API}/admin/events/{created_event['id']}/applications/export",
            headers=admin_headers, timeout=30,
        )
        assert r.status_code == 200, r.text[:300]
        ct = r.headers.get("content-type", "")
        assert "text/csv" in ct, f"unexpected content-type {ct}"
        body = r.text
        assert "First Name" in body and "Email" in body


# ---------- Analytics ----------

class TestAnalytics:
    def test_overview(self, admin_headers):
        r = requests.get(f"{API}/admin/events/analytics/overview", headers=admin_headers, timeout=30)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        for k in ["total_events", "total_applications", "fill_rate", "categories", "top_events", "application_stats"]:
            assert k in data, f"missing {k}"
        assert isinstance(data["total_events"], int) and data["total_events"] >= 1
        assert isinstance(data["categories"], dict)
        assert isinstance(data["top_events"], list)


# ---------- QR / Check-in / Attendance ----------

class TestCheckinAttendance:
    def test_qr_code(self, created_event, admin_headers):
        r = requests.get(
            f"{API}/admin/events/{created_event['id']}/qr-code",
            headers=admin_headers, timeout=30,
        )
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert data["event_id"] == created_event["id"]
        assert data["checkin_url"].endswith("/checkin")
        assert len(data["qr_token"]) == 16

    def test_checkin_attendee(self, created_event, admin_headers, submitted_application):
        email = submitted_application["_submitted_email"]
        r = requests.post(
            f"{API}/admin/events/{created_event['id']}/checkin",
            params={"email": email}, headers=admin_headers, timeout=30,
        )
        assert r.status_code == 200, r.text[:300]
        assert r.json()["success"] is True

    def test_attendance_report(self, created_event, admin_headers):
        r = requests.get(
            f"{API}/admin/events/{created_event['id']}/attendance",
            headers=admin_headers, timeout=30,
        )
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert data["event_id"] == created_event["id"]
        assert data["checked_in"] >= 1
        assert isinstance(data["attendees"], list)


# ---------- Certificates ----------

class TestCertificates:
    def test_generate_and_verify_certificate(self, created_event, admin_headers):
        r = requests.post(
            f"{API}/admin/events/{created_event['id']}/certificates/generate",
            headers=admin_headers, timeout=30,
        )
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert data["success"] is True
        assert data["certificates_generated"] >= 1
        cert = data["certificates"][0]
        cert_id = cert["id"]

        # Public verify (no auth)
        r2 = requests.get(f"{API}/admin/events/certificates/{cert_id}/verify", timeout=30)
        assert r2.status_code == 200, r2.text[:300]
        body = r2.json()
        assert body["valid"] is True
        assert body["certificate"]["id"] == cert_id

    def test_verify_unknown_cert_404(self):
        r = requests.get(f"{API}/admin/events/certificates/NONEXIST/verify", timeout=30)
        assert r.status_code == 404


# ---------- Public events location update ----------

class TestPublicEventsLocation:
    def test_all_events_online_jizira(self):
        r = requests.get(f"{API}/events?limit=500", timeout=30)
        assert r.status_code == 200
        events = r.json().get("events") or []
        assert len(events) > 0
        bad = [e for e in events if e.get("location") != "Online (Jizira, Munal AI)"]
        # Allow drafts/duplicates with different state but flag if seeded events are wrong
        # Print info for first few wrong
        assert not bad, f"{len(bad)} events do not have 'Online (Jizira, Munal AI)' location. Examples: {[(e.get('title'), e.get('location')) for e in bad[:3]]}"

    def test_all_events_virtual_type(self):
        r = requests.get(f"{API}/events?limit=500", timeout=30)
        events = r.json().get("events") or []
        bad = [e for e in events if e.get("event_type") != "Virtual"]
        assert not bad, f"{len(bad)} events not Virtual. Examples: {[(e.get('title'), e.get('event_type')) for e in bad[:3]]}"


# ---------- Auth required ----------

class TestAuthRequired:
    def test_create_event_unauth(self):
        r = requests.post(f"{API}/admin/events", json={"title": "x", "date": "2026-12-31"}, timeout=30)
        assert r.status_code in (401, 403)

    def test_analytics_unauth(self):
        r = requests.get(f"{API}/admin/events/analytics/overview", timeout=30)
        assert r.status_code in (401, 403)
