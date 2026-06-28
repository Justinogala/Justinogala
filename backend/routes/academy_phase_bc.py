"""
Academy Phase B+C — Learning Pathways, Badges, Enhanced Dashboard, Practice Labs, Certification Pathways.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import HTMLResponse
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel, Field
import uuid, os

from dotenv import load_dotenv
load_dotenv()

from config import db, logger
from routes.auth_helpers import get_current_user, get_optional_user

router = APIRouter(prefix="/academy", tags=["Academy Phase B+C"])


# ============== Models ==============

class PathwayCreate(BaseModel):
    title: str
    description: str = ""
    icon: str = ""
    color: str = "#7C3AED"
    level: str = "beginner"
    estimated_weeks: int = 8
    course_ids: List[str] = []
    certification_info: str = ""
    status: str = "published"


class LabSubmission(BaseModel):
    content: str
    repo_url: str = ""


# ============== Learning Pathways ==============

@router.get("/pathways")
async def list_pathways(user=Depends(get_optional_user)):
    """List all published learning pathways"""
    pathways = await db.academy_pathways.find(
        {"status": "published"}, {"_id": 0}
    ).sort("order", 1).to_list(50)

    # Attach course count and user progress
    for p in pathways:
        p["course_count"] = len(p.get("course_ids", []))
        if user:
            user_id = user.get("id")
            completed = 0
            for cid in p.get("course_ids", []):
                enrollment = await db.course_enrollments.find_one(
                    {"user_id": user_id, "course_id": cid, "progress": 100}
                )
                if enrollment:
                    completed += 1
            p["completed_courses"] = completed
            p["progress"] = int((completed / max(len(p.get("course_ids", [])), 1)) * 100)
            p["enrolled"] = completed > 0 or await db.academy_pathway_enrollments.find_one(
                {"user_id": user_id, "pathway_id": p["id"]}
            ) is not None
        else:
            p["completed_courses"] = 0
            p["progress"] = 0
            p["enrolled"] = False

    return {"pathways": pathways}


@router.get("/pathways/{pathway_id}")
async def get_pathway(pathway_id: str, user=Depends(get_optional_user)):
    """Get pathway detail with courses"""
    pathway = await db.academy_pathways.find_one({"id": pathway_id}, {"_id": 0})
    if not pathway:
        raise HTTPException(status_code=404, detail="Pathway not found")

    # Fetch courses in order
    courses = []
    for cid in pathway.get("course_ids", []):
        course = await db.courses.find_one(
            {"id": cid, "deleted": {"$ne": True}},
            {"_id": 0, "id": 1, "title": 1, "thumbnail": 1, "category": 1, "level": 1,
             "estimated_hours": 1, "lessons": 1, "enrolled_count": 1, "is_premium": 1}
        )
        if course:
            course["lesson_count"] = len(course.pop("lessons", []))
            if user:
                enrollment = await db.course_enrollments.find_one(
                    {"user_id": user.get("id"), "course_id": cid}, {"_id": 0, "progress": 1}
                )
                course["enrolled"] = bool(enrollment)
                course["progress"] = enrollment.get("progress", 0) if enrollment else 0
            courses.append(course)

    pathway["courses"] = courses
    pathway["course_count"] = len(courses)

    if user:
        user_id = user.get("id")
        completed = sum(1 for c in courses if c.get("progress", 0) >= 100)
        pathway["completed_courses"] = completed
        pathway["progress"] = int((completed / max(len(courses), 1)) * 100)
        pe = await db.academy_pathway_enrollments.find_one({"user_id": user_id, "pathway_id": pathway_id})
        pathway["enrolled"] = bool(pe)

    return pathway


@router.post("/pathways/{pathway_id}/enroll")
async def enroll_pathway(pathway_id: str, user=Depends(get_current_user)):
    """Enroll in a learning pathway"""
    pathway = await db.academy_pathways.find_one({"id": pathway_id})
    if not pathway:
        raise HTTPException(status_code=404, detail="Pathway not found")

    user_id = user.get("id")
    existing = await db.academy_pathway_enrollments.find_one({"user_id": user_id, "pathway_id": pathway_id})
    if existing:
        return {"success": True, "message": "Already enrolled"}

    doc = {
        "id": str(uuid.uuid4()), "user_id": user_id, "pathway_id": pathway_id,
        "enrolled_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.academy_pathway_enrollments.insert_one(doc)
    return {"success": True}


# ============== Badges ==============

BADGE_DEFINITIONS = [
    {"id": "first_course", "title": "First Steps", "description": "Complete your first course", "icon": "rocket", "color": "#7C3AED", "category": "milestone"},
    {"id": "five_courses", "title": "Knowledge Seeker", "description": "Complete 5 courses", "icon": "book-open", "color": "#2563EB", "category": "milestone"},
    {"id": "ten_courses", "title": "Scholar", "description": "Complete 10 courses", "icon": "graduation-cap", "color": "#059669", "category": "milestone"},
    {"id": "quiz_ace", "title": "Quiz Ace", "description": "Score 100% on any quiz", "icon": "zap", "color": "#F59E0B", "category": "achievement"},
    {"id": "streak_7", "title": "Week Warrior", "description": "7-day learning streak", "icon": "flame", "color": "#EF4444", "category": "streak"},
    {"id": "streak_30", "title": "Monthly Master", "description": "30-day learning streak", "icon": "fire-extinguisher", "color": "#DC2626", "category": "streak"},
    {"id": "first_review", "title": "Reviewer", "description": "Write your first course review", "icon": "star", "color": "#8B5CF6", "category": "community"},
    {"id": "first_discussion", "title": "Contributor", "description": "Start a discussion thread", "icon": "message-square", "color": "#06B6D4", "category": "community"},
    {"id": "pathway_complete", "title": "Pathfinder", "description": "Complete a learning pathway", "icon": "map", "color": "#10B981", "category": "milestone"},
    {"id": "first_lab", "title": "Lab Rat", "description": "Submit your first practice lab", "icon": "flask-conical", "color": "#6366F1", "category": "achievement"},
    {"id": "all_certs", "title": "Certified Pro", "description": "Earn 5 certificates with PASS status", "icon": "award", "color": "#EAB308", "category": "milestone"},
]

@router.get("/badges")
async def list_badges(user=Depends(get_optional_user)):
    """List all badges with user's earned status"""
    user_earned = {}
    if user:
        async for ub in db.academy_user_badges.find({"user_id": user.get("id")}, {"_id": 0}):
            user_earned[ub["badge_id"]] = ub

    badges = []
    for b in BADGE_DEFINITIONS:
        earned = user_earned.get(b["id"])
        badges.append({**b, "earned": bool(earned), "earned_at": earned.get("earned_at") if earned else None})

    return {"badges": badges, "earned_count": len(user_earned)}


@router.post("/badges/check")
async def check_and_award_badges(user=Depends(get_current_user)):
    """Check and award any newly earned badges"""
    user_id = user.get("id")
    newly_earned = []

    # Get user stats
    enrollments = await db.course_enrollments.find({"user_id": user_id}).to_list(200)
    completed_count = sum(1 for e in enrollments if e.get("progress", 0) >= 100)
    certs = await db.academy_certificates.count_documents({"user_id": user_id, "status": "pass"})
    reviews = await db.course_reviews.count_documents({"user_id": user_id, "deleted": {"$ne": True}})
    discussions = await db.academy_discussions.count_documents({"user_id": user_id, "deleted": {"$ne": True}})
    labs = await db.academy_lab_submissions.count_documents({"user_id": user_id})

    # Check quiz scores
    has_perfect_quiz = False
    for e in enrollments:
        for lr in (e.get("quiz_results") or {}).values():
            if lr.get("score", 0) >= 100:
                has_perfect_quiz = True
                break

    # Pathway completions
    pathway_enrollments = await db.academy_pathway_enrollments.find({"user_id": user_id}).to_list(50)
    pathway_complete = False
    for pe in pathway_enrollments:
        pathway = await db.academy_pathways.find_one({"id": pe["pathway_id"]}, {"course_ids": 1})
        if pathway:
            all_done = True
            for cid in pathway.get("course_ids", []):
                enr = await db.course_enrollments.find_one({"user_id": user_id, "course_id": cid, "progress": 100})
                if not enr:
                    all_done = False
                    break
            if all_done and len(pathway.get("course_ids", [])) > 0:
                pathway_complete = True

    # Streak
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    recent = await db.course_enrollments.find(
        {"user_id": user_id, "last_activity": {"$gte": thirty_days_ago}}, {"last_activity": 1}
    ).to_list(200)
    activity_days = set()
    for a in recent:
        if a.get("last_activity"):
            activity_days.add(a["last_activity"][:10])
    streak = len(activity_days)

    # Badge check map
    checks = {
        "first_course": completed_count >= 1,
        "five_courses": completed_count >= 5,
        "ten_courses": completed_count >= 10,
        "quiz_ace": has_perfect_quiz,
        "streak_7": streak >= 7,
        "streak_30": streak >= 30,
        "first_review": reviews >= 1,
        "first_discussion": discussions >= 1,
        "pathway_complete": pathway_complete,
        "first_lab": labs >= 1,
        "all_certs": certs >= 5,
    }

    now = datetime.now(timezone.utc).isoformat()
    for badge_id, earned in checks.items():
        if earned:
            existing = await db.academy_user_badges.find_one({"user_id": user_id, "badge_id": badge_id})
            if not existing:
                doc = {"id": str(uuid.uuid4()), "user_id": user_id, "badge_id": badge_id, "earned_at": now}
                await db.academy_user_badges.insert_one(doc)
                badge_def = next((b for b in BADGE_DEFINITIONS if b["id"] == badge_id), {})
                newly_earned.append({**badge_def, "earned_at": now})

    return {"newly_earned": newly_earned, "total_earned": len(newly_earned) + await db.academy_user_badges.count_documents({"user_id": user_id})}


# ============== Enhanced Dashboard ==============

@router.get("/dashboard/enhanced")
async def get_enhanced_dashboard(user=Depends(get_current_user)):
    """Enhanced academy dashboard with badges, streaks, pathways"""
    user_id = user.get("id")

    # Base stats
    enrollments = await db.course_enrollments.find({"user_id": user_id}, {"_id": 0}).sort("last_activity", -1).to_list(50)
    course_ids = [e["course_id"] for e in enrollments]

    courses_map = {}
    if course_ids:
        async for c in db.courses.find({"id": {"$in": course_ids}, "deleted": {"$ne": True}},
                                       {"_id": 0, "id": 1, "title": 1, "thumbnail": 1, "category": 1, "lessons": 1, "estimated_hours": 1}):
            courses_map[c["id"]] = c

    continue_learning = []
    completed_courses = []
    total_hours = 0
    for e in enrollments:
        c = courses_map.get(e["course_id"])
        if not c:
            continue
        item = {
            "course_id": e["course_id"], "title": c.get("title"), "thumbnail": c.get("thumbnail"),
            "category": c.get("category"), "progress": e.get("progress", 0),
            "total_lessons": len(c.get("lessons", [])), "completed_lessons": len(e.get("completed_lessons", [])),
            "last_activity": e.get("last_activity"),
        }
        total_hours += c.get("estimated_hours", 0) * (e.get("progress", 0) / 100)
        if e.get("progress", 0) >= 100:
            completed_courses.append(item)
        else:
            continue_learning.append(item)

    # Certificates
    certificates = await db.academy_certificates.find({"user_id": user_id}, {"_id": 0}).sort("issued_at", -1).to_list(50)

    # Badges
    user_badges = await db.academy_user_badges.find({"user_id": user_id}, {"_id": 0}).to_list(50)
    badge_map = {ub["badge_id"]: ub for ub in user_badges}
    badges = [{**b, "earned": b["id"] in badge_map, "earned_at": badge_map[b["id"]].get("earned_at") if b["id"] in badge_map else None} for b in BADGE_DEFINITIONS]

    # Streak calendar (last 30 days)
    thirty_days = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    recent = await db.course_enrollments.find(
        {"user_id": user_id, "last_activity": {"$gte": thirty_days}}, {"last_activity": 1}
    ).to_list(200)
    activity_days = sorted(set(a["last_activity"][:10] for a in recent if a.get("last_activity")))

    # Pathways progress
    pathway_enrollments = await db.academy_pathway_enrollments.find({"user_id": user_id}).to_list(20)
    enrolled_pathways = []
    for pe in pathway_enrollments:
        pathway = await db.academy_pathways.find_one({"id": pe["pathway_id"]}, {"_id": 0, "id": 1, "title": 1, "icon": 1, "color": 1, "course_ids": 1})
        if pathway:
            completed = sum(1 for cid in pathway.get("course_ids", []) if any(e["course_id"] == cid and e.get("progress", 0) >= 100 for e in enrollments))
            pathway["progress"] = int((completed / max(len(pathway.get("course_ids", [])), 1)) * 100)
            pathway["completed_courses"] = completed
            pathway["total_courses"] = len(pathway.get("course_ids", []))
            enrolled_pathways.append(pathway)

    # Lab submissions count
    lab_count = await db.academy_lab_submissions.count_documents({"user_id": user_id})

    return {
        "continue_learning": continue_learning,
        "completed_courses": completed_courses,
        "certificates": certificates,
        "badges": badges,
        "earned_badges_count": len(user_badges),
        "activity_days": activity_days,
        "enrolled_pathways": enrolled_pathways,
        "stats": {
            "courses_enrolled": len(enrollments),
            "courses_completed": len(completed_courses),
            "certificates_earned": len(certificates),
            "learning_streak": len(activity_days),
            "total_hours": round(total_hours, 1),
            "badges_earned": len(user_badges),
            "labs_submitted": lab_count,
        }
    }


# ============== Practice Labs ==============

@router.get("/courses/{course_id}/labs")
async def list_course_labs(course_id: str, user=Depends(get_optional_user)):
    """List practice labs for a course"""
    labs = await db.academy_labs.find(
        {"course_id": course_id, "deleted": {"$ne": True}}, {"_id": 0}
    ).sort("order", 1).to_list(50)

    if user:
        for lab in labs:
            sub = await db.academy_lab_submissions.find_one(
                {"user_id": user.get("id"), "lab_id": lab["id"]}, {"_id": 0, "status": 1, "submitted_at": 1}
            )
            lab["submitted"] = bool(sub)
            lab["submission_status"] = sub.get("status") if sub else None

    return {"labs": labs}


@router.post("/courses/{course_id}/labs/{lab_id}/submit")
async def submit_lab(course_id: str, lab_id: str, submission: LabSubmission, user=Depends(get_current_user)):
    """Submit a practice lab"""
    user_id = user.get("id")

    enrollment = await db.course_enrollments.find_one({"user_id": user_id, "course_id": course_id})
    if not enrollment:
        raise HTTPException(status_code=400, detail="Enroll in this course first")

    lab = await db.academy_labs.find_one({"id": lab_id, "course_id": course_id})
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")

    # Upsert submission
    existing = await db.academy_lab_submissions.find_one({"user_id": user_id, "lab_id": lab_id})
    now = datetime.now(timezone.utc).isoformat()

    if existing:
        await db.academy_lab_submissions.update_one(
            {"user_id": user_id, "lab_id": lab_id},
            {"$set": {"content": submission.content, "repo_url": submission.repo_url, "status": "submitted", "submitted_at": now}}
        )
        return {"success": True, "updated": True}

    doc = {
        "id": str(uuid.uuid4()), "user_id": user_id, "course_id": course_id,
        "lab_id": lab_id, "content": submission.content, "repo_url": submission.repo_url,
        "status": "submitted", "submitted_at": now,
    }
    await db.academy_lab_submissions.insert_one(doc)
    return {"success": True, "submission_id": doc["id"]}



# ============== Certification Pathways ==============

@router.get("/certification-pathways")
async def list_certification_pathways():
    """List certification pathway guides"""
    pathways = await db.academy_certification_pathways.find(
        {"status": "published"}, {"_id": 0}
    ).sort("order", 1).to_list(50)
    return {"pathways": pathways}


# ============== Admin: Seed Pathways, Labs, Certifications ==============

@router.post("/admin/seed-phase-bc")
async def seed_phase_bc(user=Depends(get_current_user)):
    """Seed learning pathways, labs, and certification pathways"""
    role = (user.get("role") or "").lower().replace(" ", "_")
    if role not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    # Fetch all courses for mapping
    all_courses = {}
    async for c in db.courses.find({"deleted": {"$ne": True}, "status": "published"}, {"_id": 0, "id": 1, "title": 1, "category": 1}):
        all_courses[c["id"]] = c
        if c["category"] not in all_courses:
            all_courses[c["category"]] = []
        if isinstance(all_courses.get(c["category"]), list):
            all_courses[c["category"]].append(c["id"])

    def get_ids(category, limit=6):
        return all_courses.get(category, [])[:limit] if isinstance(all_courses.get(category), list) else []

    # --- Learning Pathways ---
    pathways = [
        {"title": "AI Engineer Path", "description": "Master artificial intelligence from fundamentals to deployment. Build neural networks, train models, and deploy AI solutions.", "icon": "brain", "color": "#7C3AED", "level": "beginner", "estimated_weeks": 12, "course_ids": get_ids("AI", 8), "order": 1},
        {"title": "Full-Stack Developer Journey", "description": "Become a complete web developer. Learn frontend, backend, databases, and DevOps.", "icon": "code", "color": "#2563EB", "level": "beginner", "estimated_weeks": 16, "course_ids": get_ids("Software Engineering", 6) + get_ids("DevOps", 3), "order": 2},
        {"title": "Digital Marketing Pro", "description": "Master SEO, social media, content marketing, and analytics to drive business growth.", "icon": "megaphone", "color": "#EC4899", "level": "beginner", "estimated_weeks": 8, "course_ids": get_ids("Digital Marketing", 8), "order": 3},
        {"title": "Healthcare Technology Specialist", "description": "Bridge healthcare and technology. Learn medical informatics, patient safety, and healthcare AI.", "icon": "heart-pulse", "color": "#059669", "level": "intermediate", "estimated_weeks": 10, "course_ids": get_ids("Healthcare", 8), "order": 4},
        {"title": "Cloud & DevOps Architect", "description": "Design and manage cloud infrastructure. Master AWS, Docker, Kubernetes, and CI/CD.", "icon": "cloud", "color": "#0EA5E9", "level": "intermediate", "estimated_weeks": 12, "course_ids": get_ids("Cloud", 4) + get_ids("DevOps", 5), "order": 5},
        {"title": "Creative Designer Path", "description": "Master UI/UX design, branding, and visual storytelling with industry-standard tools.", "icon": "palette", "color": "#F59E0B", "level": "beginner", "estimated_weeks": 8, "course_ids": get_ids("Design", 7), "order": 6},
        {"title": "Finance & Business Leader", "description": "Build financial literacy and business acumen for leadership roles.", "icon": "trending-up", "color": "#10B981", "level": "intermediate", "estimated_weeks": 8, "course_ids": get_ids("Finance", 5) + get_ids("Legal", 3), "order": 7},
        {"title": "Media Production Expert", "description": "Create professional video, audio, and multimedia content from concept to delivery.", "icon": "film", "color": "#EF4444", "level": "beginner", "estimated_weeks": 8, "course_ids": get_ids("Media", 6), "order": 8},
    ]

    pathway_count = 0
    for p in pathways:
        if not p["course_ids"]:
            continue
        existing = await db.academy_pathways.find_one({"title": p["title"]})
        if not existing:
            p["id"] = str(uuid.uuid4())
            p["status"] = "published"
            p["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.academy_pathways.insert_one(p)
            pathway_count += 1

    # --- Practice Labs ---
    lab_templates = {
        "AI": [
            {"title": "Build a Sentiment Analyzer", "description": "Create a Python script that analyzes the sentiment of text input using a pre-trained model. Test with at least 10 sample sentences.", "difficulty": "beginner", "estimated_time": "2 hours", "skills": ["Python", "NLP", "API Integration"]},
            {"title": "Image Classification Pipeline", "description": "Build an image classifier that can distinguish between 5 categories. Document your model architecture and training process.", "difficulty": "intermediate", "estimated_time": "4 hours", "skills": ["Computer Vision", "TensorFlow/PyTorch", "Data Preprocessing"]},
        ],
        "Software Engineering": [
            {"title": "REST API with Authentication", "description": "Build a REST API with user registration, login (JWT), and CRUD operations for a resource of your choice.", "difficulty": "beginner", "estimated_time": "3 hours", "skills": ["Node.js/Python", "REST API", "JWT Auth"]},
            {"title": "Real-Time Chat Application", "description": "Create a real-time chat app with WebSockets supporting multiple rooms and user presence.", "difficulty": "intermediate", "estimated_time": "5 hours", "skills": ["WebSockets", "Frontend", "Backend"]},
        ],
        "Digital Marketing": [
            {"title": "SEO Audit Report", "description": "Perform a comprehensive SEO audit on a website of your choice. Document findings and provide actionable recommendations.", "difficulty": "beginner", "estimated_time": "2 hours", "skills": ["SEO", "Analytics", "Content Strategy"]},
        ],
        "Healthcare": [
            {"title": "Patient Data Dashboard", "description": "Design a dashboard mockup for healthcare providers showing key patient metrics, appointment schedules, and alerts.", "difficulty": "beginner", "estimated_time": "3 hours", "skills": ["Data Visualization", "UX Design", "Healthcare Informatics"]},
        ],
        "Design": [
            {"title": "Mobile App Redesign", "description": "Choose an existing app and redesign 3 key screens. Document your design decisions and create a before/after comparison.", "difficulty": "intermediate", "estimated_time": "4 hours", "skills": ["UI/UX", "Figma/Design Tools", "User Research"]},
        ],
    }

    lab_count = 0
    async for course in db.courses.find({"deleted": {"$ne": True}, "status": "published"}, {"_id": 0, "id": 1, "category": 1, "title": 1}):
        templates = lab_templates.get(course["category"], [])
        for i, tmpl in enumerate(templates):
            existing = await db.academy_labs.find_one({"course_id": course["id"], "title": tmpl["title"]})
            if not existing:
                lab = {
                    "id": str(uuid.uuid4()), "course_id": course["id"], "title": tmpl["title"],
                    "description": tmpl["description"], "difficulty": tmpl["difficulty"],
                    "estimated_time": tmpl["estimated_time"], "skills": tmpl["skills"],
                    "order": i, "deleted": False, "created_at": datetime.now(timezone.utc).isoformat(),
                }
                await db.academy_labs.insert_one(lab)
                lab_count += 1

    # --- Certification Pathways ---
    cert_pathways = [
        {"title": "AWS Certified Cloud Practitioner", "provider": "Amazon Web Services", "description": "Foundational understanding of AWS Cloud concepts, services, and terminology. Recommended for anyone seeking an overall understanding of AWS.", "url": "https://aws.amazon.com/certification/certified-cloud-practitioner/", "prep_categories": ["Cloud", "DevOps"], "level": "foundational", "cost": "$100 USD", "order": 1},
        {"title": "Google Associate Cloud Engineer", "provider": "Google Cloud", "description": "Deploy applications, monitor operations, and manage enterprise solutions on Google Cloud.", "url": "https://cloud.google.com/learn/certification/cloud-engineer", "prep_categories": ["Cloud", "DevOps"], "level": "associate", "cost": "$200 USD", "order": 2},
        {"title": "CompTIA Security+", "provider": "CompTIA", "description": "Baseline cybersecurity skills for IT professionals. Covers threats, vulnerabilities, and security operations.", "url": "https://www.comptia.org/certifications/security", "prep_categories": ["Cybersecurity"], "level": "intermediate", "cost": "$404 USD", "order": 3},
        {"title": "Google UX Design Certificate", "provider": "Google / Coursera", "description": "Learn the foundations of UX design including user research, wireframing, prototyping, and usability testing.", "url": "https://grow.google/certificates/ux-design/", "prep_categories": ["Design"], "level": "beginner", "cost": "Free (Coursera)", "order": 4},
        {"title": "HubSpot Digital Marketing", "provider": "HubSpot Academy", "description": "Comprehensive digital marketing certification covering SEO, content marketing, social media, and email marketing.", "url": "https://academy.hubspot.com/courses/digital-marketing", "prep_categories": ["Digital Marketing"], "level": "beginner", "cost": "Free", "order": 5},
        {"title": "PMI Project Management Professional (PMP)", "provider": "PMI", "description": "Globally recognized project management certification for experienced project managers.", "url": "https://www.pmi.org/certifications/project-management-pmp", "prep_categories": ["Product Management", "Engineering"], "level": "advanced", "cost": "$555 USD", "order": 6},
        {"title": "HIPAA Compliance Certification", "provider": "HIPAA Training", "description": "Understanding of HIPAA regulations for healthcare professionals and IT staff handling patient data.", "url": "https://www.hipaatraining.com/", "prep_categories": ["Healthcare", "Legal"], "level": "intermediate", "cost": "$30 USD", "order": 7},
        {"title": "Meta Front-End Developer", "provider": "Meta / Coursera", "description": "Professional certificate in front-end development covering React, JavaScript, HTML/CSS, and version control.", "url": "https://www.coursera.org/professional-certificates/meta-front-end-developer", "prep_categories": ["Software Engineering"], "level": "beginner", "cost": "Free (Coursera)", "order": 8},
    ]

    cert_count = 0
    for cp in cert_pathways:
        existing = await db.academy_certification_pathways.find_one({"title": cp["title"]})
        if not existing:
            cp["id"] = str(uuid.uuid4())
            cp["status"] = "published"
            cp["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.academy_certification_pathways.insert_one(cp)
            cert_count += 1

    return {"success": True, "pathways_created": pathway_count, "labs_created": lab_count, "cert_pathways_created": cert_count}


# ============== Public Learner Profile ==============

@router.post("/profile/toggle-public")
async def toggle_public_profile(user=Depends(get_current_user)):
    """Toggle public profile visibility"""
    user_id = user.get("id")
    profile = await db.academy_profiles.find_one({"user_id": user_id})
    if profile:
        new_public = not profile.get("is_public", False)
        await db.academy_profiles.update_one({"user_id": user_id}, {"$set": {"is_public": new_public}})
        return {"is_public": new_public}
    else:
        doc = {"id": str(uuid.uuid4()), "user_id": user_id, "is_public": True, "bio": "", "created_at": datetime.now(timezone.utc).isoformat()}
        await db.academy_profiles.insert_one(doc)
        return {"is_public": True}


@router.post("/profile/update")
async def update_profile(data: dict, user=Depends(get_current_user)):
    """Update profile bio/headline"""
    user_id = user.get("id")
    now = datetime.now(timezone.utc).isoformat()
    update = {}
    if "bio" in data:
        update["bio"] = data["bio"][:500]
    if "headline" in data:
        update["headline"] = data["headline"][:150]
    if "linkedin_url" in data:
        update["linkedin_url"] = data["linkedin_url"][:200]

    if update:
        update["updated_at"] = now
        await db.academy_profiles.update_one(
            {"user_id": user_id},
            {"$set": update, "$setOnInsert": {"id": str(uuid.uuid4()), "user_id": user_id, "is_public": True, "created_at": now}},
            upsert=True
        )
    profile = await db.academy_profiles.find_one({"user_id": user_id}, {"_id": 0})
    return {"profile": profile}


@router.get("/profile/{user_id}")
async def get_public_profile(user_id: str):
    """Get a user's public learner profile"""
    profile = await db.academy_profiles.find_one({"user_id": user_id}, {"_id": 0})
    if not profile or not profile.get("is_public", False):
        raise HTTPException(status_code=404, detail="Profile not found or not public")

    # Get user basic info
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "id": 1, "name": 1, "avatar": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get completed courses
    enrollments = await db.course_enrollments.find({"user_id": user_id, "progress": 100}).to_list(100)
    completed_ids = [e["course_id"] for e in enrollments]
    completed_courses = []
    if completed_ids:
        async for c in db.courses.find({"id": {"$in": completed_ids}}, {"_id": 0, "id": 1, "title": 1, "category": 1, "thumbnail": 1}):
            completed_courses.append(c)

    # Get certificates
    certificates = await db.academy_certificates.find({"user_id": user_id, "status": "pass"}, {"_id": 0}).sort("issued_at", -1).to_list(50)

    # Get badges
    user_badges = await db.academy_user_badges.find({"user_id": user_id}, {"_id": 0}).to_list(50)
    badge_map = {ub["badge_id"]: ub for ub in user_badges}
    from routes.academy_phase_bc import BADGE_DEFINITIONS
    badges = [{**b, "earned": True, "earned_at": badge_map[b["id"]].get("earned_at")} for b in BADGE_DEFINITIONS if b["id"] in badge_map]

    # Stats
    total_enrolled = await db.course_enrollments.count_documents({"user_id": user_id})

    return {
        "user": {**user, "headline": profile.get("headline", ""), "bio": profile.get("bio", ""), "linkedin_url": profile.get("linkedin_url", "")},
        "completed_courses": completed_courses,
        "certificates": certificates,
        "badges": badges,
        "stats": {
            "courses_completed": len(completed_courses),
            "certificates_earned": len(certificates),
            "badges_earned": len(badges),
            "courses_enrolled": total_enrolled,
        }
    }


@router.get("/profile/me/data")
async def get_my_profile(user=Depends(get_current_user)):
    """Get own profile data"""
    user_id = user.get("id")
    profile = await db.academy_profiles.find_one({"user_id": user_id}, {"_id": 0})
    return {"profile": profile, "user_id": user_id}


# ============== Leaderboard ==============

@router.get("/leaderboard")
async def get_leaderboard(period: str = "all", limit: int = 25):
    """Get academy leaderboard — top learners by courses, badges, streak"""

    # Aggregate all enrolled users
    enrollments = await db.course_enrollments.find({}, {"_id": 0, "user_id": 1, "progress": 1, "last_activity": 1}).to_list(5000)

    user_stats = {}
    for e in enrollments:
        uid = e["user_id"]
        if uid not in user_stats:
            user_stats[uid] = {"courses_completed": 0, "courses_enrolled": 0, "activity_days": set()}
        user_stats[uid]["courses_enrolled"] += 1
        if e.get("progress", 0) >= 100:
            user_stats[uid]["courses_completed"] += 1
        if e.get("last_activity"):
            user_stats[uid]["activity_days"].add(e["last_activity"][:10])

    if not user_stats:
        return {"leaderboard": [], "period": period}

    # Get badge counts
    badge_counts = {}
    async for ub in db.academy_user_badges.find({}, {"_id": 0, "user_id": 1}):
        badge_counts[ub["user_id"]] = badge_counts.get(ub["user_id"], 0) + 1

    # Get cert counts
    cert_counts = {}
    async for cert in db.academy_certificates.find({"status": "pass"}, {"_id": 0, "user_id": 1}):
        cert_counts[cert["user_id"]] = cert_counts.get(cert["user_id"], 0) + 1

    # Build leaderboard entries
    user_ids = list(user_stats.keys())
    users_map = {}
    async for u in db.users.find({"id": {"$in": user_ids}}, {"_id": 0, "id": 1, "name": 1, "avatar": 1}):
        users_map[u["id"]] = u

    # Check public profiles
    public_profiles = {}
    async for p in db.academy_profiles.find({"user_id": {"$in": user_ids}, "is_public": True}, {"_id": 0, "user_id": 1, "headline": 1}):
        public_profiles[p["user_id"]] = p

    entries = []
    for uid, stats in user_stats.items():
        user = users_map.get(uid)
        if not user:
            continue
        streak = len(stats["activity_days"])
        badges = badge_counts.get(uid, 0)
        certs = cert_counts.get(uid, 0)
        completed = stats["courses_completed"]

        # Composite score: courses*10 + badges*5 + certs*8 + streak*1
        score = completed * 10 + badges * 5 + certs * 8 + streak

        profile = public_profiles.get(uid)
        entries.append({
            "user_id": uid,
            "name": user.get("name", "Learner"),
            "avatar": user.get("avatar", ""),
            "headline": profile.get("headline", "") if profile else "",
            "is_public": uid in public_profiles,
            "courses_completed": completed,
            "courses_enrolled": stats["courses_enrolled"],
            "badges_earned": badges,
            "certificates_earned": certs,
            "streak_days": streak,
            "score": score,
        })

    entries.sort(key=lambda x: x["score"], reverse=True)
    for i, e in enumerate(entries):
        e["rank"] = i + 1

    return {"leaderboard": entries[:limit], "total_learners": len(entries), "period": period}
