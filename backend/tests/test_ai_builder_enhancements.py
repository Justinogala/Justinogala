"""
AI Builder enhancements backend tests.
Covers NEW endpoints:
- GET  /api/ai-builder/templates
- POST /api/ai-builder/projects/{id}/duplicate
- POST /api/ai-builder/projects/{id}/share
- GET  /api/ai-builder/shared/{share_token} (public, no auth)
- DELETE /api/ai-builder/projects/{id}/share
- GET  /api/ai-builder/projects/{id}/export/md
- GET  /api/ai-builder/projects/{id}/export/json
- POST /api/ai-builder/projects/{id}/clarify (GPT-5.2 — long timeout)
- PUT  /api/ai-builder/projects/{id}/clarify-answers
- GET  /api/ai-builder/projects/{id}/search?q=...
- PUT  /api/ai-builder/projects/{id}/sections/{section} (manual edit)
"""
import os
import uuid
import requests
import pytest

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "https://new-user-welcome-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@munal.ai"
ADMIN_PASSWORD = "Admin@123456"


# ─── Fixtures ───

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
    assert token, f"No token: {data}"
    return token


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def created_project(auth_headers):
    """Create a fresh test project & add manual content to a section for search/export tests."""
    payload = {
        "title": "TEST_Enhancements_Project",
        "description": "A test SaaS app for verifying AI Builder enhancements like share, export, search.",
        "app_type": "saas",
    }
    r = requests.post(f"{API}/ai-builder/projects", json=payload, headers=auth_headers, timeout=20)
    assert r.status_code == 200, f"Create failed: {r.status_code} {r.text[:300]}"
    proj = r.json()
    proj_id = proj["id"]

    # Add manual content to overview section so search/export tests have data
    section_payload = {
        "content": "## Overview\nThis is a sample overview with the keyword pineapple in it.\nIt also discusses authentication and security best practices."
    }
    r2 = requests.put(
        f"{API}/ai-builder/projects/{proj_id}/sections/overview",
        json=section_payload, headers=auth_headers, timeout=15,
    )
    assert r2.status_code == 200, f"Section update failed: {r2.status_code} {r2.text[:200]}"

    yield proj

    # Cleanup
    try:
        requests.delete(f"{API}/ai-builder/projects/{proj_id}", headers=auth_headers, timeout=15)
    except Exception:
        pass


# ─── Templates (public, no-auth optional) ───

class TestTemplates:
    def test_get_templates_returns_8(self):
        r = requests.get(f"{API}/ai-builder/templates", timeout=30)
        assert r.status_code == 200, f"Status {r.status_code}: {r.text[:200]}"
        data = r.json()
        assert "templates" in data
        templates = data["templates"]
        assert isinstance(templates, list)
        assert len(templates) == 8, f"Expected 8 templates, got {len(templates)}"

        # Validate structure of each template
        required_keys = {"id", "title", "description", "app_type", "icon"}
        ids = []
        for t in templates:
            missing = required_keys - set(t.keys())
            assert not missing, f"Template missing keys {missing}: {t}"
            ids.append(t["id"])

        # Check expected template IDs are present
        expected_ids = {"saas-starter", "ecommerce", "marketplace", "crm",
                        "ai-chatbot", "project-management", "healthcare", "internal-tool"}
        assert expected_ids.issubset(set(ids)), f"Missing template ids: {expected_ids - set(ids)}"


# ─── Manual Section Edit (used by search/export setup) ───

class TestSectionEdit:
    def test_update_section_persists(self, auth_headers, created_project):
        proj_id = created_project["id"]
        content = "## Architecture\nMicroservices with Kubernetes and pineapple-themed naming."
        r = requests.put(
            f"{API}/ai-builder/projects/{proj_id}/sections/architecture",
            json={"content": content}, headers=auth_headers, timeout=15,
        )
        assert r.status_code == 200, f"{r.status_code}: {r.text[:200]}"
        assert r.json().get("success") is True

        # Verify persistence
        g = requests.get(f"{API}/ai-builder/projects/{proj_id}", headers=auth_headers, timeout=15)
        assert g.status_code == 200
        sec = g.json()["sections"]["architecture"]
        assert sec["status"] == "done"
        assert "pineapple" in sec["content"]

    def test_update_section_invalid(self, auth_headers, created_project):
        proj_id = created_project["id"]
        r = requests.put(
            f"{API}/ai-builder/projects/{proj_id}/sections/invalid_section_xyz",
            json={"content": "x"}, headers=auth_headers, timeout=15,
        )
        assert r.status_code == 400


# ─── Duplicate ───

class TestDuplicate:
    def test_duplicate_creates_copy(self, auth_headers, created_project):
        src_id = created_project["id"]
        r = requests.post(
            f"{API}/ai-builder/projects/{src_id}/duplicate",
            headers=auth_headers, timeout=20,
        )
        assert r.status_code == 200, f"{r.status_code}: {r.text[:200]}"
        new_proj = r.json()
        assert new_proj["id"] != src_id
        assert new_proj["title"] == f"{created_project['title']} (Copy)"
        assert new_proj.get("share_token") is None  # share token must not carry over
        # Sections content carried over
        assert "pineapple" in new_proj["sections"]["overview"]["content"]

        # Verify it's persisted independently
        g = requests.get(f"{API}/ai-builder/projects/{new_proj['id']}", headers=auth_headers, timeout=15)
        assert g.status_code == 200

        # Cleanup the duplicate
        requests.delete(f"{API}/ai-builder/projects/{new_proj['id']}", headers=auth_headers, timeout=15)

    def test_duplicate_nonexistent_404(self, auth_headers):
        r = requests.post(
            f"{API}/ai-builder/projects/{uuid.uuid4()}/duplicate",
            headers=auth_headers, timeout=15,
        )
        assert r.status_code == 404


# ─── Share / Public Access / Revoke ───

class TestShare:
    def test_share_full_flow(self, auth_headers, created_project):
        proj_id = created_project["id"]

        # 1. Create share link
        r = requests.post(f"{API}/ai-builder/projects/{proj_id}/share",
                          headers=auth_headers, timeout=15)
        assert r.status_code == 200, f"{r.status_code}: {r.text[:200]}"
        token = r.json().get("share_token")
        assert token and isinstance(token, str) and len(token) >= 8

        # 2. Re-calling share returns same token (idempotent)
        r2 = requests.post(f"{API}/ai-builder/projects/{proj_id}/share",
                           headers=auth_headers, timeout=15)
        assert r2.status_code == 200
        assert r2.json()["share_token"] == token

        # 3. Public access (no auth)
        r3 = requests.get(f"{API}/ai-builder/shared/{token}", timeout=15)
        assert r3.status_code == 200, f"Public GET failed: {r3.status_code} {r3.text[:200]}"
        public_proj = r3.json()
        assert public_proj["id"] == proj_id
        assert "user_id" not in public_proj, "user_id must not leak in shared response"
        assert "pineapple" in public_proj["sections"]["overview"]["content"]

        # 4. Revoke
        r4 = requests.delete(f"{API}/ai-builder/projects/{proj_id}/share",
                             headers=auth_headers, timeout=15)
        assert r4.status_code == 200
        assert r4.json().get("success") is True

        # 5. Public access after revoke -> 404
        r5 = requests.get(f"{API}/ai-builder/shared/{token}", timeout=15)
        assert r5.status_code == 404

    def test_shared_invalid_token_404(self):
        r = requests.get(f"{API}/ai-builder/shared/nonexistent-token-xyz", timeout=15)
        assert r.status_code == 404


# ─── Export ───

class TestExport:
    def test_export_markdown(self, auth_headers, created_project):
        proj_id = created_project["id"]
        r = requests.get(f"{API}/ai-builder/projects/{proj_id}/export/md",
                         headers=auth_headers, timeout=20)
        assert r.status_code == 200, f"{r.status_code}: {r.text[:200]}"
        ct = r.headers.get("content-type", "")
        assert "text/markdown" in ct.lower(), f"content-type was {ct}"
        cd = r.headers.get("content-disposition", "")
        assert "attachment" in cd.lower() and ".md" in cd.lower()
        body = r.text
        assert body.startswith("# "), "Markdown should start with title heading"
        assert created_project["title"] in body
        assert "pineapple" in body  # section content included

    def test_export_json(self, auth_headers, created_project):
        proj_id = created_project["id"]
        r = requests.get(f"{API}/ai-builder/projects/{proj_id}/export/json",
                         headers=auth_headers, timeout=20)
        assert r.status_code == 200
        ct = r.headers.get("content-type", "")
        assert "application/json" in ct.lower()
        cd = r.headers.get("content-disposition", "")
        assert "attachment" in cd.lower() and ".json" in cd.lower()
        data = r.json()
        assert data["id"] == proj_id
        assert "sections" in data
        assert "_id" not in data

    def test_export_invalid_format(self, auth_headers, created_project):
        proj_id = created_project["id"]
        r = requests.get(f"{API}/ai-builder/projects/{proj_id}/export/pdf",
                         headers=auth_headers, timeout=15)
        assert r.status_code == 400

    def test_export_nonexistent_404(self, auth_headers):
        r = requests.get(f"{API}/ai-builder/projects/{uuid.uuid4()}/export/md",
                         headers=auth_headers, timeout=15)
        assert r.status_code == 404


# ─── Clarify (LLM-backed) ───

class TestClarify:
    def test_clarify_returns_questions(self, auth_headers, created_project):
        proj_id = created_project["id"]
        # GPT-5.2 call; allow generous timeout
        r = requests.post(f"{API}/ai-builder/projects/{proj_id}/clarify",
                          headers=auth_headers, timeout=60)
        assert r.status_code == 200, f"{r.status_code}: {r.text[:300]}"
        data = r.json()
        assert "questions" in data
        qs = data["questions"]
        assert isinstance(qs, list) and len(qs) > 0
        # Each question should have at least 'question' key
        for q in qs:
            assert "question" in q, f"Bad question shape: {q}"

    def test_save_clarify_answers(self, auth_headers, created_project):
        proj_id = created_project["id"]
        answers = [
            {"question": "Target audience?", "answer": "Small Business"},
            {"question": "Monetization?", "answer": "Subscription"},
        ]
        r = requests.put(
            f"{API}/ai-builder/projects/{proj_id}/clarify-answers",
            json={"answers": answers}, headers=auth_headers, timeout=15,
        )
        assert r.status_code == 200
        assert r.json().get("success") is True

        # Verify description appended and clarify_answers stored
        g = requests.get(f"{API}/ai-builder/projects/{proj_id}",
                         headers=auth_headers, timeout=15)
        assert g.status_code == 200
        proj = g.json()
        assert "Small Business" in proj["description"]
        assert "Subscription" in proj["description"]
        assert len(proj.get("clarify_answers", [])) == 2


# ─── Search ───

class TestSearch:
    def test_search_finds_matches(self, auth_headers, created_project):
        proj_id = created_project["id"]
        r = requests.get(
            f"{API}/ai-builder/projects/{proj_id}/search",
            params={"q": "pineapple"}, headers=auth_headers, timeout=15,
        )
        assert r.status_code == 200, f"{r.status_code}: {r.text[:200]}"
        data = r.json()
        assert "results" in data
        assert data.get("total", 0) >= 1
        # Should hit at least the overview section
        sections_hit = {res["section"] for res in data["results"]}
        assert "overview" in sections_hit
        # Validate snippet shape
        first = data["results"][0]
        for key in ("section", "section_label", "line", "snippet"):
            assert key in first

    def test_search_case_insensitive(self, auth_headers, created_project):
        proj_id = created_project["id"]
        r = requests.get(
            f"{API}/ai-builder/projects/{proj_id}/search",
            params={"q": "PINEAPPLE"}, headers=auth_headers, timeout=15,
        )
        assert r.status_code == 200
        assert r.json()["total"] >= 1

    def test_search_empty_query(self, auth_headers, created_project):
        proj_id = created_project["id"]
        r = requests.get(
            f"{API}/ai-builder/projects/{proj_id}/search",
            params={"q": ""}, headers=auth_headers, timeout=15,
        )
        assert r.status_code == 200
        assert r.json()["results"] == []

    def test_search_no_match(self, auth_headers, created_project):
        proj_id = created_project["id"]
        r = requests.get(
            f"{API}/ai-builder/projects/{proj_id}/search",
            params={"q": "zzzzz_unlikely_keyword_xyz"}, headers=auth_headers, timeout=15,
        )
        assert r.status_code == 200
        assert r.json()["total"] == 0

    def test_search_nonexistent_project(self, auth_headers):
        r = requests.get(
            f"{API}/ai-builder/projects/{uuid.uuid4()}/search",
            params={"q": "test"}, headers=auth_headers, timeout=15,
        )
        assert r.status_code == 404
