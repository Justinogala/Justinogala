"""
Academy Courses — CRUD, enrollment, progress tracking, lessons.
Admin creates courses; users enroll and track progress.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
import uuid

from config import db, logger
from routes.auth_helpers import get_current_user, get_optional_user

router = APIRouter(prefix="/academy", tags=["Academy"])


# ============== Models ==============

class QuizQuestion(BaseModel):
    question: str
    options: List[str] = []  # A, B, C, D
    correct_answer: int = 0  # index into options (0-3)
    explanation: str = ""


class LessonCreate(BaseModel):
    title: str
    description: str = ""
    video_url: str = ""
    duration: str = ""
    content: str = ""
    order: int = 0
    type: str = "video"  # video, text, quiz
    quiz: List[QuizQuestion] = []


class CourseCreate(BaseModel):
    title: str
    description: str = ""
    category: str = "AI"
    level: str = "beginner"  # beginner, intermediate, advanced
    instructor_name: str = ""
    instructor_avatar: str = ""
    instructor_title: str = ""
    thumbnail: str = ""
    is_premium: bool = False
    price: float = 0.0
    tags: List[str] = []
    what_you_learn: List[str] = []
    prerequisites: List[str] = []
    estimated_hours: float = 0
    status: str = "draft"  # draft, published, archived
    lessons: List[LessonCreate] = []
    pass_threshold: int = 70  # configurable pass/fail %


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    level: Optional[str] = None
    instructor_name: Optional[str] = None
    instructor_avatar: Optional[str] = None
    instructor_title: Optional[str] = None
    thumbnail: Optional[str] = None
    is_premium: Optional[bool] = None
    price: Optional[float] = None
    tags: Optional[List[str]] = None
    what_you_learn: Optional[List[str]] = None
    prerequisites: Optional[List[str]] = None
    estimated_hours: Optional[float] = None
    status: Optional[str] = None
    lessons: Optional[List[LessonCreate]] = None
    pass_threshold: Optional[int] = None


CATEGORIES = ["AI", "Cloud", "Cybersecurity", "DevOps", "Data Science",
              "Software Engineering", "Product Management", "Prompt Engineering", "Healthcare"]


# ============== Admin Routes ==============

@router.post("/admin/courses")
async def create_course(course: CourseCreate, user=Depends(get_current_user)):
    """Create a new course (admin only)"""
    role = (user.get("role") or "").lower().replace(" ", "_")
    if role not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    lessons = []
    for i, lesson in enumerate(course.lessons):
        lesson_dict = lesson.dict()
        lesson_dict["id"] = str(uuid.uuid4())
        lesson_dict["order"] = lesson.order or i
        # Ensure quiz questions have proper structure
        if lesson_dict.get("quiz"):
            for q in lesson_dict["quiz"]:
                q.setdefault("explanation", "")
        lessons.append(lesson_dict)

    doc = {
        "id": str(uuid.uuid4()),
        "title": course.title,
        "description": course.description,
        "category": course.category,
        "level": course.level,
        "instructor_name": course.instructor_name,
        "instructor_avatar": course.instructor_avatar,
        "instructor_title": course.instructor_title,
        "thumbnail": course.thumbnail,
        "is_premium": course.is_premium,
        "price": course.price,
        "tags": course.tags,
        "what_you_learn": course.what_you_learn,
        "prerequisites": course.prerequisites,
        "estimated_hours": course.estimated_hours,
        "status": course.status,
        "lessons": lessons,
        "pass_threshold": course.pass_threshold,
        "enrolled_count": 0,
        "rating": 0,
        "reviews_count": 0,
        "deleted": False,
        "created_by": user.get("id"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.courses.insert_one(doc)
    doc.pop("_id", None)
    logger.info(f"Course created: {doc['id']} - {course.title}")
    return {"success": True, "course": doc}


@router.put("/admin/courses/{course_id}")
async def update_course(course_id: str, update: CourseUpdate, user=Depends(get_current_user)):
    """Update a course (admin only)"""
    role = (user.get("role") or "").lower().replace(" ", "_")
    if role not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if "lessons" in update_data:
        lessons = []
        for i, lesson in enumerate(update_data["lessons"]):
            if isinstance(lesson, dict):
                lesson.setdefault("id", str(uuid.uuid4()))
                lesson.setdefault("order", i)
                lessons.append(lesson)
            else:
                lessons.append({"id": str(uuid.uuid4()), **lesson.dict(), "order": lesson.order or i})
        update_data["lessons"] = lessons

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.courses.update_one({"id": course_id, "deleted": {"$ne": True}}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")

    updated = await db.courses.find_one({"id": course_id}, {"_id": 0})
    return {"success": True, "course": updated}


@router.delete("/admin/courses/{course_id}")
async def delete_course(course_id: str, user=Depends(get_current_user)):
    """Soft delete a course"""
    role = (user.get("role") or "").lower().replace(" ", "_")
    if role not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    result = await db.courses.update_one({"id": course_id}, {"$set": {"deleted": True}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"success": True}


@router.get("/admin/courses")
async def admin_list_courses(user=Depends(get_current_user)):
    """List all courses for admin"""
    role = (user.get("role") or "").lower().replace(" ", "_")
    if role not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    courses = await db.courses.find({"deleted": {"$ne": True}}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"courses": courses, "total": len(courses)}


# ============== Public/User Routes ==============

@router.get("/courses")
async def list_courses(
    category: Optional[str] = None,
    level: Optional[str] = None,
    search: Optional[str] = None,
    is_premium: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0,
    user=Depends(get_optional_user),
):
    """Public course catalog"""
    query = {"deleted": {"$ne": True}, "status": "published"}
    if category:
        query["category"] = category
    if level:
        query["level"] = level
    if is_premium is not None:
        query["is_premium"] = is_premium
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}},
        ]

    total = await db.courses.count_documents(query)
    courses = await db.courses.find(query, {"_id": 0}).sort("enrolled_count", -1).skip(offset).limit(limit).to_list(limit)

    # If user logged in, attach enrollment status
    if user:
        user_id = user.get("id")
        enrollments = {}
        async for e in db.course_enrollments.find({"user_id": user_id}, {"_id": 0, "course_id": 1, "progress": 1}):
            enrollments[e["course_id"]] = e.get("progress", 0)
        for c in courses:
            c["enrolled"] = c["id"] in enrollments
            c["progress"] = enrollments.get(c["id"], 0)

    return {"courses": courses, "total": total}


@router.get("/courses/{course_id}")
async def get_course(course_id: str, user=Depends(get_optional_user)):
    """Get course detail"""
    course = await db.courses.find_one({"id": course_id, "deleted": {"$ne": True}}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Check enrollment + subscription for premium gating
    enrollment = None
    has_access = not course.get("is_premium", False)  # free courses always accessible

    if user:
        user_id = user.get("id")
        enrollment = await db.course_enrollments.find_one(
            {"user_id": user_id, "course_id": course_id}, {"_id": 0}
        )
        if course.get("is_premium"):
            sub = await db.subscriptions.find_one(
                {"user_id": user_id, "status": "active", "plan": {"$in": ["pro", "enterprise"]}},
                {"_id": 0}
            )
            has_access = bool(sub) or bool(enrollment and enrollment.get("paid"))

    # For premium courses without access, hide lesson video URLs
    if not has_access:
        for lesson in course.get("lessons", []):
            lesson["video_url"] = ""
            lesson["content"] = lesson.get("content", "")[:200] + "..." if lesson.get("content") else ""

    course["enrolled"] = bool(enrollment)
    course["progress"] = enrollment.get("progress", 0) if enrollment else 0
    course["completed_lessons"] = enrollment.get("completed_lessons", []) if enrollment else []
    course["has_access"] = has_access

    # Check if current user has reviewed
    if user:
        user_review = await db.course_reviews.find_one(
            {"user_id": user.get("id"), "course_id": course_id, "deleted": {"$ne": True}},
            {"_id": 0}
        )
        course["user_review"] = user_review

    return course


# ============== Enrollment & Progress ==============

@router.post("/courses/{course_id}/enroll")
async def enroll_in_course(course_id: str, user=Depends(get_current_user)):
    """Enroll in a course"""
    course = await db.courses.find_one({"id": course_id, "deleted": {"$ne": True}}, {"_id": 0, "id": 1, "is_premium": 1, "title": 1})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    user_id = user.get("id")
    existing = await db.course_enrollments.find_one({"user_id": user_id, "course_id": course_id})
    if existing:
        return {"success": True, "message": "Already enrolled"}

    # Check premium access
    if course.get("is_premium"):
        sub = await db.subscriptions.find_one(
            {"user_id": user_id, "status": "active", "plan": {"$in": ["pro", "enterprise"]}},
            {"_id": 0}
        )
        if not sub:
            raise HTTPException(status_code=403, detail="Pro subscription required for premium courses")

    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "course_id": course_id,
        "progress": 0,
        "completed_lessons": [],
        "paid": not course.get("is_premium", False),
        "enrolled_at": datetime.now(timezone.utc).isoformat(),
        "last_activity": datetime.now(timezone.utc).isoformat(),
    }
    await db.course_enrollments.insert_one(doc)
    await db.courses.update_one({"id": course_id}, {"$inc": {"enrolled_count": 1}})

    logger.info(f"User {user_id} enrolled in course {course_id}")
    return {"success": True, "enrollment_id": doc["id"]}


@router.post("/courses/{course_id}/lessons/{lesson_id}/complete")
async def complete_lesson(course_id: str, lesson_id: str, user=Depends(get_current_user)):
    """Mark a lesson as completed"""
    user_id = user.get("id")
    enrollment = await db.course_enrollments.find_one({"user_id": user_id, "course_id": course_id})
    if not enrollment:
        raise HTTPException(status_code=400, detail="Not enrolled in this course")

    course = await db.courses.find_one({"id": course_id}, {"_id": 0, "lessons": 1, "pass_threshold": 1, "title": 1})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    total_lessons = len(course.get("lessons", []))
    completed = set(enrollment.get("completed_lessons", []))
    completed.add(lesson_id)
    progress = int((len(completed) / total_lessons) * 100) if total_lessons > 0 else 0

    await db.course_enrollments.update_one(
        {"user_id": user_id, "course_id": course_id},
        {"$set": {
            "completed_lessons": list(completed),
            "progress": progress,
            "last_activity": datetime.now(timezone.utc).isoformat(),
        }}
    )

    # If 100% complete, issue certificate with quiz pass/fail
    if progress >= 100:
        existing_cert = await db.academy_certificates.find_one({"user_id": user_id, "ref_id": course_id, "type": "course"})
        if not existing_cert:
            # Calculate overall quiz score
            quiz_results = enrollment.get("quiz_results", {})
            total_quiz_score = 0
            quiz_count = 0
            for lesson in course.get("lessons", []):
                if lesson.get("quiz") and lesson.get("id") in quiz_results:
                    total_quiz_score += quiz_results[lesson["id"]].get("score", 0)
                    quiz_count += 1

            avg_quiz_score = int(total_quiz_score / quiz_count) if quiz_count > 0 else 100
            pass_threshold = course.get("pass_threshold", 70)
            quiz_passed = avg_quiz_score >= pass_threshold

            cert = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "user_name": user.get("name", ""),
                "user_email": user.get("email", ""),
                "type": "course",
                "ref_id": course_id,
                "title": course.get("title", ""),
                "cert_number": f"MAI-C-{uuid.uuid4().hex[:8].upper()}",
                "quiz_score": avg_quiz_score,
                "quiz_passed": quiz_passed,
                "pass_threshold": pass_threshold,
                "status": "pass" if quiz_passed else "fail",
                "issued_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.academy_certificates.insert_one(cert)
            cert.pop("_id", None)
            logger.info(f"Certificate issued: user={user_id} course={course_id} score={avg_quiz_score}% {'PASS' if quiz_passed else 'FAIL'}")
            return {"success": True, "progress": progress, "completed": True, "certificate": cert}

    return {"success": True, "progress": progress, "completed": progress >= 100}


# ============== Certificates ==============

@router.get("/certificates")
async def list_user_certificates(user=Depends(get_current_user)):
    """List all certificates for logged-in user"""
    certs = await db.academy_certificates.find(
        {"user_id": user.get("id")}, {"_id": 0}
    ).sort("issued_at", -1).to_list(100)
    return {"certificates": certs}


@router.get("/certificates/{cert_id}")
async def get_certificate(cert_id: str):
    """Get a single certificate by ID (public for verification)"""
    cert = await db.academy_certificates.find_one({"id": cert_id}, {"_id": 0})
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return cert


@router.get("/certificates/verify/{cert_number}")
async def verify_certificate(cert_number: str):
    """Verify a certificate by cert number (public)"""
    cert = await db.academy_certificates.find_one({"cert_number": cert_number}, {"_id": 0})
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return {"valid": True, "certificate": cert}


# ============== Dashboard ==============

@router.get("/dashboard")
async def get_academy_dashboard(user=Depends(get_current_user)):
    """Personalized academy dashboard for logged-in user"""
    user_id = user.get("id")

    # Enrolled courses with progress
    enrollments = await db.course_enrollments.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("last_activity", -1).to_list(50)

    course_ids = [e["course_id"] for e in enrollments]
    courses_map = {}
    if course_ids:
        async for c in db.courses.find({"id": {"$in": course_ids}, "deleted": {"$ne": True}}, {"_id": 0, "id": 1, "title": 1, "thumbnail": 1, "category": 1, "lessons": 1, "estimated_hours": 1}):
            courses_map[c["id"]] = c

    continue_learning = []
    completed_courses = []
    for e in enrollments:
        c = courses_map.get(e["course_id"])
        if not c:
            continue
        item = {
            "course_id": e["course_id"],
            "title": c.get("title"),
            "thumbnail": c.get("thumbnail"),
            "category": c.get("category"),
            "progress": e.get("progress", 0),
            "total_lessons": len(c.get("lessons", [])),
            "completed_lessons": len(e.get("completed_lessons", [])),
            "last_activity": e.get("last_activity"),
        }
        if e.get("progress", 0) >= 100:
            completed_courses.append(item)
        else:
            continue_learning.append(item)

    # Certificates
    certificates = await db.academy_certificates.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("issued_at", -1).to_list(50)

    # Upcoming events
    now = datetime.now(timezone.utc).isoformat()
    upcoming_events = await db.events.find(
        {"deleted": {"$ne": True}, "date": {"$gte": now}, "status": {"$nin": ["cancelled"]}},
        {"_id": 0, "id": 1, "title": 1, "date": 1, "time": 1, "event_format": 1, "banner": 1, "category": 1}
    ).sort("date", 1).limit(5).to_list(5)

    # Recommended courses (not enrolled)
    recommended = await db.courses.find(
        {"deleted": {"$ne": True}, "status": "published", "id": {"$nin": course_ids}},
        {"_id": 0, "id": 1, "title": 1, "thumbnail": 1, "category": 1, "level": 1, "is_premium": 1, "enrolled_count": 1, "estimated_hours": 1}
    ).sort("enrolled_count", -1).limit(6).to_list(6)

    # Subscription
    subscription = await db.subscriptions.find_one(
        {"user_id": user_id, "status": "active"}, {"_id": 0, "plan": 1, "current_period_end": 1}
    )

    # Learning streak (days with activity in last 30 days)
    from datetime import timedelta
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    recent_activity = await db.course_enrollments.find(
        {"user_id": user_id, "last_activity": {"$gte": thirty_days_ago}},
        {"_id": 0, "last_activity": 1}
    ).to_list(100)
    activity_days = set()
    for a in recent_activity:
        if a.get("last_activity"):
            activity_days.add(a["last_activity"][:10])
    streak = len(activity_days)

    return {
        "continue_learning": continue_learning,
        "completed_courses": completed_courses,
        "certificates": certificates,
        "upcoming_events": upcoming_events,
        "recommended": recommended,
        "subscription": {"plan": subscription.get("plan") if subscription else "free", "active": bool(subscription)},
        "stats": {
            "courses_enrolled": len(enrollments),
            "courses_completed": len(completed_courses),
            "certificates_earned": len(certificates),
            "learning_streak": streak,
        }
    }


# ============== Quiz Submission ==============

class QuizSubmission(BaseModel):
    answers: List[int]  # indices of selected options, matching quiz question order


@router.post("/courses/{course_id}/lessons/{lesson_id}/quiz-submit")
async def submit_quiz(course_id: str, lesson_id: str, submission: QuizSubmission, user=Depends(get_current_user)):
    """Submit quiz answers for a lesson and get score"""
    user_id = user.get("id")
    enrollment = await db.course_enrollments.find_one({"user_id": user_id, "course_id": course_id})
    if not enrollment:
        raise HTTPException(status_code=400, detail="Not enrolled in this course")

    course = await db.courses.find_one({"id": course_id}, {"_id": 0, "lessons": 1, "pass_threshold": 1, "title": 1})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    lesson = next((l for l in course.get("lessons", []) if l.get("id") == lesson_id), None)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    quiz = lesson.get("quiz", [])
    if not quiz:
        raise HTTPException(status_code=400, detail="This lesson has no quiz")

    # Score the quiz
    total = len(quiz)
    correct = 0
    results = []
    for i, q in enumerate(quiz):
        user_answer = submission.answers[i] if i < len(submission.answers) else -1
        is_correct = user_answer == q.get("correct_answer", 0)
        if is_correct:
            correct += 1
        results.append({
            "question": q.get("question"),
            "user_answer": user_answer,
            "correct_answer": q.get("correct_answer", 0),
            "is_correct": is_correct,
            "explanation": q.get("explanation", ""),
        })

    score = int((correct / total) * 100) if total > 0 else 0
    pass_threshold = course.get("pass_threshold", 70)
    passed = score >= pass_threshold

    # Store quiz result
    quiz_result = {
        "lesson_id": lesson_id,
        "score": score,
        "correct": correct,
        "total": total,
        "passed": passed,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }

    # Update enrollment with quiz results
    quiz_results = enrollment.get("quiz_results", {})
    quiz_results[lesson_id] = quiz_result
    await db.course_enrollments.update_one(
        {"user_id": user_id, "course_id": course_id},
        {"$set": {
            f"quiz_results": quiz_results,
            "last_activity": datetime.now(timezone.utc).isoformat(),
        }}
    )

    return {
        "score": score,
        "correct": correct,
        "total": total,
        "passed": passed,
        "pass_threshold": pass_threshold,
        "results": results,
    }


# ============== AI Course Generator ==============

class AIGenerateRequest(BaseModel):
    topic: str
    level: str = "beginner"
    num_lessons: int = 6


@router.post("/admin/courses/generate")
async def ai_generate_course(req: AIGenerateRequest, user=Depends(get_current_user)):
    """Generate a course outline using AI"""
    role = (user.get("role") or "").lower().replace(" ", "_")
    if role not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    import os
    from dotenv import load_dotenv
    load_dotenv()
    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI not configured")

    from emergentintegrations.llm.chat import LlmChat, UserMessage

    chat = LlmChat(
        api_key=api_key,
        session_id=f"course-gen-{uuid.uuid4().hex[:8]}",
        system_message="You are an expert curriculum designer for an AI education platform. Generate structured course content in valid JSON format only. No markdown, no code blocks, just pure JSON."
    ).with_model("openai", "gpt-5.2")

    prompt = f"""Generate a comprehensive course outline for the topic: "{req.topic}"
Level: {req.level}
Number of lessons: {req.num_lessons}

Return ONLY valid JSON with this exact structure:
{{
  "title": "Course Title",
  "description": "2-3 sentence course description",
  "category": "one of: AI, Prompt Engineering, Cloud, DevOps, Cybersecurity, Data Science, Software Engineering, Product Management",
  "level": "{req.level}",
  "estimated_hours": number,
  "tags": ["tag1", "tag2", "tag3"],
  "what_you_learn": ["outcome1", "outcome2", "outcome3", "outcome4"],
  "prerequisites": ["prereq1"],
  "lessons": [
    {{
      "title": "Lesson Title",
      "description": "Brief lesson description",
      "duration": "20 min",
      "type": "video"
    }}
  ]
}}"""

    msg = UserMessage(text=prompt)
    response = await chat.send_message(msg)
    response_text = (response if isinstance(response, str) else getattr(response, "text", str(response))).strip()

    # Parse JSON from response
    import json
    try:
        # Try to extract JSON if wrapped in code blocks
        if "```" in response_text:
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
            response_text = response_text.strip()
        course_data = json.loads(response_text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON. Please try again.")

    logger.info(f"AI course generated for topic: {req.topic}")
    return {"success": True, "course": course_data}


# ============== AI Quiz Generator ==============

class AIQuizRequest(BaseModel):
    lesson_title: str
    course_title: str = ""
    num_questions: int = 5


@router.post("/admin/courses/generate-quiz")
async def ai_generate_quiz(req: AIQuizRequest, user=Depends(get_current_user)):
    """Generate quiz questions for a lesson using AI"""
    role = (user.get("role") or "").lower().replace(" ", "_")
    if role not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    import os
    from dotenv import load_dotenv
    load_dotenv()
    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI not configured")

    from emergentintegrations.llm.chat import LlmChat, UserMessage

    chat = LlmChat(
        api_key=api_key,
        session_id=f"quiz-gen-{uuid.uuid4().hex[:8]}",
        system_message="You are an expert educator creating assessment questions. Return only valid JSON. No markdown, no code blocks."
    ).with_model("openai", "gpt-5.2")

    prompt = f"""Generate {req.num_questions} multiple-choice quiz questions for:
Course: "{req.course_title}"
Lesson: "{req.lesson_title}"

Return ONLY valid JSON array with this exact structure:
[
  {{
    "question": "What is...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Brief explanation of why this is correct"
  }}
]

Rules:
- Each question must have exactly 4 options
- correct_answer is the 0-based index (0-3)
- Questions should test understanding, not memorization
- Mix difficulty levels"""

    msg = UserMessage(text=prompt)
    response = await chat.send_message(msg)
    response_text = (response if isinstance(response, str) else getattr(response, "text", str(response))).strip()

    import json
    try:
        if "```" in response_text:
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
            response_text = response_text.strip()
        questions = json.loads(response_text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON. Please try again.")

    logger.info(f"AI quiz generated: {req.num_questions} questions for '{req.lesson_title}'")
    return {"success": True, "questions": questions}


# ============== Course Reviews & Ratings ==============

class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = ""


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None


@router.get("/courses/{course_id}/reviews")
async def list_course_reviews(course_id: str, limit: int = 50, offset: int = 0):
    """List reviews for a course (public)"""
    reviews = await db.course_reviews.find(
        {"course_id": course_id, "deleted": {"$ne": True}},
        {"_id": 0}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)

    total = await db.course_reviews.count_documents({"course_id": course_id, "deleted": {"$ne": True}})

    # Compute rating breakdown
    pipeline = [
        {"$match": {"course_id": course_id, "deleted": {"$ne": True}}},
        {"$group": {"_id": "$rating", "count": {"$sum": 1}}},
    ]
    breakdown = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    async for doc in db.course_reviews.aggregate(pipeline):
        breakdown[doc["_id"]] = doc["count"]

    avg = 0
    if total > 0:
        avg = round(sum(r * c for r, c in breakdown.items()) / total, 1)

    return {
        "reviews": reviews,
        "total": total,
        "average_rating": avg,
        "breakdown": breakdown,
    }


@router.post("/courses/{course_id}/reviews")
async def create_review(course_id: str, review: ReviewCreate, user=Depends(get_current_user)):
    """Create or update a review for a course (one per user)"""
    user_id = user.get("id")

    # Must be enrolled
    enrollment = await db.course_enrollments.find_one({"user_id": user_id, "course_id": course_id})
    if not enrollment:
        raise HTTPException(status_code=400, detail="You must be enrolled to review this course")

    # Check existing review
    existing = await db.course_reviews.find_one({"user_id": user_id, "course_id": course_id, "deleted": {"$ne": True}})
    if existing:
        # Update existing
        await db.course_reviews.update_one(
            {"id": existing["id"]},
            {"$set": {"rating": review.rating, "comment": review.comment, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        updated = await db.course_reviews.find_one({"id": existing["id"]}, {"_id": 0})
        await _update_course_rating(course_id)
        return {"success": True, "review": updated, "updated": True}

    doc = {
        "id": str(uuid.uuid4()),
        "course_id": course_id,
        "user_id": user_id,
        "user_name": user.get("name", ""),
        "user_email": user.get("email", ""),
        "user_avatar": user.get("avatar", ""),
        "rating": review.rating,
        "comment": review.comment,
        "deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.course_reviews.insert_one(doc)
    doc.pop("_id", None)
    await _update_course_rating(course_id)

    logger.info(f"Review created: user={user_id} course={course_id} rating={review.rating}")
    return {"success": True, "review": doc}


@router.delete("/courses/{course_id}/reviews/{review_id}")
async def delete_review(course_id: str, review_id: str, user=Depends(get_current_user)):
    """Delete own review or admin can delete any"""
    user_id = user.get("id")
    role = (user.get("role") or "").lower().replace(" ", "_")

    review = await db.course_reviews.find_one({"id": review_id, "course_id": course_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.get("user_id") != user_id and role not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Can only delete your own review")

    await db.course_reviews.update_one({"id": review_id}, {"$set": {"deleted": True}})
    await _update_course_rating(course_id)
    return {"success": True}


async def _update_course_rating(course_id: str):
    """Recalculate and update course average rating"""
    pipeline = [
        {"$match": {"course_id": course_id, "deleted": {"$ne": True}}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}},
    ]
    result = await db.course_reviews.aggregate(pipeline).to_list(1)
    if result:
        await db.courses.update_one(
            {"id": course_id},
            {"$set": {"rating": round(result[0]["avg"], 1), "reviews_count": result[0]["count"]}}
        )
    else:
        await db.courses.update_one({"id": course_id}, {"$set": {"rating": 0, "reviews_count": 0}})
