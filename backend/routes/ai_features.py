"""
AI Smart Features — 5 customer-facing AI capabilities:
1. AI Document Summarizer
2. AI Meeting Summary Emails
3. AI Smart Search (NLP across all data)
4. AI Auto-Generated Meeting Agenda
5. AI Weekly Digest
"""
import os
import io
import re
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Query, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from config import db, logger
import resend

router = APIRouter(prefix="/ai-features", tags=["AI Features"])

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

def _get_llm_key():
    return EMERGENT_LLM_KEY or os.environ.get('OPENAI_API_KEY', '')

def _chat_sync(messages, max_tokens=1500):
    """LLM call with fast failure on rate limits."""
    from openai import OpenAI
    try:
        client = OpenAI(
            api_key=_get_llm_key(),
            base_url="https://integrations.emergentagent.com/llm",
            max_retries=0,
            timeout=15
        )
        resp = client.chat.completions.create(model="gpt-5.5", messages=messages, max_tokens=max_tokens)
        return resp.choices[0].message.content
    except Exception as e:
        logger.warning(f"LLM call failed: {str(e)[:120]}")
        return ""


# ─────────────────────────────────────────────────
# 1. AI DOCUMENT SUMMARIZER
# ─────────────────────────────────────────────────

class DocSummarizeRequest(BaseModel):
    document_id: str
    mode: str = "summary"  # summary | key_points | qa
    question: Optional[str] = None

@router.post("/document/summarize")
async def summarize_document(req: DocSummarizeRequest):
    """Summarize a document from DocHub (PDF/DOCX) using AI."""
    doc = await db.pdf_documents.find_one({"id": req.document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Document not found")

    text_content = ""
    pdf_data = doc.get("pdf_data") or doc.get("data")
    if pdf_data:
        try:
            import base64
            import fitz
            raw = base64.b64decode(pdf_data)
            pdf_doc = fitz.open(stream=raw, filetype="pdf")
            for page in pdf_doc:
                text_content += page.get_text()
            pdf_doc.close()
        except Exception as e:
            logger.error(f"PDF text extraction error: {e}")

    if not text_content.strip():
        raise HTTPException(400, "Could not extract text from document")

    text_content = text_content[:12000]

    try:
        if req.mode == "qa" and req.question:
            prompt = f"Based on this document, answer the following question concisely:\n\nQuestion: {req.question}\n\nDocument:\n{text_content}"
            messages = [
                {"role": "system", "content": "You are a document analysis assistant. Answer questions accurately based only on the provided document content."},
                {"role": "user", "content": prompt}
            ]
            answer = await asyncio.to_thread(_chat_sync, messages, 800)
            if not answer:
                return {"success": True, "mode": "qa", "question": req.question, "answer": "AI is temporarily unavailable due to rate limits. Please try again in a moment.", "rate_limited": True}
            return {"success": True, "mode": "qa", "question": req.question, "answer": answer}

        elif req.mode == "key_points":
            prompt = f"Extract the key points from this document as a JSON array of strings (max 10 points):\n\n{text_content}"
            messages = [
                {"role": "system", "content": "You are a document analysis assistant. Return only a JSON array of key point strings, nothing else."},
                {"role": "user", "content": prompt}
            ]
            result = await asyncio.to_thread(_chat_sync, messages, 1000)
            if not result:
                return {"success": True, "mode": "key_points", "key_points": ["AI is temporarily rate-limited. Please try again shortly."], "rate_limited": True}
            import json
            try:
                points = json.loads(result)
            except:
                points = [line.strip("- ").strip() for line in result.split("\n") if line.strip()]
            return {"success": True, "mode": "key_points", "key_points": points}

        else:
            prompt = f"Provide a comprehensive summary of this document in 3-5 paragraphs. Include the main topic, key arguments, important details, and conclusions:\n\n{text_content}"
            messages = [
                {"role": "system", "content": "You are a document analysis assistant. Provide clear, well-structured summaries."},
                {"role": "user", "content": prompt}
            ]
            summary = await asyncio.to_thread(_chat_sync, messages, 1200)
            if not summary:
                return {"success": True, "mode": "summary", "summary": "AI is temporarily unavailable due to rate limits. Please try again in a moment.", "document_title": doc.get("name", "Untitled"), "word_count": len(text_content.split()), "rate_limited": True}
            return {"success": True, "mode": "summary", "summary": summary, "document_title": doc.get("name", "Untitled"), "word_count": len(text_content.split())}
    except Exception as e:
        logger.error(f"Document summarize error: {e}")
        return {"success": True, "mode": req.mode, "summary": "AI is temporarily unavailable. Please try again shortly.", "rate_limited": True, "document_title": doc.get("name", "Untitled")}


# ─────────────────────────────────────────────────
# 2. AI MEETING SUMMARY EMAILS
# ─────────────────────────────────────────────────

class MeetingSummaryEmailRequest(BaseModel):
    meeting_id: str
    recipient_emails: list[str] = []

@router.post("/meeting/{meeting_id}/send-summary")
async def send_meeting_summary_email(meeting_id: str, req: MeetingSummaryEmailRequest):
    """Send AI-generated meeting summary email to participants."""
    doc = await db.meeting_transcripts.find_one({"id": meeting_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Meeting transcript not found")
    if doc.get("status") != "completed":
        raise HTTPException(400, "Transcript not ready yet")

    title = doc.get("title", "Meeting")
    insights = doc.get("insights", {})
    created = doc.get("created_at", "")[:10]
    participants = doc.get("participants", [])
    duration = doc.get("duration_seconds", 0)
    duration_str = f"{duration // 60} min" if duration else "N/A"

    summary = insights.get("summary", "No summary available.")
    action_items = insights.get("action_items", [])
    key_decisions = insights.get("key_decisions", [])
    follow_ups = insights.get("follow_ups", [])

    action_items_html = ""
    if action_items:
        items = "".join(f'<li style="padding:6px 0;border-bottom:1px solid #f0f0f0"><strong>{a["task"]}</strong><br><span style="color:#6b7280;font-size:13px">Assigned to: {a.get("assignee","Unassigned")} | Priority: {a.get("priority","medium")}</span></li>' for a in action_items)
        action_items_html = f'<h3 style="color:#4f46e5;margin:20px 0 10px">Action Items</h3><ul style="list-style:none;padding:0;margin:0">{items}</ul>'

    decisions_html = ""
    if key_decisions:
        items = "".join(f'<li style="padding:6px 0"><strong>{d["decision"]}</strong> — <span style="color:#6b7280">{d.get("context","")}</span></li>' for d in key_decisions)
        decisions_html = f'<h3 style="color:#4f46e5;margin:20px 0 10px">Key Decisions</h3><ul style="list-style:none;padding:0;margin:0">{items}</ul>'

    followups_html = ""
    if follow_ups:
        items = "".join(f'<li style="padding:4px 0">{f["item"]} <span style="color:#6b7280">(Due: {f.get("due","TBD")})</span></li>' for f in follow_ups)
        followups_html = f'<h3 style="color:#4f46e5;margin:20px 0 10px">Follow-ups</h3><ul style="padding-left:20px;margin:0">{items}</ul>'

    html = f"""
    <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937">
        <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:30px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:white;margin:0;font-size:22px">Meeting Summary</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px">{title}</p>
        </div>
        <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px">
            <div style="display:flex;gap:20px;margin-bottom:20px;padding:12px;background:#f9fafb;border-radius:8px;font-size:13px;color:#6b7280">
                <span>Date: <strong style="color:#1f2937">{created}</strong></span>
                <span>Duration: <strong style="color:#1f2937">{duration_str}</strong></span>
                <span>Participants: <strong style="color:#1f2937">{len(participants)}</strong></span>
            </div>
            <h3 style="color:#4f46e5;margin:0 0 10px">Summary</h3>
            <p style="line-height:1.6;color:#374151">{summary}</p>
            {decisions_html}
            {action_items_html}
            {followups_html}
            <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0">
            <p style="text-align:center;color:#9ca3af;font-size:12px">Powered by Munal AI</p>
        </div>
    </div>
    """

    recipients = req.recipient_emails if req.recipient_emails else []
    if not recipients:
        for p in participants:
            user = await db.users.find_one({"name": {"$regex": re.escape(p), "$options": "i"}}, {"_id": 0, "email": 1})
            if user and user.get("email"):
                recipients.append(user["email"])

    if not recipients:
        raise HTTPException(400, "No recipient emails provided or found for participants")

    sent_to = []
    errors = []
    for email in recipients[:20]:
        try:
            await asyncio.to_thread(resend.Emails.send, {
                "from": SENDER_EMAIL,
                "to": email,
                "subject": f"Meeting Summary: {title}",
                "html": html
            })
            sent_to.append(email)
        except Exception as e:
            logger.error(f"Email send error for {email}: {e}")
            errors.append({"email": email, "error": str(e)})

    await db.meeting_transcripts.update_one(
        {"id": meeting_id},
        {"$set": {"summary_emailed": True, "summary_emailed_at": datetime.now(timezone.utc).isoformat(), "summary_emailed_to": sent_to}}
    )

    return {"success": True, "sent_to": sent_to, "failed": errors, "total_sent": len(sent_to)}


# ─────────────────────────────────────────────────
# 3. AI SMART SEARCH (NLP across all data)
# ─────────────────────────────────────────────────

class SmartSearchRequest(BaseModel):
    query: str
    user_id: str

@router.post("/smart-search")
async def ai_smart_search(req: SmartSearchRequest):
    """AI-powered natural language search across meetings, transcripts, documents, sheets, and chats."""
    query = req.query.strip()
    if not query:
        raise HTTPException(400, "Query is required")

    results = {
        "meetings": [],
        "transcripts": [],
        "documents": [],
        "sheets": [],
        "messages": [],
        "ai_answer": ""
    }

    regex = {"$regex": re.escape(query), "$options": "i"}

    async def search_transcripts():
        cursor = db.meeting_transcripts.find(
            {"user_id": req.user_id, "$or": [
                {"title": regex},
                {"transcript.text": regex},
                {"insights.summary": regex},
                {"participants": regex},
            ]},
            {"_id": 0, "id": 1, "title": 1, "created_at": 1, "insights.summary": 1, "participants": 1, "status": 1}
        ).sort("created_at", -1).limit(5)
        return await cursor.to_list(5)

    async def search_documents():
        cursor = db.pdf_documents.find(
            {"$or": [
                {"name": regex},
                {"original_filename": regex},
            ]},
            {"_id": 0, "id": 1, "name": 1, "original_filename": 1, "created_at": 1, "page_count": 1}
        ).sort("created_at", -1).limit(5)
        return await cursor.to_list(5)

    async def search_sheets():
        cursor = db.sheets.find(
            {"title": regex},
            {"_id": 0, "id": 1, "title": 1, "created_at": 1}
        ).sort("created_at", -1).limit(5)
        return await cursor.to_list(5)

    async def search_calendar():
        cursor = db.calendar_events.find(
            {"created_by": req.user_id, "$or": [
                {"title": regex},
                {"description": regex},
            ]},
            {"_id": 0, "id": 1, "title": 1, "start_time": 1, "description": 1}
        ).sort("start_time", -1).limit(5)
        return await cursor.to_list(5)

    async def search_messages():
        cursor = db.chat_messages.find(
            {"content": regex, "$or": [{"sender_id": req.user_id}, {"receiver_id": req.user_id}]},
            {"_id": 0, "id": 1, "content": 1, "sender_id": 1, "created_at": 1}
        ).sort("created_at", -1).limit(5)
        return await cursor.to_list(5)

    transcripts, documents, sheets, meetings, messages = await asyncio.gather(
        search_transcripts(), search_documents(), search_sheets(), search_calendar(), search_messages()
    )

    results["transcripts"] = transcripts
    results["documents"] = documents
    results["sheets"] = sheets
    results["meetings"] = meetings
    results["messages"] = messages

    total = len(transcripts) + len(documents) + len(sheets) + len(meetings) + len(messages)

    context_parts = []
    for t in transcripts[:3]:
        s = t.get("insights", {}).get("summary", "")
        context_parts.append(f"Meeting '{t.get('title','')}' ({t.get('created_at','')[:10]}): {s[:200]}")
    for d in documents[:2]:
        context_parts.append(f"Document: {d.get('name', d.get('original_filename', ''))}")
    for s in sheets[:2]:
        context_parts.append(f"Sheet: {s.get('title','')}")
    for m in meetings[:2]:
        context_parts.append(f"Calendar event: {m.get('title','')} at {m.get('start_time','')[:10]}")

    if context_parts:
        context = "\n".join(context_parts)
        try:
            ai_answer = await asyncio.to_thread(_chat_sync, [
                {"role": "system", "content": "You are a helpful workspace assistant. Based on the search results context, provide a brief, direct answer to the user's query. Be concise (2-3 sentences max). If the context doesn't contain enough info, say so briefly."},
                {"role": "user", "content": f"User searched: \"{query}\"\n\nRelevant context from their workspace:\n{context}\n\nProvide a helpful brief answer:"}
            ], 300)
            results["ai_answer"] = ai_answer
        except Exception as e:
            logger.error(f"AI search answer error: {e}")

    results["total_results"] = total
    return {"success": True, **results}


# ─────────────────────────────────────────────────
# 4. AI AUTO-GENERATED MEETING AGENDA
# ─────────────────────────────────────────────────

class AgendaRequest(BaseModel):
    user_id: str
    meeting_title: str = ""
    participant_names: list[str] = []
    meeting_date: str = ""

@router.post("/meeting/generate-agenda")
async def generate_meeting_agenda(req: AgendaRequest):
    """AI generates a meeting agenda based on past meetings, open action items, and follow-ups."""
    context_parts = []

    past_transcripts = await db.meeting_transcripts.find(
        {"user_id": req.user_id, "status": "completed"},
        {"_id": 0, "title": 1, "insights": 1, "participants": 1, "created_at": 1}
    ).sort("created_at", -1).limit(10).to_list(10)

    relevant = []
    for t in past_transcripts:
        if req.participant_names:
            tp = [p.lower() for p in (t.get("participants") or [])]
            if any(name.lower() in tp for name in req.participant_names):
                relevant.append(t)
        else:
            relevant.append(t)

    relevant = relevant[:5]

    open_actions = []
    pending_followups = []
    for t in relevant:
        insights = t.get("insights", {})
        title = t.get("title", "")
        date = (t.get("created_at") or "")[:10]
        summary = insights.get("summary", "")[:200]
        context_parts.append(f"Previous meeting: '{title}' ({date}) - {summary}")

        for a in insights.get("action_items", []):
            open_actions.append(f"- {a['task']} (assigned: {a.get('assignee','?')}, priority: {a.get('priority','medium')}) from '{title}'")
        for f in insights.get("follow_ups", []):
            pending_followups.append(f"- {f['item']} (due: {f.get('due','TBD')}) from '{title}'")

    prompt_parts = [f"Generate a professional meeting agenda for: \"{req.meeting_title or 'Team Meeting'}\""]
    if req.meeting_date:
        prompt_parts.append(f"Scheduled for: {req.meeting_date}")
    if req.participant_names:
        prompt_parts.append(f"Participants: {', '.join(req.participant_names)}")
    if context_parts:
        prompt_parts.append(f"\nContext from past meetings:\n" + "\n".join(context_parts))
    if open_actions:
        prompt_parts.append(f"\nOpen action items to review:\n" + "\n".join(open_actions[:10]))
    if pending_followups:
        prompt_parts.append(f"\nPending follow-ups:\n" + "\n".join(pending_followups[:10]))

    prompt_parts.append("""
Return a JSON object with this structure:
{
  "agenda_title": "...",
  "estimated_duration": "45 min",
  "items": [
    {"order": 1, "topic": "...", "description": "...", "duration": "5 min", "type": "opening|discussion|review|action|closing"},
    ...
  ],
  "notes": "Any additional preparation notes"
}
Only return valid JSON, no markdown.
""")

    try:
        import json
        result = await asyncio.to_thread(_chat_sync, [
            {"role": "system", "content": "You are a professional meeting planner. Generate structured, actionable meeting agendas based on context."},
            {"role": "user", "content": "\n".join(prompt_parts)}
        ], 1500)

        if not result:
            # Rate limited — return a basic fallback agenda
            fallback_items = [
                {"order": 1, "topic": "Welcome & Check-in", "description": "Brief introductions and updates", "duration": "5 min", "type": "opening"},
                {"order": 2, "topic": req.meeting_title or "Main Discussion", "description": "Primary meeting topic", "duration": "20 min", "type": "discussion"},
            ]
            if open_actions:
                fallback_items.append({"order": 3, "topic": "Review Open Action Items", "description": f"{len(open_actions)} items from previous meetings", "duration": "10 min", "type": "review"})
            if pending_followups:
                fallback_items.append({"order": len(fallback_items)+1, "topic": "Follow-up Items", "description": f"{len(pending_followups)} pending follow-ups", "duration": "5 min", "type": "review"})
            fallback_items.append({"order": len(fallback_items)+1, "topic": "Next Steps & Close", "description": "Assign action items and wrap up", "duration": "5 min", "type": "closing"})
            return {
                "success": True,
                "agenda": {"agenda_title": req.meeting_title or "Team Meeting", "estimated_duration": "45 min", "items": fallback_items, "notes": "AI-enhanced agenda temporarily unavailable. This is a basic agenda based on your meeting history."},
                "context_used": {"past_meetings_analyzed": len(relevant), "open_action_items": len(open_actions), "pending_followups": len(pending_followups)},
                "rate_limited": True
            }

        result = result.strip()
        if result.startswith("```"):
            result = re.sub(r'^```(?:json)?\s*', '', result)
            result = re.sub(r'\s*```$', '', result)

        agenda = json.loads(result)
        return {
            "success": True,
            "agenda": agenda,
            "context_used": {
                "past_meetings_analyzed": len(relevant),
                "open_action_items": len(open_actions),
                "pending_followups": len(pending_followups)
            }
        }
    except Exception as e:
        logger.error(f"Agenda generation error: {e}")
        # Return fallback instead of crashing
        return {
            "success": True,
            "agenda": {
                "agenda_title": req.meeting_title or "Team Meeting",
                "estimated_duration": "30 min",
                "items": [
                    {"order": 1, "topic": "Welcome", "description": "Opening remarks", "duration": "5 min", "type": "opening"},
                    {"order": 2, "topic": req.meeting_title or "Discussion", "description": "Main topic", "duration": "20 min", "type": "discussion"},
                    {"order": 3, "topic": "Wrap Up", "description": "Action items and next steps", "duration": "5 min", "type": "closing"}
                ],
                "notes": "AI is temporarily unavailable. This is a basic agenda template."
            },
            "context_used": {"past_meetings_analyzed": len(relevant), "open_action_items": len(open_actions), "pending_followups": len(pending_followups)},
            "rate_limited": True
        }


# ─────────────────────────────────────────────────
# 5. AI WEEKLY DIGEST
# ─────────────────────────────────────────────────

@router.get("/weekly-digest/preview/{user_id}")
async def preview_weekly_digest(user_id: str):
    """Preview the AI weekly digest for a user (same content that would be emailed)."""
    digest = await _generate_weekly_digest(user_id)
    if not digest:
        raise HTTPException(404, "No activity found for digest")
    return {"success": True, **digest}


@router.post("/weekly-digest/send/{user_id}")
async def send_weekly_digest_now(user_id: str):
    """Manually trigger weekly digest email for a user."""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "email": 1, "name": 1})
    if not user:
        raise HTTPException(404, "User not found")

    digest = await _generate_weekly_digest(user_id)
    if not digest:
        return {"success": False, "message": "No activity to summarize"}

    html = _build_digest_email_html(digest, user.get("name", "there"))
    try:
        await asyncio.to_thread(resend.Emails.send, {
            "from": SENDER_EMAIL,
            "to": user["email"],
            "subject": f"Your Weekly AI Digest — {digest['week_label']}",
            "html": html
        })
        return {"success": True, "sent_to": user["email"]}
    except Exception as e:
        logger.error(f"Digest email error: {e}")
        raise HTTPException(500, f"Email send failed: {str(e)}")


async def _generate_weekly_digest(user_id: str):
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    week_label = f"{week_ago.strftime('%b %d')} - {now.strftime('%b %d, %Y')}"

    meetings = await db.meeting_transcripts.find(
        {"user_id": user_id, "created_at": {"$gte": week_ago.isoformat()}},
        {"_id": 0, "title": 1, "insights": 1, "created_at": 1, "duration_seconds": 1, "participants": 1}
    ).sort("created_at", -1).to_list(50)

    events = await db.calendar_events.find(
        {"created_by": user_id, "start_time": {"$gte": week_ago.isoformat(), "$lte": now.isoformat()}},
        {"_id": 0, "title": 1, "start_time": 1}
    ).sort("start_time", -1).to_list(50)

    upcoming_events = await db.calendar_events.find(
        {"created_by": user_id, "start_time": {"$gte": now.isoformat(), "$lte": (now + timedelta(days=7)).isoformat()}},
        {"_id": 0, "title": 1, "start_time": 1}
    ).sort("start_time", 1).to_list(10)

    all_actions = []
    all_decisions = []
    meeting_summaries = []
    total_meeting_time = 0

    for m in meetings:
        ins = m.get("insights", {})
        meeting_summaries.append(f"- {m.get('title','Untitled')} ({(m.get('created_at',''))[:10]}): {ins.get('summary','')[:150]}")
        total_meeting_time += m.get("duration_seconds", 0)
        for a in ins.get("action_items", []):
            all_actions.append(a)
        for d in ins.get("key_decisions", []):
            all_decisions.append(d)

    if not meetings and not events:
        return None

    context = f"""This week's activity for the user:
- {len(meetings)} meetings transcribed ({total_meeting_time // 60} total minutes)
- {len(events)} calendar events
- {len(all_actions)} action items assigned
- {len(all_decisions)} key decisions made

Meeting details:
{chr(10).join(meeting_summaries[:10]) if meeting_summaries else 'No meeting summaries available.'}

Upcoming next week:
{chr(10).join(f'- {e.get("title","")} on {e.get("start_time","")[:10]}' for e in upcoming_events[:5]) if upcoming_events else 'No upcoming events.'}
"""

    try:
        ai_summary = await asyncio.to_thread(_chat_sync, [
            {"role": "system", "content": "You are a professional executive assistant. Write a brief, warm weekly digest summary (3-4 sentences) highlighting key accomplishments, important decisions, and priorities for next week. Be encouraging and specific."},
            {"role": "user", "content": context}
        ], 400)
    except:
        ai_summary = f"You had {len(meetings)} meetings this week totaling {total_meeting_time // 60} minutes."

    return {
        "week_label": week_label,
        "ai_summary": ai_summary,
        "stats": {
            "meetings_count": len(meetings),
            "total_meeting_minutes": total_meeting_time // 60,
            "events_count": len(events),
            "action_items_count": len(all_actions),
            "decisions_count": len(all_decisions),
        },
        "action_items": all_actions[:10],
        "key_decisions": all_decisions[:10],
        "upcoming_events": [{"title": e.get("title",""), "date": e.get("start_time","")[:10]} for e in upcoming_events[:5]],
        "meeting_highlights": [{"title": m.get("title",""), "date": (m.get("created_at",""))[:10], "summary": m.get("insights",{}).get("summary","")[:200]} for m in meetings[:5]]
    }


def _build_digest_email_html(digest, user_name):
    stats = digest["stats"]
    ai_summary = digest["ai_summary"]
    week_label = digest["week_label"]

    actions_html = ""
    if digest["action_items"]:
        items = "".join(f'<li style="padding:4px 0"><strong>{a["task"]}</strong> <span style="color:#6b7280">({a.get("assignee","Unassigned")})</span></li>' for a in digest["action_items"][:5])
        actions_html = f'<h3 style="color:#4f46e5;margin:18px 0 8px;font-size:15px">Open Action Items</h3><ul style="padding-left:20px;margin:0">{items}</ul>'

    upcoming_html = ""
    if digest["upcoming_events"]:
        items = "".join(f'<li style="padding:4px 0">{e["title"]} — <span style="color:#6b7280">{e["date"]}</span></li>' for e in digest["upcoming_events"])
        upcoming_html = f'<h3 style="color:#4f46e5;margin:18px 0 8px;font-size:15px">Coming Up Next Week</h3><ul style="padding-left:20px;margin:0">{items}</ul>'

    highlights_html = ""
    if digest["meeting_highlights"]:
        items = "".join(f'<div style="padding:8px 12px;background:#f9fafb;border-radius:6px;margin-bottom:8px"><strong>{m["title"]}</strong> <span style="color:#6b7280;font-size:12px">({m["date"]})</span><br><span style="color:#374151;font-size:13px">{m["summary"]}</span></div>' for m in digest["meeting_highlights"][:3])
        highlights_html = f'<h3 style="color:#4f46e5;margin:18px 0 8px;font-size:15px">Meeting Highlights</h3>{items}'

    return f"""
    <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937">
        <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:30px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:white;margin:0;font-size:20px">Your Weekly AI Digest</h1>
            <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px">{week_label}</p>
        </div>
        <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px">
            <p style="font-size:15px">Hi {user_name},</p>
            <p style="line-height:1.6;color:#374151">{ai_summary}</p>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:20px 0">
                <div style="text-align:center;padding:12px;background:#f0f0ff;border-radius:8px">
                    <div style="font-size:24px;font-weight:700;color:#4f46e5">{stats['meetings_count']}</div>
                    <div style="font-size:11px;color:#6b7280;text-transform:uppercase">Meetings</div>
                </div>
                <div style="text-align:center;padding:12px;background:#f0fdf4;border-radius:8px">
                    <div style="font-size:24px;font-weight:700;color:#16a34a">{stats['action_items_count']}</div>
                    <div style="font-size:11px;color:#6b7280;text-transform:uppercase">Action Items</div>
                </div>
                <div style="text-align:center;padding:12px;background:#fef3f2;border-radius:8px">
                    <div style="font-size:24px;font-weight:700;color:#dc2626">{stats['decisions_count']}</div>
                    <div style="font-size:11px;color:#6b7280;text-transform:uppercase">Decisions</div>
                </div>
            </div>
            {highlights_html}
            {actions_html}
            {upcoming_html}
            <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0">
            <p style="text-align:center;color:#9ca3af;font-size:12px">Powered by Munal AI</p>
        </div>
    </div>
    """


# ─────────────────────────────────────────────────
# SCHEDULED: WEEKLY DIGEST FOR ALL USERS
# ─────────────────────────────────────────────────

async def run_ai_weekly_digest():
    """Scheduled job: sends AI weekly digest to all active users on Monday mornings."""
    logger.info("Running AI weekly digest job...")
    try:
        users = await db.users.find(
            {"status": "Active"},
            {"_id": 0, "id": 1, "email": 1, "name": 1}
        ).to_list(1000)

        sent = 0
        for user in users:
            try:
                digest = await _generate_weekly_digest(user["id"])
                if not digest:
                    continue
                html = _build_digest_email_html(digest, user.get("name", "there"))
                await asyncio.to_thread(resend.Emails.send, {
                    "from": SENDER_EMAIL,
                    "to": user["email"],
                    "subject": f"Your Weekly AI Digest — {digest['week_label']}",
                    "html": html
                })
                sent += 1
            except Exception as e:
                logger.error(f"Digest for {user.get('email','?')}: {e}")

        logger.info(f"AI weekly digest sent to {sent}/{len(users)} users")
    except Exception as e:
        logger.error(f"AI weekly digest job failed: {e}")
