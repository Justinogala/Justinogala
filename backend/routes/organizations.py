"""
Organization management routes - CRUD, members, stats.
"""
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
import uuid
import bcrypt

from config import db, logger

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


