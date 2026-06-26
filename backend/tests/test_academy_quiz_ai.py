"""
Academy Quiz + AI Generator Tests
Covers:
- POST /api/academy/admin/courses/generate (AI Course Generator)
- POST /api/academy/admin/courses/generate-quiz (AI Quiz Generator)
- Course CRUD with pass_threshold & lesson quiz
- POST /api/academy/courses/{id}/lessons/{lesson_id}/quiz-submit
- Certificate quiz_score / quiz_passed / pass_threshold / status fields
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://new-user-welcome-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@munal.com"
ADMIN_PASSWORD = "Munal@AI#2026!X7qP9"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(
        f"{API}/auth/login?skip_2fa=true",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=30,
    )
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("access_token") or data.get("token")
    assert token, f"No token in login response: {data}"
    return token


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def admin_user(admin_headers):
    # No /me endpoint - return placeholder; identity comes from token
    return {"email": ADMIN_EMAIL}


# ====================== Course CRUD with pass_threshold + quiz ======================

class TestCourseWithQuiz:
    course_id = None
    lesson_id = None

    def test_create_course_with_pass_threshold_and_quiz(self, admin_headers):
        payload = {
            "title": f"TEST_Quiz_Course_{uuid.uuid4().hex[:6]}",
            "description": "Testing quiz feature",
            "category": "AI",
            "level": "beginner",
            "status": "published",
            "pass_threshold": 80,
            "lessons": [
                {
                    "title": "Intro Lesson",
                    "description": "Basics",
                    "duration": "10 min",
                    "type": "video",
                    "order": 0,
                    "quiz": [
                        {
                            "question": "What is 2+2?",
                            "options": ["3", "4", "5", "6"],
                            "correct_answer": 1,
                            "explanation": "Basic addition",
                        },
                        {
                            "question": "What is the capital of France?",
                            "options": ["London", "Berlin", "Paris", "Madrid"],
                            "correct_answer": 2,
                            "explanation": "Paris is the capital",
                        },
                    ],
                }
            ],
        }
        r = requests.post(f"{API}/academy/admin/courses", json=payload, headers=admin_headers, timeout=15)
        assert r.status_code == 200, f"Create failed: {r.status_code} {r.text}"
        data = r.json()
        assert data.get("success") is True
        course = data["course"]
        assert course["pass_threshold"] == 80
        assert len(course["lessons"]) == 1
        assert len(course["lessons"][0]["quiz"]) == 2
        assert "id" in course["lessons"][0]
        TestCourseWithQuiz.course_id = course["id"]
        TestCourseWithQuiz.lesson_id = course["lessons"][0]["id"]

    def test_get_course_persists_quiz(self, admin_headers):
        cid = TestCourseWithQuiz.course_id
        r = requests.get(f"{API}/academy/courses/{cid}", headers=admin_headers, timeout=10)
        assert r.status_code == 200
        course = r.json()
        assert course["pass_threshold"] == 80
        assert course["lessons"][0]["quiz"][0]["correct_answer"] == 1

    def test_update_pass_threshold(self, admin_headers):
        cid = TestCourseWithQuiz.course_id
        r = requests.put(
            f"{API}/academy/admin/courses/{cid}",
            json={"pass_threshold": 60},
            headers=admin_headers,
            timeout=10,
        )
        assert r.status_code == 200
        assert r.json()["course"]["pass_threshold"] == 60

    def test_enroll_and_submit_quiz_pass(self, admin_headers):
        cid = TestCourseWithQuiz.course_id
        lid = TestCourseWithQuiz.lesson_id
        # enroll
        r = requests.post(f"{API}/academy/courses/{cid}/enroll", headers=admin_headers, timeout=10)
        assert r.status_code == 200, f"Enroll failed: {r.text}"

        # Submit correct answers => 100% pass
        r = requests.post(
            f"{API}/academy/courses/{cid}/lessons/{lid}/quiz-submit",
            json={"answers": [1, 2]},
            headers=admin_headers,
            timeout=15,
        )
        assert r.status_code == 200, f"Quiz submit failed: {r.status_code} {r.text}"
        data = r.json()
        assert data["score"] == 100
        assert data["correct"] == 2
        assert data["total"] == 2
        assert data["passed"] is True
        assert data["pass_threshold"] == 60
        assert len(data["results"]) == 2
        assert data["results"][0]["is_correct"] is True
        assert data["results"][0]["explanation"] == "Basic addition"

    def test_quiz_submit_fail(self, admin_headers):
        # Create a separate course with higher threshold to test fail path
        payload = {
            "title": f"TEST_Quiz_Fail_{uuid.uuid4().hex[:6]}",
            "status": "published",
            "pass_threshold": 90,
            "lessons": [
                {
                    "title": "Lesson",
                    "type": "video",
                    "quiz": [
                        {"question": "Q1", "options": ["A", "B", "C", "D"], "correct_answer": 0, "explanation": ""},
                        {"question": "Q2", "options": ["A", "B", "C", "D"], "correct_answer": 1, "explanation": ""},
                    ],
                }
            ],
        }
        r = requests.post(f"{API}/academy/admin/courses", json=payload, headers=admin_headers, timeout=15)
        assert r.status_code == 200
        c = r.json()["course"]
        cid, lid = c["id"], c["lessons"][0]["id"]
        requests.post(f"{API}/academy/courses/{cid}/enroll", headers=admin_headers, timeout=10)

        # Wrong answers => 0%
        r = requests.post(
            f"{API}/academy/courses/{cid}/lessons/{lid}/quiz-submit",
            json={"answers": [3, 3]},
            headers=admin_headers,
            timeout=15,
        )
        assert r.status_code == 200
        data = r.json()
        assert data["score"] == 0
        assert data["passed"] is False
        assert data["pass_threshold"] == 90

    def test_quiz_submit_requires_enrollment(self, admin_headers):
        # Create new course but don't enroll a fresh user; use a fake course-id
        r = requests.post(
            f"{API}/academy/courses/nonexistent/lessons/x/quiz-submit",
            json={"answers": []},
            headers=admin_headers,
            timeout=10,
        )
        assert r.status_code == 400, f"Expected 400, got {r.status_code}"

    def test_certificate_includes_quiz_fields(self, admin_headers, admin_user):
        cid = TestCourseWithQuiz.course_id
        lid = TestCourseWithQuiz.lesson_id
        # Complete the lesson to trigger cert (single lesson => 100%)
        r = requests.post(
            f"{API}/academy/courses/{cid}/lessons/{lid}/complete",
            headers=admin_headers,
            timeout=10,
        )
        assert r.status_code == 200
        data = r.json()
        assert data["progress"] == 100
        # Fetch certs via dashboard
        r = requests.get(f"{API}/academy/dashboard", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        certs = r.json().get("certificates", [])
        cert = next((c for c in certs if c.get("ref_id") == cid), None)
        assert cert is not None, "Certificate not created"
        # Verify new fields
        assert "quiz_score" in cert
        assert "quiz_passed" in cert
        assert "pass_threshold" in cert
        assert "status" in cert
        assert cert["status"] in ("pass", "fail")
        assert cert["pass_threshold"] == 60
        # Quiz score was 100, threshold 60 => pass
        assert cert["quiz_passed"] is True
        assert cert["status"] == "pass"


# ====================== AI Course Generator ======================

class TestAICourseGenerator:
    def test_generate_course_requires_admin(self):
        r = requests.post(
            f"{API}/academy/admin/courses/generate",
            json={"topic": "Python basics", "level": "beginner", "num_lessons": 3},
            timeout=10,
        )
        # No token => 401/403
        assert r.status_code in (401, 403), f"Expected auth error, got {r.status_code}"

    def test_generate_course_returns_structured_json(self, admin_headers):
        r = requests.post(
            f"{API}/academy/admin/courses/generate",
            json={"topic": "Introduction to Prompt Engineering", "level": "beginner", "num_lessons": 4},
            headers=admin_headers,
            timeout=120,
        )
        assert r.status_code == 200, f"AI generate failed: {r.status_code} {r.text[:500]}"
        data = r.json()
        assert data.get("success") is True
        course = data.get("course")
        assert course is not None
        assert "title" in course and isinstance(course["title"], str)
        assert "description" in course
        assert "category" in course
        assert "lessons" in course and isinstance(course["lessons"], list)
        assert len(course["lessons"]) >= 1
        # Lesson structure
        first = course["lessons"][0]
        assert "title" in first


# ====================== AI Quiz Generator ======================

class TestAIQuizGenerator:
    def test_generate_quiz_requires_admin(self):
        r = requests.post(
            f"{API}/academy/admin/courses/generate-quiz",
            json={"lesson_title": "Intro", "course_title": "AI", "num_questions": 3},
            timeout=10,
        )
        assert r.status_code in (401, 403)

    def test_generate_quiz_returns_questions(self, admin_headers):
        r = requests.post(
            f"{API}/academy/admin/courses/generate-quiz",
            json={"lesson_title": "What is Machine Learning", "course_title": "AI Basics", "num_questions": 3},
            headers=admin_headers,
            timeout=120,
        )
        assert r.status_code == 200, f"AI quiz failed: {r.status_code} {r.text[:500]}"
        data = r.json()
        assert data.get("success") is True
        questions = data.get("questions")
        assert isinstance(questions, list)
        assert len(questions) >= 1
        q0 = questions[0]
        assert "question" in q0
        assert "options" in q0 and isinstance(q0["options"], list)
        assert len(q0["options"]) == 4
        assert "correct_answer" in q0
        assert isinstance(q0["correct_answer"], int)
        assert 0 <= q0["correct_answer"] <= 3
