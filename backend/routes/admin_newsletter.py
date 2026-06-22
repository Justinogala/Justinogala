"""
Admin Newsletter — Bulk email campaigns with contact management, templates, and AI image generation.
Supports up to 50,000 emails/day via Resend Pro.
"""
import os
import re
import io
import csv
import uuid
import json
import asyncio
import resend
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Request, UploadFile, File, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List
from config import db, logger
from routes.auth import get_current_user

router = APIRouter(prefix="/admin/newsletter", tags=["Admin Newsletter"])

resend.api_key = os.environ.get("RESEND_API_KEY", "")
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
BATCH_SIZE = 10  # emails per second (Resend rate limit)
DAILY_LIMIT = 50000  # Resend Pro tier


# ─── Models ───

class ContactCreate(BaseModel):
    email: str
    name: Optional[str] = ""
    segment: Optional[str] = "general"

class ContactBulk(BaseModel):
    contacts: List[ContactCreate]

class CampaignCreate(BaseModel):
    name: str = Field(..., min_length=1)
    subject: str = Field(..., min_length=1)
    body_html: str = Field(..., min_length=1)
    sender_name: Optional[str] = "Munal AI"
    reply_to: Optional[str] = None
    segment: Optional[str] = ""  # empty = all contacts

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body_html: Optional[str] = None
    sender_name: Optional[str] = None
    reply_to: Optional[str] = None
    segment: Optional[str] = None

class ImageGenRequest(BaseModel):
    prompt: str = Field(..., min_length=5)


# ─── Helpers ───

def _super_admin_check(user):
    role = (user.get("role") or "").lower().replace("_", " ")
    if role not in ("super admin", "admin"):
        raise HTTPException(403, "Admin access required")


# ─── Contact Endpoints ───

@router.get("/contacts")
async def list_contacts(
    segment: str = "", search: str = "", page: int = 1, limit: int = 50,
    user: dict = Depends(get_current_user)
):
    _super_admin_check(user)
    query = {"unsubscribed": {"$ne": True}}
    if segment:
        query["segment"] = segment
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}},
        ]

    total = await db.newsletter_contacts.count_documents(query)
    cursor = db.newsletter_contacts.find(query, {"_id": 0}).sort("created_at", -1).skip((page - 1) * limit).limit(limit)
    contacts = await cursor.to_list(limit)

    return {"contacts": contacts, "total": total, "page": page, "total_pages": max(1, -(-total // limit))}


@router.post("/contacts")
async def add_contact(req: ContactCreate, user: dict = Depends(get_current_user)):
    _super_admin_check(user)
    email = req.email.strip().lower()
    existing = await db.newsletter_contacts.find_one({"email": email})
    if existing:
        raise HTTPException(400, "Contact already exists")

    contact = {
        "id": str(uuid.uuid4()),
        "email": email,
        "name": req.name.strip() if req.name else "",
        "segment": req.segment or "general",
        "source": "manual",
        "unsubscribed": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.newsletter_contacts.insert_one(contact)
    contact.pop("_id", None)
    return contact


@router.post("/contacts/bulk")
async def add_contacts_bulk(req: ContactBulk, user: dict = Depends(get_current_user)):
    _super_admin_check(user)
    added = 0
    skipped = 0
    for c in req.contacts:
        email = c.email.strip().lower()
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            skipped += 1
            continue
        existing = await db.newsletter_contacts.find_one({"email": email})
        if existing:
            skipped += 1
            continue
        await db.newsletter_contacts.insert_one({
            "id": str(uuid.uuid4()),
            "email": email,
            "name": (c.name or "").strip(),
            "segment": c.segment or "general",
            "source": "bulk_import",
            "unsubscribed": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        added += 1
    return {"added": added, "skipped": skipped}


@router.post("/contacts/import-csv")
async def import_csv(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    _super_admin_check(user)
    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    reader = csv.DictReader(io.StringIO(text))

    added = 0
    skipped = 0
    for row in reader:
        email = (row.get("email") or row.get("Email") or "").strip().lower()
        name = (row.get("name") or row.get("Name") or row.get("full_name") or "").strip()
        segment = (row.get("segment") or row.get("Segment") or "general").strip()

        if not email or not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            skipped += 1
            continue

        existing = await db.newsletter_contacts.find_one({"email": email})
        if existing:
            skipped += 1
            continue

        await db.newsletter_contacts.insert_one({
            "id": str(uuid.uuid4()),
            "email": email,
            "name": name,
            "segment": segment,
            "source": "csv_import",
            "unsubscribed": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        added += 1

    return {"added": added, "skipped": skipped, "filename": file.filename}


@router.post("/contacts/import-users")
async def import_users(user: dict = Depends(get_current_user)):
    """Import all active Munal AI users as newsletter contacts."""
    _super_admin_check(user)
    users_cursor = db.users.find(
        {"deleted": {"$ne": True}, "status": "Active"},
        {"_id": 0, "email": 1, "name": 1}
    )
    users = await users_cursor.to_list(10000)

    added = 0
    skipped = 0
    for u in users:
        email = (u.get("email") or "").strip().lower()
        if not email:
            continue
        existing = await db.newsletter_contacts.find_one({"email": email})
        if existing:
            skipped += 1
            continue
        await db.newsletter_contacts.insert_one({
            "id": str(uuid.uuid4()),
            "email": email,
            "name": u.get("name", ""),
            "segment": "users",
            "source": "user_import",
            "unsubscribed": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        added += 1

    return {"added": added, "skipped": skipped}


@router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str, user: dict = Depends(get_current_user)):
    _super_admin_check(user)
    result = await db.newsletter_contacts.delete_one({"id": contact_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Contact not found")
    return {"success": True}


@router.get("/contacts/segments")
async def get_segments(user: dict = Depends(get_current_user)):
    _super_admin_check(user)
    pipeline = [
        {"$match": {"unsubscribed": {"$ne": True}}},
        {"$group": {"_id": "$segment", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    results = await db.newsletter_contacts.aggregate(pipeline).to_list(100)
    segments = [{"name": r["_id"] or "general", "count": r["count"]} for r in results]
    total = sum(s["count"] for s in segments)
    return {"segments": segments, "total": total}


@router.get("/contacts/stats")
async def contacts_stats(user: dict = Depends(get_current_user)):
    _super_admin_check(user)
    total = await db.newsletter_contacts.count_documents({"unsubscribed": {"$ne": True}})
    unsubscribed = await db.newsletter_contacts.count_documents({"unsubscribed": True})
    return {"total": total, "unsubscribed": unsubscribed}


# ─── Campaign Endpoints ───

@router.get("/campaigns")
async def list_campaigns(user: dict = Depends(get_current_user)):
    _super_admin_check(user)
    cursor = db.newsletter_campaigns.find({}, {"_id": 0}).sort("created_at", -1)
    campaigns = await cursor.to_list(100)
    return campaigns


@router.post("/campaigns")
async def create_campaign(req: CampaignCreate, user: dict = Depends(get_current_user)):
    _super_admin_check(user)
    campaign = {
        "id": str(uuid.uuid4()),
        "name": req.name,
        "subject": req.subject,
        "body_html": req.body_html,
        "sender_name": req.sender_name or "Munal AI",
        "reply_to": req.reply_to,
        "segment": req.segment or "",
        "status": "draft",
        "stats": {"total": 0, "sent": 0, "failed": 0},
        "created_by": user.get("email", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "sent_at": None,
    }
    await db.newsletter_campaigns.insert_one(campaign)
    campaign.pop("_id", None)
    return campaign


@router.get("/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str, user: dict = Depends(get_current_user)):
    _super_admin_check(user)
    campaign = await db.newsletter_campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(404, "Campaign not found")
    return campaign


@router.put("/campaigns/{campaign_id}")
async def update_campaign(campaign_id: str, req: CampaignUpdate, user: dict = Depends(get_current_user)):
    _super_admin_check(user)
    update = {}
    for field in ["name", "subject", "body_html", "sender_name", "reply_to", "segment"]:
        val = getattr(req, field, None)
        if val is not None:
            update[field] = val

    if not update:
        raise HTTPException(400, "No fields to update")

    result = await db.newsletter_campaigns.update_one({"id": campaign_id, "status": "draft"}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(404, "Campaign not found or already sent")
    return {"success": True}


@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str, user: dict = Depends(get_current_user)):
    _super_admin_check(user)
    result = await db.newsletter_campaigns.delete_one({"id": campaign_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Campaign not found")
    return {"success": True}


# ─── Send Campaign (Background Task) ───

async def _send_campaign_background(campaign_id: str):
    """Background task to send emails in batches."""
    campaign = await db.newsletter_campaigns.find_one({"id": campaign_id})
    if not campaign:
        return

    query = {"unsubscribed": {"$ne": True}}
    if campaign.get("segment"):
        query["segment"] = campaign["segment"]

    contacts = await db.newsletter_contacts.find(query, {"_id": 0, "email": 1, "name": 1}).to_list(1000000)

    total = len(contacts)
    await db.newsletter_campaigns.update_one(
        {"id": campaign_id},
        {"$set": {"status": "sending", "stats.total": total, "sent_at": datetime.now(timezone.utc).isoformat()}}
    )

    sent = 0
    failed = 0
    from_email = f"{campaign.get('sender_name', 'Munal AI')} <newsletter@munal.ai>"

    for i, contact in enumerate(contacts):
        try:
            # Personalize
            html = campaign["body_html"]
            html = html.replace("{{name}}", contact.get("name") or "there")
            html = html.replace("{{email}}", contact.get("email", ""))

            params = {
                "from": from_email,
                "to": [contact["email"]],
                "subject": campaign["subject"],
                "html": html,
            }
            if campaign.get("reply_to"):
                params["reply_to"] = campaign["reply_to"]

            await asyncio.to_thread(resend.Emails.send, params)
            sent += 1
        except Exception as e:
            logger.error(f"Newsletter send error to {contact.get('email')}: {e}")
            failed += 1

        # Update progress every 10 emails
        if (i + 1) % 10 == 0 or i == total - 1:
            await db.newsletter_campaigns.update_one(
                {"id": campaign_id},
                {"$set": {"stats.sent": sent, "stats.failed": failed}}
            )

        # Rate limiting: ~10 emails per second
        if (i + 1) % BATCH_SIZE == 0:
            await asyncio.sleep(1)

    final_status = "sent" if failed == 0 else "sent_with_errors"
    await db.newsletter_campaigns.update_one(
        {"id": campaign_id},
        {"$set": {"status": final_status, "stats.sent": sent, "stats.failed": failed}}
    )
    logger.info(f"Newsletter campaign '{campaign['name']}' complete: {sent} sent, {failed} failed out of {total}")


@router.post("/campaigns/{campaign_id}/send")
async def send_campaign(campaign_id: str, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    _super_admin_check(user)
    campaign = await db.newsletter_campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(404, "Campaign not found")
    if campaign["status"] not in ("draft", "sent_with_errors"):
        raise HTTPException(400, f"Campaign is already {campaign['status']}")

    # Count target contacts
    query = {"unsubscribed": {"$ne": True}}
    if campaign.get("segment"):
        query["segment"] = campaign["segment"]
    contact_count = await db.newsletter_contacts.count_documents(query)

    if contact_count == 0:
        raise HTTPException(400, "No contacts to send to")

    background_tasks.add_task(_send_campaign_background, campaign_id)

    return {"success": True, "message": f"Sending to {contact_count} contacts", "contact_count": contact_count}


# ─── AI Image Generation ───

@router.post("/generate-image")
async def generate_newsletter_image(req: ImageGenRequest, user: dict = Depends(get_current_user)):
    """Generate an image for the newsletter using AI."""
    _super_admin_check(user)

    from llm_client import get_client
    try:
        client = get_client(api_key=EMERGENT_KEY)
        response = await asyncio.to_thread(
            client.images.generate,
            model="gpt-image-1",
            prompt=req.prompt,
            n=1,
            size="1536x1024",
        )

        # Get the image data
        image_data = response.data[0]

        # If it's base64, save and serve
        if hasattr(image_data, 'b64_json') and image_data.b64_json:
            import base64
            img_bytes = base64.b64decode(image_data.b64_json)
            filename = f"newsletter_{uuid.uuid4().hex[:12]}.png"
            filepath = f"/app/public/newsletter-images/{filename}"

            os.makedirs("/app/public/newsletter-images", exist_ok=True)
            with open(filepath, "wb") as f:
                f.write(img_bytes)

            return {"success": True, "url": f"/newsletter-images/{filename}"}

        elif hasattr(image_data, 'url') and image_data.url:
            return {"success": True, "url": image_data.url}

        else:
            raise HTTPException(500, "No image data returned")

    except Exception as e:
        logger.error(f"Newsletter image generation error: {e}")
        raise HTTPException(500, f"Image generation failed: {str(e)[:200]}")


# ─── Email Templates ───

TEMPLATES = [
    {
        "id": "announcement",
        "name": "Product Announcement",
        "preview": "Announce new features and updates",
        "html": """<div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#ffffff;border-radius:12px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#7C3AED,#4F46E5);padding:40px 30px;text-align:center;">
    <h1 style="color:#ffffff;font-size:28px;margin:0 0 8px 0;">MUNAL AI</h1>
    <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">The AI Operating System for Modern Teams</p>
  </div>
  <div style="padding:30px;">
    <h2 style="color:#1a1a2e;font-size:22px;margin:0 0 16px 0;">What's New</h2>
    <p style="color:#555;font-size:15px;line-height:1.6;">Hi {{name}},</p>
    <p style="color:#555;font-size:15px;line-height:1.6;">We're excited to share the latest updates to Munal AI. Here's what's new:</p>
    <ul style="color:#555;font-size:15px;line-height:1.8;">
      <li>Feature update 1</li>
      <li>Feature update 2</li>
      <li>Feature update 3</li>
    </ul>
    <div style="text-align:center;margin:30px 0;">
      <a href="https://munal.ai" style="background:#7C3AED;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">Explore Now</a>
    </div>
  </div>
  <div style="background:#f8f9fa;padding:20px 30px;text-align:center;border-top:1px solid #eee;">
    <p style="color:#999;font-size:12px;margin:0;">Munal AI™ | Powered by Jiffix Inc.</p>
  </div>
</div>""",
    },
    {
        "id": "welcome",
        "name": "Welcome Email",
        "preview": "Welcome new users to the platform",
        "html": """<div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#ffffff;border-radius:12px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#7C3AED,#2563EB);padding:50px 30px;text-align:center;">
    <h1 style="color:#ffffff;font-size:32px;margin:0 0 12px 0;">Welcome to Munal AI</h1>
    <p style="color:rgba(255,255,255,0.9);font-size:16px;margin:0;">Your AI-powered workspace is ready</p>
  </div>
  <div style="padding:30px;">
    <p style="color:#555;font-size:15px;line-height:1.6;">Hi {{name}},</p>
    <p style="color:#555;font-size:15px;line-height:1.6;">Welcome to Munal AI — the AI Operating System for Modern Teams. Here's how to get started:</p>
    <div style="background:#f8f4ff;border-radius:10px;padding:20px;margin:20px 0;">
      <p style="color:#7C3AED;font-weight:600;margin:0 0 10px 0;">Quick Start Guide</p>
      <p style="color:#555;font-size:14px;line-height:1.6;margin:0;">1. Set up your workspace<br>2. Invite your team<br>3. Schedule your first AI meeting<br>4. Try the AI Chat assistant</p>
    </div>
    <div style="text-align:center;margin:30px 0;">
      <a href="https://munal.ai/dashboard" style="background:#7C3AED;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">Go to Dashboard</a>
    </div>
  </div>
  <div style="background:#f8f9fa;padding:20px 30px;text-align:center;border-top:1px solid #eee;">
    <p style="color:#999;font-size:12px;margin:0;">Munal AI™ | Powered by Jiffix Inc.</p>
  </div>
</div>""",
    },
    {
        "id": "newsletter",
        "name": "Monthly Newsletter",
        "preview": "Monthly digest with updates and tips",
        "html": """<div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#ffffff;border-radius:12px;overflow:hidden;">
  <div style="background:#1a1a2e;padding:30px;text-align:center;">
    <h1 style="color:#ffffff;font-size:24px;margin:0 0 4px 0;">MUNAL AI</h1>
    <p style="color:#7C3AED;font-size:13px;margin:0;letter-spacing:1px;">MONTHLY NEWSLETTER</p>
  </div>
  <div style="padding:30px;">
    <p style="color:#555;font-size:15px;line-height:1.6;">Hi {{name}},</p>
    <p style="color:#555;font-size:15px;line-height:1.6;">Here's your monthly update from Munal AI:</p>
    <div style="border-left:3px solid #7C3AED;padding-left:16px;margin:20px 0;">
      <h3 style="color:#1a1a2e;margin:0 0 8px 0;">Highlights</h3>
      <p style="color:#555;font-size:14px;line-height:1.6;margin:0;">Your key highlights and metrics go here.</p>
    </div>
    <div style="border-left:3px solid #2563EB;padding-left:16px;margin:20px 0;">
      <h3 style="color:#1a1a2e;margin:0 0 8px 0;">Tips & Tricks</h3>
      <p style="color:#555;font-size:14px;line-height:1.6;margin:0;">Productivity tips for your team.</p>
    </div>
    <div style="text-align:center;margin:30px 0;">
      <a href="https://munal.ai" style="background:#7C3AED;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">Visit Munal AI</a>
    </div>
  </div>
  <div style="background:#f8f9fa;padding:20px 30px;text-align:center;border-top:1px solid #eee;">
    <p style="color:#999;font-size:12px;margin:0;">Munal AI™ | Powered by Jiffix Inc.</p>
  </div>
</div>""",
    },
    {
        "id": "promo",
        "name": "Promotional Offer",
        "preview": "Special offers and promotions",
        "html": """<div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#ffffff;border-radius:12px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#EC4899,#7C3AED);padding:50px 30px;text-align:center;">
    <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:0 0 8px 0;letter-spacing:2px;">LIMITED TIME OFFER</p>
    <h1 style="color:#ffffff;font-size:36px;margin:0 0 12px 0;">50% Off Pro Plan</h1>
    <p style="color:rgba(255,255,255,0.85);font-size:16px;margin:0;">Upgrade your team's productivity today</p>
  </div>
  <div style="padding:30px;text-align:center;">
    <p style="color:#555;font-size:15px;line-height:1.6;">Hi {{name}},</p>
    <p style="color:#555;font-size:15px;line-height:1.6;">For a limited time, get 50% off the Munal AI Pro plan. Unlock advanced AI features, unlimited meetings, and priority support.</p>
    <div style="margin:30px 0;">
      <a href="https://munal.ai/pricing" style="background:linear-gradient(135deg,#EC4899,#7C3AED);color:#fff;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;">Claim Your Discount</a>
    </div>
    <p style="color:#999;font-size:13px;">Offer expires in 48 hours</p>
  </div>
  <div style="background:#f8f9fa;padding:20px 30px;text-align:center;border-top:1px solid #eee;">
    <p style="color:#999;font-size:12px;margin:0;">Munal AI™ | Powered by Jiffix Inc.</p>
  </div>
</div>""",
    },
]


@router.get("/templates")
async def get_templates(user: dict = Depends(get_current_user)):
    _super_admin_check(user)
    return {"templates": TEMPLATES}


# ─── Public Subscribe Endpoint (no auth) ───

class SubscribeRequest(BaseModel):
    email: str
    name: Optional[str] = ""

@router.post("/subscribe")
async def public_subscribe(req: SubscribeRequest):
    """Public endpoint for newsletter subscription."""
    email = req.email.strip().lower()
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        raise HTTPException(400, "Invalid email address")

    existing = await db.newsletter_contacts.find_one({"email": email})
    if existing:
        if existing.get("unsubscribed"):
            await db.newsletter_contacts.update_one({"email": email}, {"$set": {"unsubscribed": False}})
            return {"success": True, "message": "Re-subscribed successfully"}
        return {"success": True, "message": "Already subscribed"}

    await db.newsletter_contacts.insert_one({
        "id": str(uuid.uuid4()),
        "email": email,
        "name": (req.name or "").strip(),
        "segment": "subscribers",
        "source": "public_form",
        "unsubscribed": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"success": True, "message": "Subscribed successfully"}


@router.post("/unsubscribe")
async def public_unsubscribe(req: SubscribeRequest):
    """Public endpoint for newsletter unsubscription."""
    email = req.email.strip().lower()
    result = await db.newsletter_contacts.update_one(
        {"email": email},
        {"$set": {"unsubscribed": True}}
    )
    return {"success": True, "message": "Unsubscribed successfully"}
