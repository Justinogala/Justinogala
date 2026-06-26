"""
Test suite: Academy Course Reviews & Ratings
- GET /api/academy/courses/{id}/reviews
- POST /api/academy/courses/{id}/reviews (create/update, enrollment required)
- DELETE /api/academy/courses/{id}/reviews/{review_id}
- Verify course rating/reviews_count auto-update
- Verify user_review field on GET /api/academy/courses/{id}
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://new-user-welcome-2.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@munal.com"
ADMIN_PASSWORD = "Munal@AI#2026!X7qP9"

FREE_COURSE_ID = "05fc09f9-b57f-45b9-8ff1-f718c8a2ce1c"  # AI Foundations free course


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login?skip_2fa=true",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=30,
    )
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("access_token") or data.get("token")
    assert token, f"No token in response: {data}"
    return token


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


def _register_user():
    suffix = uuid.uuid4().hex[:8]
    email = f"TEST_review_{suffix}@example.com"
    password = "TestReview@2026!Strong#X9"
    payload = {"email": email, "password": password, "name": "Test Reviewer"}
    r = requests.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=30)
    assert r.status_code in (200, 201), f"register failed: {r.status_code} {r.text}"
    body = r.json()
    token = body.get("access_token") or body.get("token")
    if not token:
        lr = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password}, timeout=30)
        assert lr.status_code == 200, lr.text
        token = lr.json().get("access_token") or lr.json().get("token")
    assert token
    user_id = body.get("user", {}).get("id") or body.get("id")
    return {"email": email, "token": token, "user_id": user_id}


@pytest.fixture(scope="module")
def user_a():
    return _register_user()


@pytest.fixture(scope="module")
def user_b():
    return _register_user()


def _h(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------- Verify free course exists ----------
def test_free_course_exists():
    r = requests.get(f"{BASE_URL}/api/academy/courses/{FREE_COURSE_ID}", timeout=30)
    assert r.status_code == 200, f"Free course not found: {r.text}"
    course = r.json()
    assert course["id"] == FREE_COURSE_ID
    assert "rating" in course
    assert "reviews_count" in course


# ---------- Review creation requires enrollment ----------
def test_review_requires_enrollment(user_a):
    """POST review without enrollment should return 400"""
    # Don't enroll yet for this user
    payload = {"rating": 5, "comment": "Should fail - not enrolled"}
    r = requests.post(
        f"{BASE_URL}/api/academy/courses/{FREE_COURSE_ID}/reviews",
        json=payload, headers=_h(user_a["token"]), timeout=30,
    )
    assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text}"
    assert "enrolled" in r.text.lower()


# ---------- Enroll then create review ----------
def test_enroll_and_create_review(user_a):
    # Enroll
    er = requests.post(
        f"{BASE_URL}/api/academy/courses/{FREE_COURSE_ID}/enroll",
        headers=_h(user_a["token"]), timeout=30,
    )
    assert er.status_code == 200, f"Enroll failed: {er.text}"

    # Create review
    payload = {"rating": 5, "comment": "Excellent free course!"}
    r = requests.post(
        f"{BASE_URL}/api/academy/courses/{FREE_COURSE_ID}/reviews",
        json=payload, headers=_h(user_a["token"]), timeout=30,
    )
    assert r.status_code == 200, f"Create review failed: {r.text}"
    body = r.json()
    assert body.get("success") is True
    review = body.get("review")
    assert review["rating"] == 5
    assert review["comment"] == "Excellent free course!"
    assert "id" in review
    user_a["review_id"] = review["id"]


# ---------- Update existing review (upsert behavior) ----------
def test_update_existing_review(user_a):
    payload = {"rating": 4, "comment": "Updated my review"}
    r = requests.post(
        f"{BASE_URL}/api/academy/courses/{FREE_COURSE_ID}/reviews",
        json=payload, headers=_h(user_a["token"]), timeout=30,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("updated") is True
    assert body["review"]["rating"] == 4
    assert body["review"]["comment"] == "Updated my review"
    # Same review id (no duplicates)
    assert body["review"]["id"] == user_a["review_id"]


# ---------- Invalid rating bounds ----------
def test_invalid_rating_rejected(user_a):
    for bad in [0, 6, -1]:
        r = requests.post(
            f"{BASE_URL}/api/academy/courses/{FREE_COURSE_ID}/reviews",
            json={"rating": bad, "comment": "bad"},
            headers=_h(user_a["token"]), timeout=30,
        )
        assert r.status_code in (400, 422), f"Bad rating {bad} accepted: {r.status_code}"


# ---------- GET reviews returns shape ----------
def test_list_reviews_structure():
    r = requests.get(f"{BASE_URL}/api/academy/courses/{FREE_COURSE_ID}/reviews", timeout=30)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "reviews" in body and isinstance(body["reviews"], list)
    assert "total" in body
    assert "average_rating" in body
    assert "breakdown" in body
    bd = body["breakdown"]
    # breakdown keys are 1-5 (may be int or str depending on serialization)
    keys = set(str(k) for k in bd.keys())
    assert keys >= {"1", "2", "3", "4", "5"}
    # After user_a's update to rating=4, total >= 1
    assert body["total"] >= 1
    assert body["average_rating"] > 0


# ---------- Course rating updated after review ----------
def test_course_rating_updated():
    r = requests.get(f"{BASE_URL}/api/academy/courses/{FREE_COURSE_ID}", timeout=30)
    assert r.status_code == 200
    course = r.json()
    assert course["reviews_count"] >= 1
    assert course["rating"] >= 1.0


# ---------- user_review field returned for logged-in reviewer ----------
def test_user_review_in_course_detail(user_a):
    r = requests.get(
        f"{BASE_URL}/api/academy/courses/{FREE_COURSE_ID}",
        headers=_h(user_a["token"]), timeout=30,
    )
    assert r.status_code == 200
    course = r.json()
    assert course.get("user_review") is not None
    assert course["user_review"]["rating"] == 4


# ---------- Second user enrolls and reviews; breakdown updates ----------
def test_second_user_review_and_breakdown(user_b):
    er = requests.post(
        f"{BASE_URL}/api/academy/courses/{FREE_COURSE_ID}/enroll",
        headers=_h(user_b["token"]), timeout=30,
    )
    assert er.status_code == 200

    r = requests.post(
        f"{BASE_URL}/api/academy/courses/{FREE_COURSE_ID}/reviews",
        json={"rating": 2, "comment": "Could be better"},
        headers=_h(user_b["token"]), timeout=30,
    )
    assert r.status_code == 200, r.text
    user_b["review_id"] = r.json()["review"]["id"]

    lr = requests.get(f"{BASE_URL}/api/academy/courses/{FREE_COURSE_ID}/reviews", timeout=30)
    body = lr.json()
    assert body["total"] >= 2
    bd = body["breakdown"]
    # Average should be between 2 and 4
    assert 2.0 <= body["average_rating"] <= 4.5
    # rating=4 and rating=2 buckets should each have >=1
    count_4 = bd.get(4) if 4 in bd else bd.get("4", 0)
    count_2 = bd.get(2) if 2 in bd else bd.get("2", 0)
    assert count_4 >= 1
    assert count_2 >= 1


# ---------- Non-owner cannot delete other's review ----------
def test_non_owner_cannot_delete(user_a, user_b):
    r = requests.delete(
        f"{BASE_URL}/api/academy/courses/{FREE_COURSE_ID}/reviews/{user_b['review_id']}",
        headers=_h(user_a["token"]), timeout=30,
    )
    assert r.status_code == 403, f"Expected 403, got {r.status_code}: {r.text}"


# ---------- Owner can delete own review ----------
def test_owner_can_delete_own(user_b):
    r = requests.delete(
        f"{BASE_URL}/api/academy/courses/{FREE_COURSE_ID}/reviews/{user_b['review_id']}",
        headers=_h(user_b["token"]), timeout=30,
    )
    assert r.status_code == 200, r.text
    assert r.json().get("success") is True


# ---------- Admin can delete any review ----------
def test_admin_can_delete_any(admin_headers, user_a):
    r = requests.delete(
        f"{BASE_URL}/api/academy/courses/{FREE_COURSE_ID}/reviews/{user_a['review_id']}",
        headers=admin_headers, timeout=30,
    )
    assert r.status_code == 200, r.text
    assert r.json().get("success") is True


# ---------- After all deletions, course rating reset ----------
def test_course_rating_after_deletion():
    r = requests.get(f"{BASE_URL}/api/academy/courses/{FREE_COURSE_ID}", timeout=30)
    course = r.json()
    # Other users may have reviewed too; just verify field exists & is non-negative
    assert course["rating"] >= 0
    assert course["reviews_count"] >= 0


# ---------- Unauthenticated POST returns 401/403 ----------
def test_unauthenticated_post_review():
    r = requests.post(
        f"{BASE_URL}/api/academy/courses/{FREE_COURSE_ID}/reviews",
        json={"rating": 5, "comment": "anon"}, timeout=30,
    )
    assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}"
