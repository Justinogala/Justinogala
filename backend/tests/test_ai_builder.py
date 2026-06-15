"""
AI Builder backend API tests.
Covers: CRUD on /api/ai-builder/projects, section update, auth guards, and SSE generation handshake.
"""
import os
import json
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://new-user-welcome-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@munal.ai"
ADMIN_PASSWORD = "Admin@123456"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(
        f"{API}/auth/login?skip_2fa=true",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=20,
    )
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text[:200]}"
    data = r.json()
    token = data.get("token") or data.get("access_token")
    assert token, f"No token in login response: {data}"
    return token


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ─── Auth guard ───
class TestAuthGuard:
    def test_list_requires_auth(self):
        r = requests.get(f"{API}/ai-builder/projects", timeout=15)
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}"

    def test_create_requires_auth(self):
        r = requests.post(f"{API}/ai-builder/projects",
                          json={"title": "x", "description": "1234567890", "app_type": "saas"},
                          timeout=15)
        assert r.status_code in (401, 403)

    def test_get_requires_auth(self):
        r = requests.get(f"{API}/ai-builder/projects/{uuid.uuid4()}", timeout=15)
        assert r.status_code in (401, 403)


# ─── CRUD ───
class TestAIBuilderCRUD:
    created_id = None

    def test_01_create_project(self, auth_headers):
        payload = {
            "title": "TEST_AIBuilder_Project",
            "description": "An automated test project for verifying AI Builder CRUD endpoints.",
            "app_type": "saas",
        }
        r = requests.post(f"{API}/ai-builder/projects", json=payload, headers=auth_headers, timeout=20)
        assert r.status_code == 200, f"Create failed: {r.status_code} {r.text[:300]}"
        data = r.json()
        assert "id" in data
        assert data["title"] == payload["title"]
        assert data["description"] == payload["description"]
        assert data["app_type"] == "saas"
        assert "sections" in data and isinstance(data["sections"], dict)
        for s in ["overview", "requirements", "architecture", "database",
                  "security", "apis", "documentation", "roadmap", "code", "deployment"]:
            assert s in data["sections"], f"Missing section {s}"
            assert data["sections"][s]["status"] == "pending"
        assert "_id" not in data, "Mongo _id leaked"
        TestAIBuilderCRUD.created_id = data["id"]

    def test_02_list_projects_includes_created(self, auth_headers):
        r = requests.get(f"{API}/ai-builder/projects", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert TestAIBuilderCRUD.created_id is not None
        ids = [p["id"] for p in items]
        assert TestAIBuilderCRUD.created_id in ids
        match = next(p for p in items if p["id"] == TestAIBuilderCRUD.created_id)
        assert "section_status" in match
        assert match["section_status"]["overview"] == "pending"
        assert "_id" not in match

    def test_03_get_project_by_id(self, auth_headers):
        pid = TestAIBuilderCRUD.created_id
        r = requests.get(f"{API}/ai-builder/projects/{pid}", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == pid
        assert data["title"] == "TEST_AIBuilder_Project"
        assert len(data["sections"]) == 10

    def test_04_get_project_404(self, auth_headers):
        r = requests.get(f"{API}/ai-builder/projects/{uuid.uuid4()}", headers=auth_headers, timeout=20)
        assert r.status_code == 404

    def test_05_manual_section_update(self, auth_headers):
        pid = TestAIBuilderCRUD.created_id
        payload = {"content": "# Manual Overview\n\nThis was manually written."}
        r = requests.put(f"{API}/ai-builder/projects/{pid}/sections/overview",
                         json=payload, headers=auth_headers, timeout=20)
        assert r.status_code == 200
        assert r.json().get("success") is True

        # Verify persistence via GET
        r2 = requests.get(f"{API}/ai-builder/projects/{pid}", headers=auth_headers, timeout=20)
        assert r2.status_code == 200
        proj = r2.json()
        assert proj["sections"]["overview"]["content"] == payload["content"]
        assert proj["sections"]["overview"]["status"] == "done"
        assert proj["sections"]["overview"]["generated_at"] is not None

    def test_06_invalid_section_400(self, auth_headers):
        pid = TestAIBuilderCRUD.created_id
        r = requests.put(f"{API}/ai-builder/projects/{pid}/sections/notasection",
                         json={"content": "x"}, headers=auth_headers, timeout=15)
        assert r.status_code == 400

    def test_07_sse_generate_overview_headers(self, auth_headers):
        """Just verify SSE endpoint returns 200 and text/event-stream; don't wait full LLM."""
        pid = TestAIBuilderCRUD.created_id
        with requests.post(
            f"{API}/ai-builder/projects/{pid}/generate/overview",
            headers={"Authorization": auth_headers["Authorization"]},
            stream=True, timeout=30,
        ) as r:
            assert r.status_code == 200, f"SSE status {r.status_code} body={r.text[:200]}"
            ctype = r.headers.get("content-type", "")
            assert "text/event-stream" in ctype, f"Wrong content-type: {ctype}"
            # Try reading first event (start event) without waiting full LLM
            got_event = False
            for raw in r.iter_lines(decode_unicode=True):
                if raw and raw.startswith("data:"):
                    payload = raw[5:].strip()
                    try:
                        evt = json.loads(payload)
                        assert "type" in evt
                        got_event = True
                        if evt["type"] in ("start", "chunk", "error"):
                            break
                    except json.JSONDecodeError:
                        pass
            assert got_event, "No SSE data event received"

    def test_08_sse_invalid_section_400(self, auth_headers):
        pid = TestAIBuilderCRUD.created_id
        r = requests.post(f"{API}/ai-builder/projects/{pid}/generate/notasection",
                          headers=auth_headers, timeout=15)
        assert r.status_code == 400

    def test_09_sse_project_not_found(self, auth_headers):
        r = requests.post(f"{API}/ai-builder/projects/{uuid.uuid4()}/generate/overview",
                          headers=auth_headers, timeout=15)
        assert r.status_code == 404

    def test_10_delete_project(self, auth_headers):
        pid = TestAIBuilderCRUD.created_id
        r = requests.delete(f"{API}/ai-builder/projects/{pid}", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        assert r.json().get("success") is True
        # Verify gone
        r2 = requests.get(f"{API}/ai-builder/projects/{pid}", headers=auth_headers, timeout=20)
        assert r2.status_code == 404

    def test_11_delete_nonexistent_404(self, auth_headers):
        r = requests.delete(f"{API}/ai-builder/projects/{uuid.uuid4()}", headers=auth_headers, timeout=15)
        assert r.status_code == 404


class TestCreateValidation:
    def test_create_short_description_422(self, auth_headers):
        r = requests.post(f"{API}/ai-builder/projects",
                          json={"title": "x", "description": "tiny", "app_type": "saas"},
                          headers=auth_headers, timeout=15)
        assert r.status_code == 422  # description min_length=10

    def test_create_missing_title_422(self, auth_headers):
        r = requests.post(f"{API}/ai-builder/projects",
                          json={"description": "1234567890"},
                          headers=auth_headers, timeout=15)
        assert r.status_code == 422
