"""
Scheduled Data Health Digest
Sends a weekly email summary of data health stats to super admins.
Called by APScheduler every Monday at 9 AM UTC.
"""
from datetime import datetime, timezone, timedelta
from config import db, logger, SENDER_EMAIL
import asyncio
import resend


async def run_data_health_digest():
    """Weekly scheduled job: email data health summary to super admins."""
    logger.info("Running weekly data health digest...")

    try:
        # Gather stats (same logic as data_health.py stats endpoint)
        now = datetime.now(timezone.utc)
        thirty_days_ago = (now - timedelta(days=30)).isoformat()

        collections = [
            "users", "workspaces", "workspace_members", "meetings",
            "ai_conversations", "ai_messages", "form_templates",
            "form_submissions", "shifts", "time_clock",
            "time_off_requests", "shift_swap_requests", "push_subscriptions",
            "manager_notifications", "support_tickets", "messages",
        ]
        collection_stats = {}
        for col_name in collections:
            try:
                count = await db[col_name].count_documents({})
                collection_stats[col_name] = count
            except Exception:
                collection_stats[col_name] = 0

        total_documents = sum(collection_stats.values())
        total_users = collection_stats.get("users", 0)

        # User health
        never_logged_in = await db.users.count_documents({
            "$or": [{"last_login": {"$exists": False}}, {"last_login": None}]
        })
        inactive_users = await db.users.count_documents({
            "last_login": {"$exists": True, "$ne": None, "$lt": thirty_days_ago}
        })
        active_users = await db.users.count_documents({
            "last_login": {"$exists": True, "$ne": None, "$gte": thirty_days_ago}
        })

        # Orphaned members count
        all_members = await db.workspace_members.find(
            {}, {"_id": 0, "workspace_id": 1, "user_id": 1}
        ).to_list(10000)
        orphaned_members = 0
        if all_members:
            ws_ids = list({m["workspace_id"] for m in all_members if m.get("workspace_id")})
            user_ids = list({m["user_id"] for m in all_members if m.get("user_id")})
            existing_ws = set()
            if ws_ids:
                async for doc in db.workspaces.find({"id": {"$in": ws_ids}}, {"id": 1}):
                    existing_ws.add(doc["id"])
            existing_users = set()
            if user_ids:
                async for doc in db.users.find({"id": {"$in": user_ids}}, {"id": 1}):
                    existing_users.add(doc["id"])
            for m in all_members:
                ws_missing = m.get("workspace_id") and m["workspace_id"] not in existing_ws
                user_missing = m.get("user_id") and m["user_id"] not in existing_users
                if ws_missing or user_missing:
                    orphaned_members += 1

        # Stale conversations
        stale_conversations = await db.ai_conversations.count_documents({
            "updated_at": {"$lt": thirty_days_ago}
        })

        # Pending items
        pending_time_off = await db.time_off_requests.count_documents({"status": "pending"})
        pending_swaps = await db.shift_swap_requests.count_documents({"status": "pending"})

        # Find super admins to email
        admins_cursor = db.users.find(
            {"role": {"$in": ["Super_Admin", "super_admin"]}},
            {"_id": 0, "email": 1, "name": 1},
        )
        super_admins = [doc async for doc in admins_cursor]

        if not super_admins:
            logger.info("No super admins found for data health digest.")
            return {"sent": 0}

        # Build top-5 collections table rows
        sorted_cols = sorted(collection_stats.items(), key=lambda x: x[1], reverse=True)[:5]
        col_rows = "".join(
            f"<tr><td style='padding:6px 12px;border-bottom:1px solid #eee;text-transform:capitalize;'>{name.replace('_',' ')}</td><td style='padding:6px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600;'>{count:,}</td></tr>"
            for name, count in sorted_cols
        )

        html = f"""
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
            <div style="background:linear-gradient(135deg,#7C3AED,#6D28D9);padding:24px 32px;border-radius:12px 12px 0 0;">
                <h1 style="color:white;margin:0;font-size:22px;">Munal Data Health Digest</h1>
                <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">{now.strftime('%B %d, %Y')}</p>
            </div>
            <div style="padding:24px 32px;">
                <h3 style="color:#1a1a1a;margin:0 0 12px;">Overview</h3>
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                    <tr><td style="padding:6px 0;color:#666;">Total Documents</td><td style="text-align:right;font-weight:700;">{total_documents:,}</td></tr>
                    <tr><td style="padding:6px 0;color:#666;">Total Users</td><td style="text-align:right;font-weight:700;">{total_users:,}</td></tr>
                    <tr><td style="padding:6px 0;color:#666;">Active (30d)</td><td style="text-align:right;font-weight:700;color:#059669;">{active_users:,}</td></tr>
                    <tr><td style="padding:6px 0;color:#666;">Inactive (30d+)</td><td style="text-align:right;font-weight:700;color:#dc2626;">{inactive_users:,}</td></tr>
                    <tr><td style="padding:6px 0;color:#666;">Never Logged In</td><td style="text-align:right;font-weight:700;color:#d97706;">{never_logged_in:,}</td></tr>
                </table>

                <h3 style="color:#1a1a1a;margin:0 0 12px;">Issues Detected</h3>
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                    <tr><td style="padding:6px 0;color:#666;">Orphaned Members</td><td style="text-align:right;font-weight:700;color:{'#dc2626' if orphaned_members > 0 else '#059669'};">{orphaned_members}</td></tr>
                    <tr><td style="padding:6px 0;color:#666;">Stale Conversations (30d+)</td><td style="text-align:right;font-weight:700;">{stale_conversations}</td></tr>
                    <tr><td style="padding:6px 0;color:#666;">Pending Time-Off Requests</td><td style="text-align:right;font-weight:700;">{pending_time_off}</td></tr>
                    <tr><td style="padding:6px 0;color:#666;">Pending Shift Swaps</td><td style="text-align:right;font-weight:700;">{pending_swaps}</td></tr>
                </table>

                <h3 style="color:#1a1a1a;margin:0 0 12px;">Top Collections</h3>
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                    {col_rows}
                </table>

                <div style="text-align:center;margin-top:24px;">
                    <a href="https://munal.ai/admin/data-health" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#6D28D9);color:white;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;">View Full Dashboard</a>
                </div>
            </div>
            <div style="padding:16px 32px;border-top:1px solid #eee;text-align:center;">
                <p style="color:#aaa;font-size:12px;margin:0;">Munal AI &mdash; Automated Weekly Digest</p>
            </div>
        </div>
        """

        sent = 0
        for admin in super_admins:
            email = admin.get("email")
            if not email:
                continue
            try:
                params = {
                    "from": SENDER_EMAIL,
                    "to": [email],
                    "subject": f"Munal Data Health Digest - {now.strftime('%b %d, %Y')}",
                    "html": html,
                }
                await asyncio.to_thread(resend.Emails.send, params)
                sent += 1
            except Exception as e:
                logger.error(f"Failed to send data health digest to {email}: {e}")

        logger.info(f"Data health digest sent to {sent} super admin(s).")
        return {"sent": sent, "total_admins": len(super_admins)}

    except Exception as e:
        logger.error(f"Data health digest failed: {e}")
        return {"error": str(e)}
