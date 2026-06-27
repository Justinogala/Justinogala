"""Phase C Academy backend tests — Pathways, Labs, Capstone Projects, Certification Pathways."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://new-user-welcome-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
COURSE_ID = "05fc09f9-b57f-45b9-8ff1-f718c8a2ce1c"
TEST_USER = {"email": "testacademy@munal.ai", "password": "Test@12345"}


@pytest.fixture(scope="module")
def auth_token():
    r = requests.post(f"{API}/auth/login", json=TEST_USER, timeout=30)
    if r.status_code != 200:
        pytest.skip(f"Login failed {r.status_code}: {r.text[:200]}")
    data = r.json()
    tok = data.get("access_token") or data.get("token") or (data.get("user", {}) or {}).get("token")
    if not tok:
        pytest.skip(f"No token in login response: {data}")
    return tok


@pytest.fixture
def headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


# ---------- Pathways ----------
class TestPathways:
    def test_list_pathways_public(self):
        r = requests.get(f"{API}/academy/pathways", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "pathways" in data
        assert isinstance(data["pathways"], list)
        assert len(data["pathways"]) == 8, f"Expected 8 pathways, got {len(data['pathways'])}"
        p = data["pathways"][0]
        for k in ("id", "title", "icon", "color", "level", "course_count"):
            assert k in p, f"Missing key {k} in pathway"
        assert p["course_count"] > 0

    def test_list_pathways_authenticated(self, headers):
        r = requests.get(f"{API}/academy/pathways", headers=headers, timeout=30)
        assert r.status_code == 200
        for p in r.json()["pathways"]:
            assert "enrolled" in p
            assert "progress" in p

    def test_get_pathway_detail(self, headers):
        lst = requests.get(f"{API}/academy/pathways", headers=headers, timeout=30).json()["pathways"]
        pid = lst[0]["id"]
        r = requests.get(f"{API}/academy/pathways/{pid}", headers=headers, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["id"] == pid
        assert "courses" in d
        assert isinstance(d["courses"], list)
        assert d["course_count"] == len(d["courses"])

    def test_get_pathway_404(self):
        r = requests.get(f"{API}/academy/pathways/nonexistent-id", timeout=30)
        assert r.status_code == 404

    def test_enroll_pathway(self, headers):
        lst = requests.get(f"{API}/academy/pathways", headers=headers, timeout=30).json()["pathways"]
        pid = lst[0]["id"]
        r = requests.post(f"{API}/academy/pathways/{pid}/enroll", headers=headers, timeout=30)
        assert r.status_code == 200, r.text
        assert r.json().get("success") is True
        # Idempotent
        r2 = requests.post(f"{API}/academy/pathways/{pid}/enroll", headers=headers, timeout=30)
        assert r2.status_code == 200

    def test_enroll_pathway_unauthorized(self):
        r = requests.post(f"{API}/academy/pathways/any-id/enroll", timeout=30)
        assert r.status_code in (401, 403)


# ---------- Practice Labs ----------
class TestLabs:
    def test_list_labs(self):
        r = requests.get(f"{API}/academy/courses/{COURSE_ID}/labs", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "labs" in data
        assert isinstance(data["labs"], list)
        assert len(data["labs"]) >= 1
        lab = data["labs"][0]
        for k in ("id", "title", "description", "difficulty"):
            assert k in lab

    def test_submit_lab(self, headers):
        labs = requests.get(f"{API}/academy/courses/{COURSE_ID}/labs", headers=headers, timeout=30).json()["labs"]
        assert labs, "No labs found for course"
        lab_id = labs[0]["id"]
        payload = {"content": "TEST_ submission content", "repo_url": "https://github.com/test/repo"}
        r = requests.post(
            f"{API}/academy/courses/{COURSE_ID}/labs/{lab_id}/submit",
            headers=headers, json=payload, timeout=30,
        )
        assert r.status_code == 200, r.text
        assert r.json().get("success") is True

        # Verify by re-listing
        labs2 = requests.get(f"{API}/academy/courses/{COURSE_ID}/labs", headers=headers, timeout=30).json()["labs"]
        sub = next((l for l in labs2 if l["id"] == lab_id), None)
        assert sub and sub.get("submitted") is True

    def test_submit_lab_unauthenticated(self):
        r = requests.post(
            f"{API}/academy/courses/{COURSE_ID}/labs/any-lab/submit",
            json={"content": "x"}, timeout=30,
        )
        assert r.status_code in (401, 403)


# ---------- Capstone Projects ----------
class TestCapstone:
    created_id = None

    def test_list_capstone_empty_ok(self, headers):
        r = requests.get(f"{API}/academy/capstone-projects", headers=headers, timeout=30)
        assert r.status_code == 200
        assert "projects" in r.json()

    def test_create_capstone(self, headers):
        payload = {
            "title": "TEST_ Capstone Project",
            "description": "Phase C testing capstone",
            "repo_url": "https://github.com/test/cap",
            "demo_url": "https://demo.test",
            "builder_project_id": "",
        }
        r = requests.post(f"{API}/academy/capstone-projects", headers=headers, json=payload, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["success"] is True
        proj = d["project"]
        assert proj["title"] == payload["title"]
        assert proj["status"] == "submitted"
        TestCapstone.created_id = proj["id"]

        # Verify persistence
        lst = requests.get(f"{API}/academy/capstone-projects", headers=headers, timeout=30).json()["projects"]
        assert any(p["id"] == proj["id"] for p in lst)

    def test_update_capstone(self, headers):
        assert TestCapstone.created_id, "Skip if create failed"
        payload = {
            "title": "TEST_ Capstone Updated",
            "description": "Updated description",
            "repo_url": "https://github.com/test/cap2",
            "demo_url": "https://demo2.test",
            "builder_project_id": "",
        }
        r = requests.put(
            f"{API}/academy/capstone-projects/{TestCapstone.created_id}",
            headers=headers, json=payload, timeout=30,
        )
        assert r.status_code == 200, r.text
        assert r.json()["project"]["title"] == "TEST_ Capstone Updated"

    def test_update_capstone_404(self, headers):
        r = requests.put(
            f"{API}/academy/capstone-projects/nonexistent",
            headers=headers, json={"title": "x", "description": "", "repo_url": "", "demo_url": "", "builder_project_id": ""},
            timeout=30,
        )
        assert r.status_code == 404


# ---------- Certification Pathways ----------
class TestCertifications:
    def test_list_certifications(self):
        r = requests.get(f"{API}/academy/certification-pathways", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "pathways" in data
        assert len(data["pathways"]) == 8, f"Expected 8 certs got {len(data['pathways'])}"
        c = data["pathways"][0]
        for k in ("id", "title", "provider", "url", "level"):
            assert k in c
