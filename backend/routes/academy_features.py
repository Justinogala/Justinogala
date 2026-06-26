"""
Academy Features — AI Tutor, AI Summaries, Personal Notes, Community Discussions, Lesson Resources.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
import uuid, json, asyncio

from config import db, logger
from routes.auth_helpers import get_current_user, get_optional_user

router = APIRouter(prefix="/academy", tags=["Academy Features"])


# ============== Models ==============

class TutorMessage(BaseModel):
    message: str
    lesson_id: str = ""
    lesson_title: str = ""
    course_title: str = ""


class NoteCreate(BaseModel):
    content: str
    lesson_id: str


class DiscussionCreate(BaseModel):
    title: str
    content: str
    lesson_id: str = ""  # optional, can be course-wide


class ReplyCreate(BaseModel):
    content: str


class ResourceCreate(BaseModel):
    title: str
    url: str
    type: str = "link"  # link, pdf, code, video


# ============== AI Tutor ==============

@router.post("/courses/{course_id}/ai-tutor")
async def ai_tutor_chat(course_id: str, msg: TutorMessage, user=Depends(get_current_user)):
    """AI tutor answers questions about a lesson. Returns streamed text."""
    user_id = user.get("id")

    enrollment = await db.course_enrollments.find_one({"user_id": user_id, "course_id": course_id})
    if not enrollment:
        raise HTTPException(status_code=400, detail="Enroll in this course to use AI Tutor")

    course = await db.courses.find_one({"id": course_id}, {"_id": 0, "title": 1, "category": 1, "lessons": 1})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    lesson_context = ""
    if msg.lesson_id:
        lesson = next((l for l in course.get("lessons", []) if l.get("id") == msg.lesson_id), None)
        if lesson:
            lesson_context = f"\nCurrent Lesson: {lesson.get('title', '')}\nLesson Description: {lesson.get('description', '')}"

    import os
    from dotenv import load_dotenv
    load_dotenv()
    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI not configured")

    # Get recent chat history for context
    recent = await db.academy_tutor_messages.find(
        {"user_id": user_id, "course_id": course_id},
        {"_id": 0, "role": 1, "content": 1}
    ).sort("created_at", -1).limit(6).to_list(6)
    recent.reverse()

    from emergentintegrations.llm.chat import LlmChat, UserMessage

    session_id = f"tutor-{user_id}-{course_id}-{msg.lesson_id or 'general'}"
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=f"""You are an expert AI tutor for the Munal AI Academy. You're helping a student with the course: "{course.get('title', '')}".
Category: {course.get('category', '')}
{lesson_context}

Guidelines:
- Give clear, concise explanations
- Use examples and analogies when helpful
- If the student asks about something outside the course scope, gently redirect
- Encourage the student and be supportive
- Format your responses with markdown for readability
- Keep answers focused and under 300 words unless the question requires more depth"""
    ).with_model("openai", "gpt-5.2")

    user_msg = UserMessage(text=msg.message)
    response = await chat.send_message(user_msg)
    response_text = response if isinstance(response, str) else getattr(response, "text", str(response))

    # Store messages
    now = datetime.now(timezone.utc).isoformat()
    await db.academy_tutor_messages.insert_many([
        {"id": str(uuid.uuid4()), "user_id": user_id, "course_id": course_id,
         "lesson_id": msg.lesson_id, "role": "user", "content": msg.message, "created_at": now},
        {"id": str(uuid.uuid4()), "user_id": user_id, "course_id": course_id,
         "lesson_id": msg.lesson_id, "role": "assistant", "content": response_text, "created_at": now},
    ])

    return {"response": response_text}


@router.get("/courses/{course_id}/ai-tutor/history")
async def get_tutor_history(course_id: str, lesson_id: str = "", limit: int = 20, user=Depends(get_current_user)):
    """Get AI tutor chat history for a course/lesson"""
    query = {"user_id": user.get("id"), "course_id": course_id}
    if lesson_id:
        query["lesson_id"] = lesson_id

    messages = await db.academy_tutor_messages.find(
        query, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    messages.reverse()
    return {"messages": messages}


# ============== AI Summaries ==============

@router.post("/courses/{course_id}/lessons/{lesson_id}/summary")
async def generate_lesson_summary(course_id: str, lesson_id: str, user=Depends(get_current_user)):
    """Generate AI summary for a lesson"""
    user_id = user.get("id")

    enrollment = await db.course_enrollments.find_one({"user_id": user_id, "course_id": course_id})
    if not enrollment:
        raise HTTPException(status_code=400, detail="Enroll in this course first")

    course = await db.courses.find_one({"id": course_id}, {"_id": 0, "title": 1, "lessons": 1, "category": 1})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    lesson = next((l for l in course.get("lessons", []) if l.get("id") == lesson_id), None)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Check if summary already exists
    existing = await db.academy_summaries.find_one(
        {"course_id": course_id, "lesson_id": lesson_id}, {"_id": 0}
    )
    if existing:
        return {"summary": existing}

    import os
    from dotenv import load_dotenv
    load_dotenv()
    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI not configured")

    from emergentintegrations.llm.chat import LlmChat, UserMessage

    chat = LlmChat(
        api_key=api_key,
        session_id=f"summary-{course_id}-{lesson_id}",
        system_message="You are an expert educator creating concise, well-structured lesson summaries. Use markdown formatting."
    ).with_model("openai", "gpt-5.2")

    prompt = f"""Create a comprehensive study summary for this lesson:

Course: "{course.get('title', '')}"
Lesson: "{lesson.get('title', '')}"
Description: {lesson.get('description', '')}
Category: {course.get('category', '')}

Generate a summary with these sections:
## Key Concepts
- List the main concepts covered (3-5 bullet points)

## Summary
A 2-3 paragraph overview of what this lesson covers

## Key Takeaways
- 3-5 actionable takeaways students should remember

## Study Tips
- 2-3 tips for mastering this material

Keep it focused, practical, and under 500 words total."""

    response = await chat.send_message(UserMessage(text=prompt))
    response_text = response if isinstance(response, str) else getattr(response, "text", str(response))

    summary_doc = {
        "id": str(uuid.uuid4()),
        "course_id": course_id,
        "lesson_id": lesson_id,
        "content": response_text,
        "generated_by": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.academy_summaries.insert_one(summary_doc)
    summary_doc.pop("_id", None)

    return {"summary": summary_doc}


@router.get("/courses/{course_id}/lessons/{lesson_id}/summary")
async def get_lesson_summary(course_id: str, lesson_id: str, user=Depends(get_optional_user)):
    """Get existing summary for a lesson"""
    summary = await db.academy_summaries.find_one(
        {"course_id": course_id, "lesson_id": lesson_id}, {"_id": 0}
    )
    return {"summary": summary}


# ============== Personal Notes ==============

@router.get("/courses/{course_id}/lessons/{lesson_id}/notes")
async def get_lesson_notes(course_id: str, lesson_id: str, user=Depends(get_current_user)):
    """Get user's personal notes for a lesson"""
    note = await db.academy_notes.find_one(
        {"user_id": user.get("id"), "course_id": course_id, "lesson_id": lesson_id},
        {"_id": 0}
    )
    return {"note": note}


@router.post("/courses/{course_id}/lessons/{lesson_id}/notes")
async def save_lesson_notes(course_id: str, lesson_id: str, note: NoteCreate, user=Depends(get_current_user)):
    """Save or update personal notes for a lesson"""
    user_id = user.get("id")
    now = datetime.now(timezone.utc).isoformat()

    existing = await db.academy_notes.find_one(
        {"user_id": user_id, "course_id": course_id, "lesson_id": lesson_id}
    )

    if existing:
        await db.academy_notes.update_one(
            {"user_id": user_id, "course_id": course_id, "lesson_id": lesson_id},
            {"$set": {"content": note.content, "updated_at": now}}
        )
        updated = await db.academy_notes.find_one(
            {"user_id": user_id, "course_id": course_id, "lesson_id": lesson_id},
            {"_id": 0}
        )
        return {"note": updated, "updated": True}

    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "course_id": course_id,
        "lesson_id": note.lesson_id,
        "content": note.content,
        "created_at": now,
        "updated_at": now,
    }
    await db.academy_notes.insert_one(doc)
    doc.pop("_id", None)
    return {"note": doc, "updated": False}


# ============== Community Discussions ==============

@router.get("/courses/{course_id}/discussions")
async def list_discussions(
    course_id: str,
    lesson_id: str = "",
    limit: int = 20,
    offset: int = 0,
    user=Depends(get_optional_user),
):
    """List discussions for a course"""
    query = {"course_id": course_id, "deleted": {"$ne": True}}
    if lesson_id:
        query["lesson_id"] = lesson_id

    total = await db.academy_discussions.count_documents(query)
    discussions = await db.academy_discussions.find(
        query, {"_id": 0}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)

    # Attach reply counts
    for d in discussions:
        d["reply_count"] = await db.academy_discussion_replies.count_documents(
            {"discussion_id": d["id"], "deleted": {"$ne": True}}
        )

    return {"discussions": discussions, "total": total}


@router.post("/courses/{course_id}/discussions")
async def create_discussion(course_id: str, disc: DiscussionCreate, user=Depends(get_current_user)):
    """Create a discussion thread"""
    user_id = user.get("id")

    # Must be enrolled
    enrollment = await db.course_enrollments.find_one({"user_id": user_id, "course_id": course_id})
    if not enrollment:
        raise HTTPException(status_code=400, detail="Enroll in this course to participate in discussions")

    doc = {
        "id": str(uuid.uuid4()),
        "course_id": course_id,
        "lesson_id": disc.lesson_id,
        "user_id": user_id,
        "user_name": user.get("name", ""),
        "user_avatar": user.get("avatar", ""),
        "title": disc.title,
        "content": disc.content,
        "upvotes": 0,
        "upvoted_by": [],
        "deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.academy_discussions.insert_one(doc)
    doc.pop("_id", None)
    return {"discussion": doc}


@router.get("/courses/{course_id}/discussions/{discussion_id}")
async def get_discussion(course_id: str, discussion_id: str, user=Depends(get_optional_user)):
    """Get a single discussion with replies"""
    disc = await db.academy_discussions.find_one(
        {"id": discussion_id, "course_id": course_id, "deleted": {"$ne": True}},
        {"_id": 0}
    )
    if not disc:
        raise HTTPException(status_code=404, detail="Discussion not found")

    replies = await db.academy_discussion_replies.find(
        {"discussion_id": discussion_id, "deleted": {"$ne": True}},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)

    disc["replies"] = replies
    return disc


@router.post("/courses/{course_id}/discussions/{discussion_id}/replies")
async def create_reply(course_id: str, discussion_id: str, reply: ReplyCreate, user=Depends(get_current_user)):
    """Reply to a discussion"""
    user_id = user.get("id")

    enrollment = await db.course_enrollments.find_one({"user_id": user_id, "course_id": course_id})
    if not enrollment:
        raise HTTPException(status_code=400, detail="Enroll in this course to reply")

    disc = await db.academy_discussions.find_one({"id": discussion_id, "deleted": {"$ne": True}})
    if not disc:
        raise HTTPException(status_code=404, detail="Discussion not found")

    doc = {
        "id": str(uuid.uuid4()),
        "discussion_id": discussion_id,
        "course_id": course_id,
        "user_id": user_id,
        "user_name": user.get("name", ""),
        "user_avatar": user.get("avatar", ""),
        "content": reply.content,
        "upvotes": 0,
        "upvoted_by": [],
        "deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.academy_discussion_replies.insert_one(doc)
    doc.pop("_id", None)
    return {"reply": doc}


@router.post("/courses/{course_id}/discussions/{discussion_id}/upvote")
async def upvote_discussion(course_id: str, discussion_id: str, user=Depends(get_current_user)):
    """Toggle upvote on a discussion"""
    user_id = user.get("id")
    disc = await db.academy_discussions.find_one({"id": discussion_id, "deleted": {"$ne": True}})
    if not disc:
        raise HTTPException(status_code=404, detail="Discussion not found")

    upvoted_by = disc.get("upvoted_by", [])
    if user_id in upvoted_by:
        upvoted_by.remove(user_id)
        action = "removed"
    else:
        upvoted_by.append(user_id)
        action = "added"

    await db.academy_discussions.update_one(
        {"id": discussion_id},
        {"$set": {"upvoted_by": upvoted_by, "upvotes": len(upvoted_by)}}
    )
    return {"upvotes": len(upvoted_by), "action": action}


# ============== Lesson Resources (Admin) ==============

@router.post("/admin/courses/{course_id}/lessons/{lesson_id}/resources")
async def add_lesson_resource(course_id: str, lesson_id: str, resource: ResourceCreate, user=Depends(get_current_user)):
    """Add a downloadable resource to a lesson (admin only)"""
    role = (user.get("role") or "").lower().replace(" ", "_")
    if role not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    course = await db.courses.find_one({"id": course_id, "deleted": {"$ne": True}})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    lesson_found = False
    for lesson in course.get("lessons", []):
        if lesson.get("id") == lesson_id:
            resources = lesson.get("resources", [])
            resources.append({
                "id": str(uuid.uuid4()),
                "title": resource.title,
                "url": resource.url,
                "type": resource.type,
                "added_at": datetime.now(timezone.utc).isoformat(),
            })
            lesson["resources"] = resources
            lesson_found = True
            break

    if not lesson_found:
        raise HTTPException(status_code=404, detail="Lesson not found")

    await db.courses.update_one(
        {"id": course_id},
        {"$set": {"lessons": course["lessons"], "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True}


@router.delete("/admin/courses/{course_id}/lessons/{lesson_id}/resources/{resource_id}")
async def remove_lesson_resource(course_id: str, lesson_id: str, resource_id: str, user=Depends(get_current_user)):
    """Remove a resource from a lesson (admin only)"""
    role = (user.get("role") or "").lower().replace(" ", "_")
    if role not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    course = await db.courses.find_one({"id": course_id, "deleted": {"$ne": True}})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    for lesson in course.get("lessons", []):
        if lesson.get("id") == lesson_id:
            lesson["resources"] = [r for r in lesson.get("resources", []) if r.get("id") != resource_id]
            break

    await db.courses.update_one(
        {"id": course_id},
        {"$set": {"lessons": course["lessons"], "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True}


# ============== Seed Resources for Existing Courses ==============

@router.post("/admin/courses/seed-resources")
async def seed_resources_for_courses(user=Depends(get_current_user)):
    """Add sample downloadable resources to existing courses"""
    role = (user.get("role") or "").lower().replace(" ", "_")
    if role not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    RESOURCE_TEMPLATES = {
        "AI": [
            {"title": "AI Concepts Cheatsheet", "url": "#", "type": "pdf"},
            {"title": "Python AI Starter Code", "url": "#", "type": "code"},
        ],
        "Software Engineering": [
            {"title": "Clean Code Principles", "url": "#", "type": "pdf"},
            {"title": "Design Patterns Reference", "url": "#", "type": "link"},
        ],
        "Healthcare": [
            {"title": "Medical Terminology Guide", "url": "#", "type": "pdf"},
            {"title": "Patient Safety Checklist", "url": "#", "type": "pdf"},
        ],
        "Digital Marketing": [
            {"title": "SEO Checklist 2026", "url": "#", "type": "pdf"},
            {"title": "Social Media Calendar Template", "url": "#", "type": "link"},
        ],
    }
    default_resources = [
        {"title": "Lesson Slides", "url": "#", "type": "pdf"},
        {"title": "Additional Reading", "url": "#", "type": "link"},
    ]

    count = 0
    async for course in db.courses.find({"deleted": {"$ne": True}}, {"_id": 0, "id": 1, "category": 1, "lessons": 1}):
        templates = RESOURCE_TEMPLATES.get(course.get("category"), default_resources)
        updated = False
        for lesson in course.get("lessons", []):
            if not lesson.get("resources"):
                lesson["resources"] = [
                    {**r, "id": str(uuid.uuid4()), "added_at": datetime.now(timezone.utc).isoformat()}
                    for r in templates
                ]
                updated = True
        if updated:
            await db.courses.update_one({"id": course["id"]}, {"$set": {"lessons": course["lessons"]}})
            count += 1

    return {"success": True, "courses_updated": count}
