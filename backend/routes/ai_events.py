"""
AI-powered event features - summary, bio, agenda, marketing copy generation.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import os

from config import logger
from routes.auth_helpers import get_current_user
from llm_client import chat_completion

router = APIRouter(prefix="/admin/events/ai", tags=["AI Events"])


class AISummaryRequest(BaseModel):
    title: str
    description: str = ""
    category: str = ""
    speakers: list = []
    agenda: list = []

class AIBioRequest(BaseModel):
    name: str
    title: str = ""
    company: str = ""
    topics: str = ""

class AIAgendaRequest(BaseModel):
    title: str
    description: str = ""
    duration: str = ""
    category: str = ""
    event_format: str = ""

class AIMarketingRequest(BaseModel):
    title: str
    description: str = ""
    date: str = ""
    location: str = ""
    price: str = ""
    platform: str = "twitter"


def _generate(system: str, user_prompt: str) -> str:
    """Call LLM and return text response."""
    try:
        api_key = os.environ.get("EMERGENT_LLM_KEY") or os.environ.get("EMERGENT_API_KEY", "")
        response = chat_completion(
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_prompt}
            ],
            model="gpt-5.2",
            api_key=api_key,
            max_tokens=1500,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"AI generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


@router.post("/summary")
async def generate_event_summary(req: AISummaryRequest, user=Depends(get_current_user)):
    """Generate AI event summary/recap"""
    speakers_text = ", ".join([f"{s.get('name','')} ({s.get('title','')})" for s in req.speakers]) if req.speakers else "N/A"
    agenda_text = "\n".join([f"- {item}" for item in req.agenda]) if req.agenda else "N/A"

    result = _generate(
        "You are a professional event copywriter for Munal AI Academy & Events. Write engaging, concise event summaries.",
        f"""Generate a professional event summary/recap for:

Title: {req.title}
Category: {req.category}
Description: {req.description}
Speakers: {speakers_text}
Agenda:
{agenda_text}

Write a 3-4 paragraph engaging summary that covers: what the event is about, key highlights, who should attend, and what attendees will gain. Use a professional but approachable tone. Include bullet points for key takeaways."""
    )
    return {"success": True, "content": result}


@router.post("/speaker-bio")
async def generate_speaker_bio(req: AIBioRequest, user=Depends(get_current_user)):
    """Generate AI speaker bio"""
    result = _generate(
        "You are a professional bio writer. Write polished, third-person speaker bios for tech events.",
        f"""Generate a professional speaker bio for:

Name: {req.name}
Title: {req.title}
Company: {req.company}
Speaking Topics: {req.topics}

Write a 2-3 paragraph professional bio in third person. Include their expertise, achievements, and what they'll bring to the event. Keep it under 150 words."""
    )
    return {"success": True, "content": result}


@router.post("/agenda")
async def generate_event_agenda(req: AIAgendaRequest, user=Depends(get_current_user)):
    """Generate AI event agenda"""
    result = _generate(
        "You are an expert event planner for Munal AI Academy & Events. Create detailed, well-structured agendas.",
        f"""Generate a detailed event agenda for:

Title: {req.title}
Description: {req.description}
Duration: {req.duration}
Category: {req.category}
Format: {req.event_format}

Create a time-blocked agenda with:
- Registration/Welcome
- Keynote/Opening sessions
- Breakout sessions/workshops
- Networking breaks
- Lunch break (if full day)
- Panel discussions
- Closing remarks
- Networking/After-party

Include realistic time slots and session descriptions. Format as a clear schedule."""
    )
    return {"success": True, "content": result}


@router.post("/marketing")
async def generate_marketing_copy(req: AIMarketingRequest, user=Depends(get_current_user)):
    """Generate AI marketing copy (social media, email)"""
    platform_instructions = {
        "twitter": "Write a compelling tweet (under 280 characters) with relevant hashtags and emojis.",
        "linkedin": "Write a professional LinkedIn post (3-4 paragraphs) with a strong hook, value proposition, and CTA.",
        "email": "Write a professional email invitation with subject line, body, and CTA button text. Use HTML-friendly formatting.",
        "instagram": "Write an engaging Instagram caption with emojis, hashtags, and a clear CTA.",
    }

    instruction = platform_instructions.get(req.platform, platform_instructions["twitter"])

    result = _generate(
        "You are a marketing copywriter for Munal AI Academy & Events. Write compelling, conversion-focused copy.",
        f"""Generate marketing copy for:

Event: {req.title}
Description: {req.description}
Date: {req.date}
Location: {req.location}
Price: {req.price}
Platform: {req.platform}

{instruction}

Make it exciting, professional, and include a clear call-to-action to register/apply."""
    )
    return {"success": True, "content": result, "platform": req.platform}
