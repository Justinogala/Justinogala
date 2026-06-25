"""
Event email notifications — host proposal confirmations and event reminders.
"""
import asyncio
import resend
from datetime import datetime, timezone, timedelta

from config import db, SENDER_EMAIL, logger


async def send_host_proposal_confirmation(email: str, name: str, event_title: str):
    """Send confirmation email to the host proposal submitter"""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff;">
        <div style="text-align: center; padding: 30px 0 20px;">
            <h1 style="color: #7c3aed; margin: 0; font-size: 24px;">Munal AI Academy & Events</h1>
        </div>
        <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-radius: 12px; padding: 32px; margin: 20px 0;">
            <h2 style="color: #1f2937; margin-top: 0;">Proposal Received!</h2>
            <p style="color: #4b5563; line-height: 1.6;">Hi {name},</p>
            <p style="color: #4b5563; line-height: 1.6;">Thank you for submitting your event proposal: <strong>{event_title}</strong></p>
            <p style="color: #4b5563; line-height: 1.6;">Our team will review your proposal and get back to you within <strong>48 hours</strong>.</p>
            <div style="background: #fff; border-left: 4px solid #7c3aed; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #6b7280; margin: 0; font-size: 14px;">What happens next:</p>
                <ul style="color: #4b5563; font-size: 14px; line-height: 1.8; padding-left: 16px;">
                    <li>Our events team reviews your proposal</li>
                    <li>We may reach out for additional details</li>
                    <li>Once approved, we'll help you set up and promote your event</li>
                </ul>
            </div>
        </div>
        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px;">&copy; 2026 Munal AI Academy & Events. All rights reserved.</p>
        </div>
    </div>"""

    try:
        result = await asyncio.to_thread(resend.Emails.send, {
            "from": f"Munal AI Events <{SENDER_EMAIL}>",
            "to": [email],
            "subject": f"Proposal Received: {event_title} | Munal AI Academy & Events",
            "html": html,
            "reply_to": "events@munal.ai"
        })
        logger.info(f"Host proposal confirmation sent to {email}")
        return result
    except Exception as e:
        logger.error(f"Failed to send host proposal email to {email}: {e}")


async def send_host_proposal_admin_notification(name: str, email: str, event_title: str, description: str, event_format: str, expected_attendees: str):
    """Notify admin about new host proposal"""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff;">
        <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #7c3aed; margin: 0; font-size: 24px;">New Event Proposal</h1>
        </div>
        <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Proposer</td><td style="padding: 8px 0; font-weight: bold;">{name} ({email})</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Event Title</td><td style="padding: 8px 0; font-weight: bold;">{event_title}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Format</td><td style="padding: 8px 0;">{event_format or 'Not specified'}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Expected Attendees</td><td style="padding: 8px 0;">{expected_attendees or 'Not specified'}</td></tr>
            </table>
            <div style="margin-top: 16px; padding: 12px; background: #fff; border-radius: 8px; border: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px;">Description:</p>
                <p style="color: #374151; font-size: 14px; margin: 0;">{description or 'No description provided.'}</p>
            </div>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">&copy; 2026 Munal AI Academy & Events</p>
    </div>"""

    try:
        result = await asyncio.to_thread(resend.Emails.send, {
            "from": f"Munal AI Events <{SENDER_EMAIL}>",
            "to": ["admin@munal.ai"],
            "subject": f"[New Proposal] {event_title} — from {name}",
            "html": html,
            "reply_to": email
        })
        logger.info(f"Admin notified of new host proposal: {event_title}")
        return result
    except Exception as e:
        logger.error(f"Failed to send admin notification: {e}")


async def send_event_reminder(email: str, name: str, event_title: str, event_date: str, location: str, event_id: str):
    """Send event reminder email (24h before event)"""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff;">
        <div style="text-align: center; padding: 30px 0 20px;">
            <h1 style="color: #7c3aed; margin: 0; font-size: 24px;">Munal AI Academy & Events</h1>
        </div>
        <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-radius: 12px; padding: 32px; margin: 20px 0;">
            <h2 style="color: #1f2937; margin-top: 0;">Your Event is Tomorrow!</h2>
            <p style="color: #4b5563; line-height: 1.6;">Hi {name},</p>
            <p style="color: #4b5563; line-height: 1.6;">This is a reminder that <strong>{event_title}</strong> is happening tomorrow.</p>
            <div style="background: #fff; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p style="margin: 4px 0; color: #4b5563;"><strong>Date:</strong> {event_date}</p>
                <p style="margin: 4px 0; color: #4b5563;"><strong>Location:</strong> {location}</p>
            </div>
            <p style="color: #4b5563; line-height: 1.6;">We look forward to seeing you there!</p>
        </div>
        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px;">&copy; 2026 Munal AI Academy & Events</p>
        </div>
    </div>"""

    try:
        result = await asyncio.to_thread(resend.Emails.send, {
            "from": f"Munal AI Events <{SENDER_EMAIL}>",
            "to": [email],
            "subject": f"Reminder: {event_title} is Tomorrow! | Munal AI",
            "html": html,
            "reply_to": "events@munal.ai"
        })
        logger.info(f"Event reminder sent to {email} for {event_title}")
        return result
    except Exception as e:
        logger.error(f"Failed to send reminder to {email}: {e}")


async def check_and_send_event_reminders():
    """Check for events happening in 24h and send reminders to accepted applicants"""
    now = datetime.now(timezone.utc)
    tomorrow_start = now + timedelta(hours=23)
    tomorrow_end = now + timedelta(hours=25)

    events = await db.events.find({
        "date": {"$gte": tomorrow_start.isoformat(), "$lte": tomorrow_end.isoformat()},
        "deleted": {"$ne": True},
        "status": {"$nin": ["cancelled"]}
    }, {"_id": 0}).to_list(50)

    reminders_sent = 0
    for event in events:
        # Check if reminders already sent
        reminder_key = f"reminder_{event['id']}_{now.strftime('%Y-%m-%d')}"
        existing = await db.event_reminders_log.find_one({"key": reminder_key})
        if existing:
            continue

        # Get accepted applicants
        applicants = await db.event_applications.find(
            {"event_id": event["id"], "status": {"$in": ["accepted", "submitted"]}},
            {"_id": 0, "email": 1, "first_name": 1}
        ).to_list(5000)

        for app in applicants:
            try:
                await send_event_reminder(
                    app["email"], app.get("first_name", "Attendee"),
                    event["title"], event.get("date", ""), event.get("location", ""),
                    event["id"]
                )
                reminders_sent += 1
            except Exception:
                pass

        # Log that reminders were sent
        await db.event_reminders_log.insert_one({"key": reminder_key, "event_id": event["id"], "sent_count": len(applicants), "sent_at": now.isoformat()})

    if reminders_sent > 0:
        logger.info(f"Sent {reminders_sent} event reminders for {len(events)} events")

    return reminders_sent
