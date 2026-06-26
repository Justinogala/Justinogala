"""Academy Phase A features: AI Tutor, AI Summary, Notes, Discussions, Resources"""
import os
import pytest
import requests
import uuid

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://new-user-welcome-2.preview.emergentagent.com").rstrip("/")
TEST_EMAIL = "testacademy@munal.ai"
TEST_PASSWORD = "Test@12345"
COURSE_ID = "05fc09f9-b57f-45b9-8ff1-f718c8a2ce1c"
LESSON_ID = "6d46d9c2-158a-4070-8abf-26ce74e90070"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Login failed: {r.status_code} {r.text[:200]}")
    data = r.json()
    tok = data.get("token") or data.get("access_token") or (data.get("session") or {}).get("token")
    if not tok:
        pytest.skip(f"No token in login response: {data}")
    return tok


@pytest.fixture(scope="module")
def auth(token):
    return {"Authorization": f"Bearer {token}"}


# ============ AI Tutor ============

class TestAiTutor:
    def test_tutor_chat(self, auth):
        r = requests.post(
            f"{BASE_URL}/api/academy/courses/{COURSE_ID}/ai-tutor",
            json={"message": "What is machine learning in one sentence?", "lesson_id": LESSON_ID},
            headers=auth, timeout=60,
        )
        assert r.status_code == 200, r.text[:400]
        data = r.json()
        assert "response" in data
        assert isinstance(data["response"], str) and len(data["response"]) > 0

    def test_tutor_history(self, auth):
        r = requests.get(
            f"{BASE_URL}/api/academy/courses/{COURSE_ID}/ai-tutor/history",
            headers=auth,
        )
        assert r.status_code == 200, r.text[:400]
        data = r.json()
        assert "messages" in data
        assert isinstance(data["messages"], list)
        # Should contain at least the prior chat exchange (2 messages)
        assert len(data["messages"]) >= 2
        roles = {m.get("role") for m in data["messages"]}
        assert "user" in roles and "assistant" in roles

    def test_tutor_chat_unauth(self):
        r = requests.post(
            f"{BASE_URL}/api/academy/courses/{COURSE_ID}/ai-tutor",
            json={"message": "test"},
        )
        assert r.status_code in (401, 403)


# ============ AI Summary ============

class TestSummary:
    def test_get_existing_summary(self, auth):
        r = requests.get(
            f"{BASE_URL}/api/academy/courses/{COURSE_ID}/lessons/{LESSON_ID}/summary",
            headers=auth,
        )
        assert r.status_code == 200, r.text[:400]
        data = r.json()
        assert "summary" in data
        if data["summary"]:
            assert "content" in data["summary"]
            assert data["summary"].get("lesson_id") == LESSON_ID

    def test_generate_summary_idempotent(self, auth):
        # POST should return existing if already exists, or create new
        r = requests.post(
            f"{BASE_URL}/api/academy/courses/{COURSE_ID}/lessons/{LESSON_ID}/summary",
            headers=auth, timeout=90,
        )
        assert r.status_code == 200, r.text[:400]
        data = r.json()
        assert "summary" in data
        assert data["summary"]["lesson_id"] == LESSON_ID
        assert len(data["summary"]["content"]) > 50

    def test_summary_requires_enrollment(self):
        # Without auth, the GET endpoint uses optional auth so likely succeeds — test POST instead
        r = requests.post(
            f"{BASE_URL}/api/academy/courses/{COURSE_ID}/lessons/{LESSON_ID}/summary",
        )
        assert r.status_code in (401, 403)


# ============ Personal Notes ============

class TestNotes:
    def test_save_notes(self, auth):
        content = f"TEST_note content {uuid.uuid4().hex[:6]}"
        r = requests.post(
            f"{BASE_URL}/api/academy/courses/{COURSE_ID}/lessons/{LESSON_ID}/notes",
            json={"content": content, "lesson_id": LESSON_ID},
            headers=auth,
        )
        assert r.status_code == 200, r.text[:400]
        data = r.json()
        assert data["note"]["content"] == content

    def test_get_notes_after_save(self, auth):
        r = requests.get(
            f"{BASE_URL}/api/academy/courses/{COURSE_ID}/lessons/{LESSON_ID}/notes",
            headers=auth,
        )
        assert r.status_code == 200
        data = r.json()
        assert data["note"] is not None
        assert "TEST_note" in data["note"]["content"]

    def test_update_notes_upsert(self, auth):
        new_content = f"TEST_note updated {uuid.uuid4().hex[:6]}"
        r = requests.post(
            f"{BASE_URL}/api/academy/courses/{COURSE_ID}/lessons/{LESSON_ID}/notes",
            json={"content": new_content, "lesson_id": LESSON_ID},
            headers=auth,
        )
        assert r.status_code == 200
        data = r.json()
        assert data.get("updated") is True
        assert data["note"]["content"] == new_content


# ============ Discussions ============

class TestDiscussions:
    discussion_id = None

    def test_list_discussions(self, auth):
        r = requests.get(
            f"{BASE_URL}/api/academy/courses/{COURSE_ID}/discussions",
            headers=auth,
        )
        assert r.status_code == 200, r.text[:400]
        data = r.json()
        assert "discussions" in data
        assert "total" in data
        assert isinstance(data["discussions"], list)
        for d in data["discussions"]:
            assert "reply_count" in d

    def test_create_discussion(self, auth):
        title = f"TEST_disc_{uuid.uuid4().hex[:6]}"
        r = requests.post(
            f"{BASE_URL}/api/academy/courses/{COURSE_ID}/discussions",
            json={"title": title, "content": "Test discussion content", "lesson_id": ""},
            headers=auth,
        )
        assert r.status_code == 200, r.text[:400]
        d = r.json()["discussion"]
        assert d["title"] == title
        assert d["upvotes"] == 0
        TestDiscussions.discussion_id = d["id"]

    def test_create_discussion_unauth_blocked(self):
        r = requests.post(
            f"{BASE_URL}/api/academy/courses/{COURSE_ID}/discussions",
            json={"title": "x", "content": "y"},
        )
        assert r.status_code in (401, 403)

    def test_get_discussion(self, auth):
        if not TestDiscussions.discussion_id:
            pytest.skip("no discussion created")
        r = requests.get(
            f"{BASE_URL}/api/academy/courses/{COURSE_ID}/discussions/{TestDiscussions.discussion_id}",
            headers=auth,
        )
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == TestDiscussions.discussion_id
        assert "replies" in data
        assert isinstance(data["replies"], list)

    def test_reply(self, auth):
        if not TestDiscussions.discussion_id:
            pytest.skip("no discussion")
        r = requests.post(
            f"{BASE_URL}/api/academy/courses/{COURSE_ID}/discussions/{TestDiscussions.discussion_id}/replies",
            json={"content": "TEST_reply content"},
            headers=auth,
        )
        assert r.status_code == 200
        assert r.json()["reply"]["content"] == "TEST_reply content"

        # Verify reply persisted via GET discussion
        r2 = requests.get(
            f"{BASE_URL}/api/academy/courses/{COURSE_ID}/discussions/{TestDiscussions.discussion_id}",
            headers=auth,
        )
        assert any("TEST_reply" in rep["content"] for rep in r2.json()["replies"])

    def test_upvote_toggle(self, auth):
        if not TestDiscussions.discussion_id:
            pytest.skip("no discussion")
        r1 = requests.post(
            f"{BASE_URL}/api/academy/courses/{COURSE_ID}/discussions/{TestDiscussions.discussion_id}/upvote",
            headers=auth,
        )
        assert r1.status_code == 200
        d1 = r1.json()
        assert d1["action"] in ("added", "removed")
        first_upvotes = d1["upvotes"]

        # Toggle again
        r2 = requests.post(
            f"{BASE_URL}/api/academy/courses/{COURSE_ID}/discussions/{TestDiscussions.discussion_id}/upvote",
            headers=auth,
        )
        assert r2.status_code == 200
        assert r2.json()["action"] != d1["action"]
        assert r2.json()["upvotes"] != first_upvotes

    def test_reply_counts_in_list(self, auth):
        if not TestDiscussions.discussion_id:
            pytest.skip("no discussion")
        r = requests.get(
            f"{BASE_URL}/api/academy/courses/{COURSE_ID}/discussions",
            headers=auth,
        )
        ours = next((d for d in r.json()["discussions"] if d["id"] == TestDiscussions.discussion_id), None)
        assert ours is not None
        assert ours["reply_count"] >= 1


# ============ Resources ============

class TestResources:
    def test_lessons_have_resources(self, auth):
        r = requests.get(f"{BASE_URL}/api/academy/courses/{COURSE_ID}", headers=auth)
        assert r.status_code == 200
        course = r.json()
        lessons = course.get("lessons", [])
        assert len(lessons) > 0
        # At least the target lesson should have a resources array
        target = next((l for l in lessons if l.get("id") == LESSON_ID), None)
        assert target is not None
        assert "resources" in target
        assert isinstance(target["resources"], list)
        if target["resources"]:
            res = target["resources"][0]
            assert "id" in res and "title" in res and "url" in res and "type" in res
