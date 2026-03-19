"""
Organization management routes - CRUD, members, stats, invites.
"""
from fastapi import APIRouter, HTTPException, Query, Request
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel
import uuid
import bcrypt
import resend

from config import db, logger, SENDER_EMAIL

router = APIRouter(prefix="/organizations", tags=["Organizations"])


# ============== Models ==============

class OrgCreate(BaseModel):
    name: str
    domain: Optional[str] = None
    description: Optional[str] = None
    created_by: str

class OrgUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    description: Optional[str] = None

class OrgMemberAdd(BaseModel):
    email: str
    name: str
    password: str
    role: str = "member"
    org_role: str = "User"
    plan: str = "Free"

class OrgMemberUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    org_role: Optional[str] = None
    role: Optional[str] = None
    plan: Optional[str] = None
    status: Optional[str] = None

class OrgSignup(BaseModel):
    org_name: str
    domain: Optional[str] = None
    description: Optional[str] = None
    admin_name: str
    admin_email: str
    admin_password: str

class OrgInvite(BaseModel):
    email: str
    invited_by: str
    role: str = "member"

class OrgDirectCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "member"
    plan: str = "Free"


# ============== Organization CRUD ==============

@router.get("")
async def list_organizations():
    """List all organizations."""
    orgs = await db.organizations.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    # Enrich with member count
    for org in orgs:
        org["member_count"] = await db.users.count_documents({"organization_id": org["id"], "account_type": "business"})
    return {"organizations": orgs}


@router.post("")
async def create_organization(org: OrgCreate):
    """Create a new organization."""
    # Check for duplicate name
    existing = await db.organizations.find_one({"name": {"$regex": f"^{org.name}$", "$options": "i"}})
    if existing:
        raise HTTPException(status_code=400, detail="Organization with this name already exists")

    org_id = str(uuid.uuid4())
    org_doc = {
        "id": org_id,
        "name": org.name,
        "domain": org.domain,
        "description": org.description,
        "created_by": org.created_by,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.organizations.insert_one(org_doc)
    org_doc.pop("_id", None)
    logger.info(f"Organization '{org.name}' created by {org.created_by}")
    return {"success": True, "organization": org_doc}


# ============== Organization Self-Registration ==============

@router.post("/signup")
async def org_signup(data: OrgSignup):
    """Public endpoint: Register a new organization + admin user in one step."""
    if not data.org_name.strip():
        raise HTTPException(status_code=400, detail="Organization name is required")
    if not data.admin_email or not data.admin_password or not data.admin_name:
        raise HTTPException(status_code=400, detail="Admin name, email, and password are required")

    email = data.admin_email.lower()

    existing_org = await db.organizations.find_one({"name": {"$regex": f"^{data.org_name}$", "$options": "i"}})
    if existing_org:
        raise HTTPException(status_code=400, detail="Organization with this name already exists")

    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create organization
    org_id = str(uuid.uuid4())
    org_doc = {
        "id": org_id,
        "name": data.org_name.strip(),
        "domain": data.domain.strip() if data.domain else None,
        "description": data.description,
        "created_by": "self-signup",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.organizations.insert_one(org_doc)
    org_doc.pop("_id", None)

    # Create admin user under the org
    from models import DEFAULT_PERMISSIONS
    permissions = DEFAULT_PERMISSIONS.get("User", {})

    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": email,
        "password": bcrypt.hashpw(data.admin_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
        "name": data.admin_name.strip(),
        "role": "User",
        "status": "Active",
        "plan": "Business",
        "account_type": "business",
        "organization_id": org_id,
        "org_role": "admin",
        "permissions": permissions,
        "avatar": None,
        "email_verified": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    await db.users.insert_one(user_doc)
    user_doc.pop("password")
    user_doc.pop("_id", None)
    user_doc["created_at"] = user_doc["created_at"].isoformat()
    user_doc["updated_at"] = user_doc["updated_at"].isoformat()

    logger.info(f"Organization self-signup: '{data.org_name}' by {email}")
    return {"success": True, "organization": org_doc, "user": user_doc}


# ============== Invites ==============

@router.post("/invite/validate")
async def validate_invite(token: str = Query(...)):
    """Validate an invite token and return org info."""
    invite = await db.org_invites.find_one({"token": token}, {"_id": 0})
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid invite link")
    if invite.get("status") != "pending":
        raise HTTPException(status_code=400, detail="This invite has already been used or expired")
    if invite.get("expires_at") and invite["expires_at"] < datetime.now(timezone.utc).isoformat():
        raise HTTPException(status_code=400, detail="This invite has expired")

    org = await db.organizations.find_one({"id": invite["org_id"]}, {"_id": 0})
    if not org:
        raise HTTPException(status_code=404, detail="Organization no longer exists")

    return {
        "valid": True,
        "organization": {"id": org["id"], "name": org["name"], "domain": org.get("domain")},
        "email": invite.get("email"),
        "role": invite.get("role", "member"),
    }


@router.get("/{org_id}")
async def get_organization(org_id: str):
    """Get a single organization with stats."""
    org = await db.organizations.find_one({"id": org_id}, {"_id": 0})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    org["member_count"] = await db.users.count_documents({"organization_id": org_id, "account_type": "business"})
    return org


@router.put("/{org_id}")
async def update_organization(org_id: str, updates: OrgUpdate):
    """Update an organization."""
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.organizations.update_one({"id": org_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Organization not found")
    org = await db.organizations.find_one({"id": org_id}, {"_id": 0})
    return {"success": True, "organization": org}


@router.delete("/{org_id}")
async def delete_organization(org_id: str):
    """Delete an organization. Members become personal accounts."""
    result = await db.organizations.delete_one({"id": org_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Organization not found")
    # Downgrade members to personal
    await db.users.update_many(
        {"organization_id": org_id},
        {"$set": {"organization_id": None, "account_type": "personal"}}
    )
    logger.info(f"Organization {org_id} deleted, members downgraded to personal")
    return {"success": True, "message": "Organization deleted. Members converted to personal accounts."}


# ============== Member Management ==============

@router.get("/{org_id}/members")
async def get_org_members(org_id: str):
    """Get all members of an organization."""
    org = await db.organizations.find_one({"id": org_id}, {"_id": 0})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    members = await db.users.find(
        {"organization_id": org_id, "account_type": "business"},
        {"_id": 0, "password": 0}
    ).to_list(500)
    return {"members": members, "count": len(members), "organization": org}


@router.post("/{org_id}/members")
async def add_org_member(org_id: str, member: OrgMemberAdd):
    """Create a new user account under this organization (business account)."""
    org = await db.organizations.find_one({"id": org_id}, {"_id": 0})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Check if email already exists
    existing = await db.users.find_one({"email": member.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    from models import DEFAULT_PERMISSIONS
    permissions = DEFAULT_PERMISSIONS.get(member.org_role, DEFAULT_PERMISSIONS["User"])

    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": member.email.lower(),
        "password": bcrypt.hashpw(member.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
        "name": member.name,
        "role": member.org_role,
        "status": "Active",
        "plan": member.plan,
        "account_type": "business",
        "organization_id": org_id,
        "org_role": member.role,
        "permissions": permissions,
        "avatar": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    await db.users.insert_one(user_doc)
    user_doc.pop("password")
    user_doc.pop("_id", None)

    logger.info(f"Business user '{member.email}' created under org {org_id}")
    return {"success": True, "member": user_doc}


@router.post("/{org_id}/members/assign")
async def assign_existing_user(org_id: str, user_id: str = Query(...)):
    """Assign an existing personal user to this organization (upgrades to business)."""
    org = await db.organizations.find_one({"id": org_id}, {"_id": 0})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("organization_id") and user.get("account_type") == "business":
        raise HTTPException(status_code=400, detail="User is already assigned to an organization")

    await db.users.update_one(
        {"id": user_id},
        {"$set": {"organization_id": org_id, "account_type": "business", "updated_at": datetime.now(timezone.utc)}}
    )
    return {"success": True, "message": f"User assigned to organization '{org['name']}'"}


@router.delete("/{org_id}/members/{user_id}")
async def remove_org_member(org_id: str, user_id: str):
    """Remove a member from the organization (downgrades to personal)."""
    result = await db.users.update_one(
        {"id": user_id, "organization_id": org_id},
        {"$set": {"organization_id": None, "account_type": "personal", "org_role": None, "updated_at": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Member not found in this organization")
    return {"success": True, "message": "Member removed from organization and converted to personal account"}


# ============== Invite & Direct Create from Org Dashboard ==============

@router.post("/{org_id}/invite")
async def send_org_invite(org_id: str, invite: OrgInvite, request: Request):
    """Send an email invite to join the organization. Returns invite link."""
    org = await db.organizations.find_one({"id": org_id}, {"_id": 0})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    email = invite.email.lower().strip()

    # Check if user already exists in this org
    existing = await db.users.find_one({"email": email, "organization_id": org_id})
    if existing:
        raise HTTPException(status_code=400, detail="This user is already a member of the organization")

    # Check for pending invite
    pending = await db.org_invites.find_one({"email": email, "org_id": org_id, "status": "pending"})
    if pending:
        # Resend existing invite
        token = pending["token"]
    else:
        # Create new invite
        token = str(uuid.uuid4())
        invite_doc = {
            "id": str(uuid.uuid4()),
            "org_id": org_id,
            "email": email,
            "token": token,
            "role": invite.role,
            "invited_by": invite.invited_by,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        }
        await db.org_invites.insert_one(invite_doc)

    # Build invite link using the request origin (frontend URL)
    # Use the Referer or Origin header if available, otherwise fall back to base_url
    frontend_origin = request.headers.get("origin") or request.headers.get("referer", "").rstrip("/")
    if not frontend_origin:
        frontend_origin = str(request.base_url).rstrip("/")
    # Strip any path from referer
    if "/api/" in frontend_origin:
        frontend_origin = frontend_origin.split("/api/")[0]
    invite_link = f"{frontend_origin}/signup?invite={token}"

    # Send email via Resend
    inviter = await db.users.find_one({"id": invite.invited_by}, {"name": 1})
    inviter_name = inviter.get("name", "A team member") if inviter else "A team member"

    try:
        resend.Emails.send({
            "from": SENDER_EMAIL,
            "to": [email],
            "subject": f"You're invited to join {org['name']} on Munal AI",
            "html": f"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 24px; font-weight: 700; color: #1e293b; margin: 0;">Munal AI</h1>
              </div>
              <div style="background: #f8fafc; border-radius: 12px; padding: 28px; border: 1px solid #e2e8f0;">
                <h2 style="font-size: 18px; font-weight: 600; color: #1e293b; margin: 0 0 12px;">You've been invited!</h2>
                <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">
                  <strong>{inviter_name}</strong> has invited you to join <strong>{org['name']}</strong> on Munal AI.
                </p>
                <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 24px;">
                  Click the button below to create your account and join the team.
                </p>
                <div style="text-align: center;">
                  <a href="{invite_link}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                    Join {org['name']}
                  </a>
                </div>
                <p style="color: #94a3b8; font-size: 11px; margin-top: 20px; text-align: center;">
                  This invite expires in 7 days.
                </p>
              </div>
              <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 20px;">
                Munal AI &mdash; Your intelligent workspace
              </p>
            </div>
            """
        })
        email_sent = True
    except Exception as e:
        logger.error(f"Failed to send invite email to {email}: {e}")
        email_sent = False

    logger.info(f"Org invite: {email} → {org['name']} (email_sent={email_sent})")

    return {
        "success": True,
        "invite_link": invite_link,
        "email_sent": email_sent,
        "email": email,
        "token": token,
    }


@router.get("/{org_id}/invites")
async def list_org_invites(org_id: str):
    """List all pending invites for an organization."""
    invites = await db.org_invites.find(
        {"org_id": org_id, "status": "pending"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return {"invites": invites}


@router.post("/{org_id}/direct-create")
async def direct_create_member(org_id: str, data: OrgDirectCreate):
    """Create a member account directly from org dashboard (no invite needed)."""
    org = await db.organizations.find_one({"id": org_id}, {"_id": 0})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    email = data.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    from models import DEFAULT_PERMISSIONS
    permissions = DEFAULT_PERMISSIONS.get("User", {})

    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": email,
        "password": bcrypt.hashpw(data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
        "name": data.name.strip(),
        "role": "User",
        "status": "Active",
        "plan": data.plan,
        "account_type": "business",
        "organization_id": org_id,
        "org_role": data.role,
        "permissions": permissions,
        "avatar": None,
        "email_verified": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    await db.users.insert_one(user_doc)
    user_doc.pop("password")
    user_doc.pop("_id", None)

    logger.info(f"Direct member creation: {email} → org {org_id}")
    return {"success": True, "member": user_doc}


# ============== Stats ==============

@router.get("/{org_id}/stats")
async def get_org_stats(org_id: str):
    """Get organization statistics."""
    org = await db.organizations.find_one({"id": org_id}, {"_id": 0})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    member_count = await db.users.count_documents({"organization_id": org_id, "account_type": "business"})
    active_count = await db.users.count_documents({"organization_id": org_id, "account_type": "business", "status": "Active"})

    # Get member IDs for workspace/approval aggregation
    members = await db.users.find({"organization_id": org_id}, {"id": 1}).to_list(500)
    member_ids = [m["id"] for m in members]

    workspace_count = 0
    approval_count = 0
    if member_ids:
        workspace_count = await db.workspaces.count_documents({"owner_id": {"$in": member_ids}})
        approval_count = await db.approvals.count_documents({"sender_id": {"$in": member_ids}})

    return {
        "member_count": member_count,
        "active_members": active_count,
        "workspace_count": workspace_count,
        "approval_count": approval_count,
    }


# ============== Edit Member ==============

@router.put("/{org_id}/members/{user_id}")
async def update_org_member(org_id: str, user_id: str, updates: OrgMemberUpdate):
    """Update an org member's account info."""
    user = await db.users.find_one({"id": user_id, "organization_id": org_id})
    if not user:
        raise HTTPException(status_code=404, detail="Member not found in this organization")

    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # If email is changing, check for duplicates
    if "email" in update_data:
        update_data["email"] = update_data["email"].lower()
        existing = await db.users.find_one({"email": update_data["email"], "id": {"$ne": user_id}})
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use by another user")

    update_data["updated_at"] = datetime.now(timezone.utc)
    await db.users.update_one({"id": user_id}, {"$set": update_data})

    updated = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return {"success": True, "member": updated}




# ============== Organization Dashboard ==============

@router.get("/{org_id}/dashboard")
async def get_org_dashboard(org_id: str, user_id: str = Query(...)):
    """Get full dashboard data for an org admin."""
    org = await db.organizations.find_one({"id": org_id}, {"_id": 0})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Verify user is a business member of this org
    requester = await db.users.find_one({"id": user_id, "organization_id": org_id}, {"_id": 0, "password": 0})
    if not requester:
        raise HTTPException(status_code=403, detail="Not a member of this organization")

    # Members
    members = await db.users.find(
        {"organization_id": org_id, "account_type": "business"},
        {"_id": 0, "password": 0}
    ).to_list(500)

    member_ids = [m["id"] for m in members]
    active_count = sum(1 for m in members if m.get("status") == "Active")

    # Role distribution
    role_dist = {}
    for m in members:
        r = m.get("org_role", "member")
        role_dist[r] = role_dist.get(r, 0) + 1

    # Workspaces owned by org members
    workspaces = []
    if member_ids:
        workspaces = await db.workspaces.find(
            {"owner_id": {"$in": member_ids}},
            {"_id": 0, "id": 1, "name": 1, "color": 1, "icon": 1, "scope": 1, "owner_id": 1, "created_at": 1}
        ).to_list(100)

    ws_ids = [w["id"] for w in workspaces]

    # Approval stats for org members
    pending_approvals = 0
    completed_approvals = 0
    rejected_approvals = 0
    if member_ids:
        pending_approvals = await db.approvals.count_documents({"sender_id": {"$in": member_ids}, "status": "pending"})
        completed_approvals = await db.approvals.count_documents({"sender_id": {"$in": member_ids}, "status": "approved"})
        rejected_approvals = await db.approvals.count_documents({"sender_id": {"$in": member_ids}, "status": "rejected"})

    # Recent announcements across org workspaces
    recent_announcements = []
    if ws_ids:
        recent_announcements = await db.workspace_announcements.find(
            {"workspace_id": {"$in": ws_ids}},
            {"_id": 0}
        ).sort("created_at", -1).to_list(10)

    # Recent activity: approvals created/actioned by org members (last 14 days)
    now = datetime.now(timezone.utc)
    two_weeks_ago = (now - timedelta(days=14)).isoformat()
    recent_approvals = []
    if member_ids:
        recent_approvals = await db.approvals.find(
            {"sender_id": {"$in": member_ids}, "created_at": {"$gte": two_weeks_ago}},
            {"_id": 0, "id": 1, "title": 1, "status": 1, "sender_id": 1, "sender_name": 1, "created_at": 1}
        ).sort("created_at", -1).to_list(10)

    # Map member IDs to names for display
    member_map = {m["id"]: m["name"] for m in members}

    # Build activity feed
    activity = []
    for ann in recent_announcements:
        activity.append({
            "type": "announcement",
            "title": ann.get("title", "Announcement"),
            "workspace_id": ann.get("workspace_id"),
            "created_at": ann.get("created_at"),
            "pinned": ann.get("pinned", False),
        })
    for appr in recent_approvals:
        activity.append({
            "type": "approval",
            "title": appr.get("title", "Approval Request"),
            "status": appr.get("status"),
            "sender": member_map.get(appr.get("sender_id"), appr.get("sender_name", "Unknown")),
            "created_at": appr.get("created_at"),
        })

    # Sort by date descending
    activity.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    # Serialize members (convert datetime to iso)
    for m in members:
        if hasattr(m.get("created_at"), "isoformat"):
            m["created_at"] = m["created_at"].isoformat()
        if hasattr(m.get("updated_at"), "isoformat"):
            m["updated_at"] = m["updated_at"].isoformat()

    return {
        "organization": org,
        "stats": {
            "total_members": len(members),
            "active_members": active_count,
            "workspace_count": len(workspaces),
            "pending_approvals": pending_approvals,
            "completed_approvals": completed_approvals,
            "rejected_approvals": rejected_approvals,
            "total_approvals": pending_approvals + completed_approvals + rejected_approvals,
        },
        "role_distribution": role_dist,
        "members": members[:20],
        "workspaces": workspaces[:10],
        "activity": activity[:15],
    }
