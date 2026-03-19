"""
Workspace routes - workspace CRUD, members, announcements, stats, activity.
"""
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel
import uuid

from config import db, logger

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


# ============== Models ==============

class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    owner_id: str
    plan: str = "free"
    color: Optional[str] = None
    icon: Optional[str] = None
    scope: str = "team"  # "org" or "team"
    template_id: Optional[str] = None

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[dict] = None

class WorkspaceMemberAdd(BaseModel):
    workspace_id: str
    email: str
    role: str = "member"
    added_by: Optional[str] = None

class WorkspaceMemberUpdate(BaseModel):
    role: str


# ============== Workspace Templates ==============

WORKSPACE_TEMPLATES = [
    {
        "id": "project-team",
        "name": "Project Team",
        "description": "Agile project workspace with sprint tracking, task approvals, and team updates",
        "icon": "🎯",
        "color": "#6366f1",
        "scope": "team",
        "category": "Projects",
        "includes": ["Sprint approval templates", "Project update announcements", "Task review workflows"],
        "announcements": [
            {"title": "Welcome to the Project Hub", "content": "This workspace is set up for agile project management. Use Approvals for sprint sign-offs and task reviews. Post updates in News to keep the team aligned.", "pinned": True},
            {"title": "Getting Started Guide", "content": "1. Add team members via the Members tab\n2. Create your first sprint approval\n3. Post project milestones in News\n4. Use Chat for daily standups", "pinned": False},
        ],
        "approval_templates": [
            {"name": "Sprint Sign-off", "category": "Projects", "description": "Approve sprint completion and deliverables", "icon": "check-circle", "fields": [
                {"name": "sprint_number", "label": "Sprint Number", "type": "number", "required": True},
                {"name": "sprint_goal", "label": "Sprint Goal", "type": "text", "required": True},
                {"name": "completed_items", "label": "Completed Items", "type": "textarea", "required": True},
                {"name": "carry_over", "label": "Carry-over Items", "type": "textarea", "required": False},
                {"name": "demo_link", "label": "Demo Link", "type": "text", "required": False},
            ]},
            {"name": "Change Request", "category": "Projects", "description": "Request scope or timeline changes", "icon": "edit", "fields": [
                {"name": "change_type", "label": "Change Type", "type": "select", "required": True, "options": ["Scope", "Timeline", "Budget", "Resources"]},
                {"name": "description", "label": "Change Description", "type": "textarea", "required": True},
                {"name": "impact", "label": "Impact Assessment", "type": "textarea", "required": True},
                {"name": "priority", "label": "Priority", "type": "select", "required": True, "options": ["Low", "Medium", "High", "Critical"]},
            ]},
        ],
        "quick_links": [
            {"label": "Sprint Board", "path": "/approvals", "icon": "clipboard-list"},
            {"label": "Team Chat", "path": "/workspace/chat", "icon": "message-square"},
            {"label": "Project Files", "path": "/files", "icon": "folder"},
            {"label": "Meetings", "path": "/calendar", "icon": "calendar"},
        ],
    },
    {
        "id": "hr-department",
        "name": "HR Department",
        "description": "Human resources hub for leave management, onboarding, performance reviews, and policy updates",
        "icon": "👥",
        "color": "#ec4899",
        "scope": "org",
        "category": "HR",
        "includes": ["Leave & attendance templates", "Onboarding checklists", "Policy announcements"],
        "announcements": [
            {"title": "Welcome to the HR Hub", "content": "This workspace centralises all HR processes. Submit leave requests, track onboarding, and stay updated on company policies — all in one place.", "pinned": True},
            {"title": "Company Policies", "content": "All company policies are available in the Files section. Please review the updated remote work policy and code of conduct.", "pinned": True},
        ],
        "approval_templates": [
            {"name": "Leave Request", "category": "Attendance", "description": "Submit annual, sick, or personal leave requests", "icon": "calendar", "fields": [
                {"name": "leave_type", "label": "Leave Type", "type": "select", "required": True, "options": ["Annual Leave", "Sick Leave", "Personal Leave", "Maternity/Paternity", "Unpaid Leave"]},
                {"name": "start_date", "label": "Start Date", "type": "date", "required": True},
                {"name": "end_date", "label": "End Date", "type": "date", "required": True},
                {"name": "reason", "label": "Reason", "type": "textarea", "required": False},
                {"name": "handover_to", "label": "Handover To", "type": "text", "required": False},
            ]},
            {"name": "New Hire Onboarding", "category": "Administration", "description": "Onboarding checklist for new team members", "icon": "user-plus", "fields": [
                {"name": "employee_name", "label": "Employee Name", "type": "text", "required": True},
                {"name": "department", "label": "Department", "type": "text", "required": True},
                {"name": "start_date", "label": "Start Date", "type": "date", "required": True},
                {"name": "equipment_needed", "label": "Equipment Needed", "type": "textarea", "required": True},
                {"name": "access_required", "label": "System Access Required", "type": "textarea", "required": True},
            ]},
            {"name": "Performance Review", "category": "Administration", "description": "Quarterly or annual performance review", "icon": "trending-up", "fields": [
                {"name": "employee_name", "label": "Employee Name", "type": "text", "required": True},
                {"name": "review_period", "label": "Review Period", "type": "text", "required": True},
                {"name": "achievements", "label": "Key Achievements", "type": "textarea", "required": True},
                {"name": "areas_improvement", "label": "Areas for Improvement", "type": "textarea", "required": False},
                {"name": "rating", "label": "Overall Rating", "type": "select", "required": True, "options": ["Exceeds Expectations", "Meets Expectations", "Needs Improvement", "Below Expectations"]},
            ]},
        ],
        "quick_links": [
            {"label": "Leave Requests", "path": "/approvals", "icon": "calendar"},
            {"label": "Team Directory", "path": "/workspace/chat", "icon": "users"},
            {"label": "Policy Documents", "path": "/files", "icon": "file-text"},
            {"label": "HR Calendar", "path": "/calendar", "icon": "calendar"},
        ],
    },
    {
        "id": "finance",
        "name": "Finance",
        "description": "Financial operations hub for expense reports, budget approvals, invoice processing, and fiscal planning",
        "icon": "💰",
        "color": "#22c55e",
        "scope": "team",
        "category": "Finance",
        "includes": ["Expense & budget templates", "Invoice processing workflows", "Quarter-end reminders"],
        "announcements": [
            {"title": "Finance Hub - Getting Started", "content": "Welcome to the Finance workspace. Use this hub to submit expense reports, process invoices, and manage budget approvals. All financial documents are stored in Files.", "pinned": True},
            {"title": "Expense Policy Reminder", "content": "All expenses over $500 require manager approval. Receipts must be attached to every expense report. Submit reports within 30 days of purchase.", "pinned": False},
        ],
        "approval_templates": [
            {"name": "Expense Report", "category": "Finance", "description": "Submit business expense reimbursement", "icon": "receipt", "fields": [
                {"name": "expense_date", "label": "Expense Date", "type": "date", "required": True},
                {"name": "amount", "label": "Amount ($)", "type": "number", "required": True},
                {"name": "category", "label": "Category", "type": "select", "required": True, "options": ["Travel", "Meals", "Software", "Equipment", "Office Supplies", "Training", "Other"]},
                {"name": "description", "label": "Description", "type": "textarea", "required": True},
                {"name": "receipt_attached", "label": "Receipt Attached?", "type": "select", "required": True, "options": ["Yes", "No - will attach later"]},
            ]},
            {"name": "Budget Request", "category": "Finance", "description": "Request budget allocation or increase", "icon": "dollar-sign", "fields": [
                {"name": "department", "label": "Department", "type": "text", "required": True},
                {"name": "amount_requested", "label": "Amount Requested ($)", "type": "number", "required": True},
                {"name": "purpose", "label": "Purpose", "type": "textarea", "required": True},
                {"name": "timeline", "label": "Timeline", "type": "text", "required": True},
                {"name": "roi_estimate", "label": "Expected ROI", "type": "textarea", "required": False},
            ]},
            {"name": "Invoice Approval", "category": "Finance", "description": "Approve vendor invoices for payment", "icon": "file-text", "fields": [
                {"name": "vendor_name", "label": "Vendor Name", "type": "text", "required": True},
                {"name": "invoice_number", "label": "Invoice Number", "type": "text", "required": True},
                {"name": "amount", "label": "Invoice Amount ($)", "type": "number", "required": True},
                {"name": "due_date", "label": "Due Date", "type": "date", "required": True},
                {"name": "cost_center", "label": "Cost Center", "type": "text", "required": True},
            ]},
        ],
        "quick_links": [
            {"label": "Expense Reports", "path": "/approvals", "icon": "receipt"},
            {"label": "Invoices", "path": "/approvals", "icon": "file-text"},
            {"label": "Financial Docs", "path": "/files", "icon": "folder"},
            {"label": "Budget Calendar", "path": "/calendar", "icon": "calendar"},
        ],
    },
    {
        "id": "engineering",
        "name": "Engineering",
        "description": "Software engineering hub for code reviews, deployment approvals, incident tracking, and technical discussions",
        "icon": "⚙️",
        "color": "#3b82f6",
        "scope": "team",
        "category": "Engineering",
        "includes": ["Deployment & code review templates", "Incident tracking workflows", "Tech announcements"],
        "announcements": [
            {"title": "Engineering Hub", "content": "This workspace streamlines engineering workflows. Submit deployment requests, track incidents, and share technical updates. Use the Approvals module for code review sign-offs.", "pinned": True},
            {"title": "Deployment Guidelines", "content": "All production deployments require approval from a senior engineer. Hotfixes follow the expedited approval path. Always update the changelog.", "pinned": False},
        ],
        "approval_templates": [
            {"name": "Deployment Request", "category": "Projects", "description": "Request production deployment approval", "icon": "rocket", "fields": [
                {"name": "service_name", "label": "Service/App Name", "type": "text", "required": True},
                {"name": "version", "label": "Version", "type": "text", "required": True},
                {"name": "changes", "label": "Changes Summary", "type": "textarea", "required": True},
                {"name": "rollback_plan", "label": "Rollback Plan", "type": "textarea", "required": True},
                {"name": "deployment_type", "label": "Type", "type": "select", "required": True, "options": ["Regular", "Hotfix", "Feature Flag", "Database Migration"]},
            ]},
            {"name": "Incident Report", "category": "Activity", "description": "Report and track production incidents", "icon": "alert-triangle", "fields": [
                {"name": "severity", "label": "Severity", "type": "select", "required": True, "options": ["P0 - Critical", "P1 - High", "P2 - Medium", "P3 - Low"]},
                {"name": "affected_service", "label": "Affected Service", "type": "text", "required": True},
                {"name": "description", "label": "Incident Description", "type": "textarea", "required": True},
                {"name": "root_cause", "label": "Root Cause (if known)", "type": "textarea", "required": False},
                {"name": "mitigation", "label": "Mitigation Steps", "type": "textarea", "required": True},
            ]},
        ],
        "quick_links": [
            {"label": "Deployments", "path": "/approvals", "icon": "rocket"},
            {"label": "Team Chat", "path": "/workspace/chat", "icon": "message-square"},
            {"label": "Documentation", "path": "/files", "icon": "book"},
            {"label": "Sprint Calendar", "path": "/calendar", "icon": "calendar"},
        ],
    },
    {
        "id": "marketing",
        "name": "Marketing",
        "description": "Marketing operations hub for campaign approvals, content reviews, brand guidelines, and launch coordination",
        "icon": "📣",
        "color": "#f97316",
        "scope": "team",
        "category": "Marketing",
        "includes": ["Campaign & content approval templates", "Brand guidelines", "Launch coordination"],
        "announcements": [
            {"title": "Marketing Hub", "content": "Coordinate all marketing activities from this hub. Submit campaign proposals, get content approved, and track launches. Brand assets are in the Files section.", "pinned": True},
            {"title": "Brand Guidelines", "content": "All external content must follow brand guidelines. Use approved colors, fonts, and messaging. Check the Files section for the latest brand kit.", "pinned": False},
        ],
        "approval_templates": [
            {"name": "Campaign Proposal", "category": "Projects", "description": "Submit a new marketing campaign for approval", "icon": "megaphone", "fields": [
                {"name": "campaign_name", "label": "Campaign Name", "type": "text", "required": True},
                {"name": "objective", "label": "Campaign Objective", "type": "textarea", "required": True},
                {"name": "target_audience", "label": "Target Audience", "type": "text", "required": True},
                {"name": "budget", "label": "Budget ($)", "type": "number", "required": True},
                {"name": "channels", "label": "Channels", "type": "select", "required": True, "options": ["Social Media", "Email", "PPC", "Content", "Events", "Multi-channel"]},
                {"name": "timeline", "label": "Timeline", "type": "text", "required": True},
            ]},
            {"name": "Content Review", "category": "Activity", "description": "Submit content for editorial review", "icon": "file-text", "fields": [
                {"name": "content_type", "label": "Content Type", "type": "select", "required": True, "options": ["Blog Post", "Social Media", "Email Newsletter", "Press Release", "Case Study", "Video Script"]},
                {"name": "title", "label": "Content Title", "type": "text", "required": True},
                {"name": "summary", "label": "Summary", "type": "textarea", "required": True},
                {"name": "publish_date", "label": "Target Publish Date", "type": "date", "required": True},
            ]},
        ],
        "quick_links": [
            {"label": "Campaigns", "path": "/approvals", "icon": "megaphone"},
            {"label": "Content Review", "path": "/approvals", "icon": "file-text"},
            {"label": "Brand Assets", "path": "/files", "icon": "palette"},
            {"label": "Launch Calendar", "path": "/calendar", "icon": "calendar"},
        ],
    },
    {
        "id": "general",
        "name": "General",
        "description": "A clean workspace to get started. Customise it to fit your team's needs.",
        "icon": "🚀",
        "color": "#6366f1",
        "scope": "team",
        "category": "General",
        "includes": ["Getting started guide", "Basic workspace setup"],
        "announcements": [
            {"title": "Welcome!", "content": "Your workspace is ready. Start by adding team members, posting announcements, and exploring the quick links below.", "pinned": True},
        ],
        "approval_templates": [],
        "quick_links": [
            {"label": "Team Chat", "path": "/workspace/chat", "icon": "message-square"},
            {"label": "Files", "path": "/files", "icon": "folder"},
            {"label": "Approvals", "path": "/approvals", "icon": "clipboard-list"},
            {"label": "Calendar", "path": "/calendar", "icon": "calendar"},
        ],
    },
]

WORKSPACE_TEMPLATES_MAP = {t["id"]: t for t in WORKSPACE_TEMPLATES}


async def seed_workspace_from_template(workspace_id: str, template_id: str, owner_id: str, owner_name: str):
    """Seed a workspace with template data: announcements, approval templates, quick links."""
    template = WORKSPACE_TEMPLATES_MAP.get(template_id)
    if not template:
        return

    now = datetime.now(timezone.utc).isoformat()

    # Seed announcements
    for ann in template.get("announcements", []):
        await db.workspace_announcements.insert_one({
            "id": str(uuid.uuid4()),
            "workspace_id": workspace_id,
            "title": ann["title"],
            "content": ann["content"],
            "pinned": ann.get("pinned", False),
            "author_id": owner_id,
            "author_name": owner_name,
            "created_at": now,
        })

    # Seed approval templates
    for tpl in template.get("approval_templates", []):
        await db.approval_templates.insert_one({
            "id": f"tpl-ws-{str(uuid.uuid4())[:8]}",
            "name": tpl["name"],
            "category": tpl["category"],
            "description": tpl["description"],
            "icon": tpl.get("icon", "file-text"),
            "fields": tpl["fields"],
            "default_workflow": "single",
            "scope": "team",
            "team_id": workspace_id,
            "is_custom": True,
            "created_at": now,
        })

    # Store quick links in workspace settings
    quick_links = template.get("quick_links", [])
    if quick_links:
        await db.workspaces.update_one(
            {"id": workspace_id},
            {"$set": {"settings.quick_links": quick_links, "settings.template_id": template_id}}
        )


# ============== Routes ==============

@router.get("/templates")
async def get_workspace_templates():
    """Get available workspace blueprint templates."""
    templates = [
        {k: v for k, v in t.items() if k not in ("announcements", "approval_templates")}
        for t in WORKSPACE_TEMPLATES
    ]
    return {"templates": templates}


@router.get("/templates/{template_id}")
async def get_workspace_template(template_id: str):
    """Get a specific workspace template with full details."""
    template = WORKSPACE_TEMPLATES_MAP.get(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"template": template}


@router.get("")
async def get_workspaces(user_id: str = None):
    """Get all workspaces for a user"""
    try:
        if user_id:
            owned = await db.workspaces.find({"owner_id": user_id}, {"_id": 0}).to_list(100)
            
            memberships = await db.workspace_members.find({"user_id": user_id}, {"workspace_id": 1}).to_list(100)
            member_workspace_ids = [m["workspace_id"] for m in memberships]
            
            member_workspaces = await db.workspaces.find(
                {"id": {"$in": member_workspace_ids}, "owner_id": {"$ne": user_id}},
                {"_id": 0}
            ).to_list(100)
            
            all_workspaces = owned + member_workspaces
        else:
            all_workspaces = await db.workspaces.find({}, {"_id": 0}).to_list(100)
        
        return {"workspaces": all_workspaces}
    except Exception as e:
        logger.error(f"Error fetching workspaces: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_workspace(workspace: WorkspaceCreate):
    """Create a new workspace"""
    try:
        # Check entitlements
        from routes.entitlements import check_entitlement, record_usage
        check = await check_entitlement(workspace.owner_id, "workspaces", 1)
        if not check.allowed:
            raise HTTPException(
                status_code=403,
                detail={
                    "code": "WORKSPACE_LIMIT_REACHED",
                    "message": check.message,
                    "upgrade_url": "/pricing"
                }
            )
        
        workspace_id = str(uuid.uuid4())
        
        workspace_doc = {
            "id": workspace_id,
            "name": workspace.name,
            "description": workspace.description,
            "plan": workspace.plan,
            "owner_id": workspace.owner_id,
            "color": workspace.color or "#6366f1",
            "icon": workspace.icon or None,
            "scope": workspace.scope or "team",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "icon_url": None,
            "settings": {"allow_member_invites": True, "public": workspace.scope == "org"}
        }
        
        await db.workspaces.insert_one(workspace_doc)
        
        # Add owner as member
        owner_member = {
            "id": str(uuid.uuid4()),
            "workspace_id": workspace_id,
            "user_id": workspace.owner_id,
            "role": "owner",
            "status": "active",
            "joined_at": datetime.now(timezone.utc).isoformat()
        }
        await db.workspace_members.insert_one(owner_member)
        
        # Seed from template if provided
        if workspace.template_id and workspace.template_id in WORKSPACE_TEMPLATES_MAP:
            tpl = WORKSPACE_TEMPLATES_MAP[workspace.template_id]
            # Apply template defaults if not overridden
            if not workspace.color or workspace.color == "#6366f1":
                workspace_doc["color"] = tpl["color"]
                await db.workspaces.update_one({"id": workspace_id}, {"$set": {"color": tpl["color"]}})
            # Get owner name
            owner = await db.users.find_one({"id": workspace.owner_id}, {"_id": 0, "name": 1, "email": 1})
            owner_name = owner.get("name", owner.get("email", "Admin")) if owner else "Admin"
            await seed_workspace_from_template(workspace_id, workspace.template_id, workspace.owner_id, owner_name)

        if "_id" in workspace_doc:
            del workspace_doc["_id"]
        
        logger.info(f"Workspace {workspace_id} created by {workspace.owner_id}")
        return {"success": True, "workspace": workspace_doc}
    except Exception as e:
        logger.error(f"Error creating workspace: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ Dashboard Summary ============

@router.get("/dashboard/summary")
async def get_dashboard_summary(user_id: str = Query(...)):
    """Get a compact summary of all workspaces for a user with pending action counts."""
    try:
        # Get all workspace IDs for the user (owned + member)
        owned = await db.workspaces.find({"owner_id": user_id}, {"_id": 0, "id": 1, "name": 1, "color": 1, "icon": 1, "scope": 1, "settings": 1}).to_list(50)
        owned_ids = {w["id"] for w in owned}

        memberships = await db.workspace_members.find({"user_id": user_id}, {"workspace_id": 1}).to_list(100)
        member_ws_ids = [m["workspace_id"] for m in memberships if m["workspace_id"] not in owned_ids]

        member_workspaces = []
        if member_ws_ids:
            member_workspaces = await db.workspaces.find(
                {"id": {"$in": member_ws_ids}},
                {"_id": 0, "id": 1, "name": 1, "color": 1, "icon": 1, "scope": 1, "settings": 1}
            ).to_list(50)

        all_workspaces = owned + member_workspaces

        if not all_workspaces:
            return {"workspaces": [], "total_pending_approvals": 0, "total_announcements": 0}

        ws_ids = [w["id"] for w in all_workspaces]

        # Batch: member counts per workspace
        member_counts_cursor = db.workspace_members.aggregate([
            {"$match": {"workspace_id": {"$in": ws_ids}}},
            {"$group": {"_id": "$workspace_id", "count": {"$sum": 1}}}
        ])
        member_counts = {doc["_id"]: doc["count"] async for doc in member_counts_cursor}

        # Batch: announcement counts per workspace
        ann_counts_cursor = db.workspace_announcements.aggregate([
            {"$match": {"workspace_id": {"$in": ws_ids}}},
            {"$group": {"_id": "$workspace_id", "count": {"$sum": 1}}}
        ])
        ann_counts = {doc["_id"]: doc["count"] async for doc in ann_counts_cursor}

        # Pending approvals where user is an approver
        pending_approvals = await db.approvals.find(
            {"steps.approver_id": user_id, "status": "pending"},
            {"_id": 0, "sender_id": 1, "steps": 1}
        ).to_list(200)

        # Map approvals to workspaces via sender membership
        all_member_docs = await db.workspace_members.find(
            {"workspace_id": {"$in": ws_ids}},
            {"_id": 0, "workspace_id": 1, "user_id": 1}
        ).to_list(500)
        user_to_workspaces = {}
        for md in all_member_docs:
            user_to_workspaces.setdefault(md["user_id"], set()).add(md["workspace_id"])

        pending_per_ws = {}
        for appr in pending_approvals:
            sender = appr.get("sender_id", "")
            ws_set = user_to_workspaces.get(sender, set())
            for wid in ws_set:
                if wid in ws_ids:
                    pending_per_ws[wid] = pending_per_ws.get(wid, 0) + 1

        # Recent activity (last 7 days) per workspace
        now = datetime.now(timezone.utc)
        week_ago = (now - timedelta(days=7)).isoformat()

        recent_ann_cursor = db.workspace_announcements.aggregate([
            {"$match": {"workspace_id": {"$in": ws_ids}, "created_at": {"$gte": week_ago}}},
            {"$group": {"_id": "$workspace_id", "count": {"$sum": 1}}}
        ])
        recent_ann = {doc["_id"]: doc["count"] async for doc in recent_ann_cursor}

        # Build summary
        total_pending = 0
        total_ann = 0
        summaries = []
        for w in all_workspaces:
            wid = w["id"]
            pending = pending_per_ws.get(wid, 0)
            anns = ann_counts.get(wid, 0)
            recent = recent_ann.get(wid, 0)
            members = member_counts.get(wid, 0)
            total_pending += pending
            total_ann += anns

            template_id = None
            if w.get("settings") and isinstance(w["settings"], dict):
                template_id = w["settings"].get("template_id")

            summaries.append({
                "id": wid,
                "name": w.get("name", "Workspace"),
                "color": w.get("color", "#6366f1"),
                "icon": w.get("icon"),
                "scope": w.get("scope", "team"),
                "template_id": template_id,
                "member_count": members,
                "announcement_count": anns,
                "recent_announcements": recent,
                "pending_approvals": pending,
            })

        # Sort: workspaces with pending actions first, then by name
        summaries.sort(key=lambda x: (-x["pending_approvals"], -x["recent_announcements"], x["name"]))

        return {
            "workspaces": summaries,
            "total_pending_approvals": total_pending,
            "total_announcements": total_ann,
        }
    except Exception as e:
        logger.error(f"Error fetching dashboard summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{workspace_id}")
async def get_workspace(workspace_id: str):
    """Get a single workspace"""
    try:
        workspace = await db.workspaces.find_one({"id": workspace_id}, {"_id": 0})
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        return workspace
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching workspace: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{workspace_id}")
async def update_workspace(workspace_id: str, updates: WorkspaceUpdate):
    """Update a workspace"""
    try:
        update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
        if updates.name is not None:
            update_data["name"] = updates.name
        if updates.description is not None:
            update_data["description"] = updates.description
        if updates.settings is not None:
            update_data["settings"] = updates.settings
        
        result = await db.workspaces.update_one({"id": workspace_id}, {"$set": update_data})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        workspace = await db.workspaces.find_one({"id": workspace_id}, {"_id": 0})
        return {"success": True, "workspace": workspace}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating workspace: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{workspace_id}")
async def delete_workspace(workspace_id: str):
    """Delete a workspace and all its members"""
    try:
        result = await db.workspaces.delete_one({"id": workspace_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        await db.workspace_members.delete_many({"workspace_id": workspace_id})
        
        return {"success": True, "message": "Workspace deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting workspace: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{workspace_id}/members")
async def get_workspace_members(workspace_id: str):
    """Get all members of a workspace"""
    try:
        members = await db.workspace_members.find({"workspace_id": workspace_id}, {"_id": 0}).to_list(100)
        
        # Enrich with user data (batch fetch)
        user_ids = [m["user_id"] for m in members]
        users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0, "password": 0}).to_list(len(user_ids))
        user_map = {u["id"]: u for u in users}
        for member in members:
            user = user_map.get(member["user_id"])
            if user:
                member["user"] = user
        
        return {"members": members, "count": len(members)}
    except Exception as e:
        logger.error(f"Error fetching members: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{workspace_id}/members")
async def add_workspace_member(workspace_id: str, member: WorkspaceMemberAdd):
    """Add a member to workspace"""
    try:
        # Find user by email
        user = await db.users.find_one({"email": member.email.lower()})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if already a member
        existing = await db.workspace_members.find_one({
            "workspace_id": workspace_id,
            "user_id": user["id"]
        })
        if existing:
            raise HTTPException(status_code=400, detail="User is already a member")
        
        member_doc = {
            "id": str(uuid.uuid4()),
            "workspace_id": workspace_id,
            "user_id": user["id"],
            "role": member.role,
            "status": "active",
            "added_by": member.added_by,
            "joined_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.workspace_members.insert_one(member_doc)
        
        if "_id" in member_doc:
            del member_doc["_id"]
        
        member_doc["user"] = {k: v for k, v in user.items() if k != "password" and k != "_id"}
        
        return {"success": True, "member": member_doc}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding member: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{workspace_id}/members/{user_id}")
async def update_workspace_member(workspace_id: str, user_id: str, update: WorkspaceMemberUpdate):
    """Update a member's role"""
    try:
        result = await db.workspace_members.update_one(
            {"workspace_id": workspace_id, "user_id": user_id},
            {"$set": {"role": update.role}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Member not found")
        
        return {"success": True, "message": "Member updated"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating member: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{workspace_id}/members/{user_id}")
async def remove_workspace_member(workspace_id: str, user_id: str):
    """Remove a member from workspace"""
    try:
        result = await db.workspace_members.delete_one({
            "workspace_id": workspace_id,
            "user_id": user_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Member not found")
        
        return {"success": True, "message": "Member removed"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing member: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ Announcements ============

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    pinned: bool = False
    author_id: str
    author_name: str = ""


@router.get("/{workspace_id}/announcements")
async def get_announcements(workspace_id: str):
    """Get workspace announcements, pinned first."""
    announcements = await db.workspace_announcements.find(
        {"workspace_id": workspace_id}, {"_id": 0}
    ).sort([("pinned", -1), ("created_at", -1)]).to_list(50)
    return {"announcements": announcements}


@router.post("/{workspace_id}/announcements")
async def create_announcement(workspace_id: str, req: AnnouncementCreate):
    """Create a workspace announcement."""
    doc = {
        "id": str(uuid.uuid4()),
        "workspace_id": workspace_id,
        "title": req.title,
        "content": req.content,
        "pinned": req.pinned,
        "author_id": req.author_id,
        "author_name": req.author_name,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.workspace_announcements.insert_one(doc)
    return {"success": True, "announcement": {k: v for k, v in doc.items() if k != "_id"}}


@router.put("/{workspace_id}/announcements/{announcement_id}")
async def update_announcement(workspace_id: str, announcement_id: str, req: AnnouncementCreate):
    """Update an announcement."""
    update = {
        "title": req.title, "content": req.content, "pinned": req.pinned,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.workspace_announcements.update_one(
        {"id": announcement_id, "workspace_id": workspace_id}, {"$set": update}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"success": True}


@router.delete("/{workspace_id}/announcements/{announcement_id}")
async def delete_announcement(workspace_id: str, announcement_id: str):
    """Delete an announcement."""
    result = await db.workspace_announcements.delete_one(
        {"id": announcement_id, "workspace_id": workspace_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"success": True}


# ============ Stats ============

@router.get("/{workspace_id}/stats")
async def get_workspace_stats(workspace_id: str):
    """Get real-time workspace stats."""
    now = datetime.now(timezone.utc)
    week_ago = (now - timedelta(days=7)).isoformat()

    member_count = await db.workspace_members.count_documents({"workspace_id": workspace_id})
    file_count = await db.files.count_documents({"workspace_id": workspace_id})
    announcement_count = await db.workspace_announcements.count_documents({"workspace_id": workspace_id})

    # Gather member user_ids
    members = await db.workspace_members.find({"workspace_id": workspace_id}, {"user_id": 1}).to_list(200)
    member_ids = [m["user_id"] for m in members]

    # Approval count for workspace members
    approval_count = await db.approvals.count_documents({
        "$or": [{"sender_id": {"$in": member_ids}}, {"steps.approver_id": {"$in": member_ids}}],
        "status": "pending",
    })

    # Recent activity count (messages, files, approvals created in last 7 days)
    recent_messages = await db.messages.count_documents({
        "sender_id": {"$in": member_ids}, "created_at": {"$gte": week_ago}
    })
    recent_files = await db.files.count_documents({
        "workspace_id": workspace_id, "uploaded_at": {"$gte": week_ago}
    })
    recent_approvals = await db.approvals.count_documents({
        "sender_id": {"$in": member_ids}, "created_at": {"$gte": week_ago}
    })
    recent_activity = recent_messages + recent_files + recent_approvals

    return {
        "member_count": member_count,
        "file_count": file_count,
        "announcement_count": announcement_count,
        "pending_approvals": approval_count,
        "recent_activity": recent_activity,
        "recent_messages": recent_messages,
        "recent_files": recent_files,
        "recent_approvals": recent_approvals,
    }


# ============ Activity Feed ============

@router.get("/{workspace_id}/activity")
async def get_workspace_activity(workspace_id: str, limit: int = Query(30, le=100)):
    """Get recent activity feed for a workspace."""
    members = await db.workspace_members.find({"workspace_id": workspace_id}, {"user_id": 1, "role": 1}).to_list(200)
    member_ids = [m["user_id"] for m in members]
    users = await db.users.find({"id": {"$in": member_ids}}, {"_id": 0, "id": 1, "name": 1, "email": 1}).to_list(200)
    user_map = {u["id"]: u.get("name", u.get("email", "User")) for u in users}

    activities = []

    # Member joins
    for m in members:
        joined = m.get("joined_at")
        if joined:
            uid = m.get("user_id", "")
            activities.append({
                "type": "member_joined",
                "icon": "user-plus",
                "message": f"{user_map.get(uid, 'Someone')} joined the workspace",
                "user_id": uid,
                "timestamp": joined,
            })

    # Recent approvals
    recent_approvals = await db.approvals.find(
        {"sender_id": {"$in": member_ids}}, {"_id": 0, "id": 1, "title": 1, "sender_id": 1, "sender_name": 1, "status": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(limit)
    for a in recent_approvals:
        activities.append({
            "type": "approval_created",
            "icon": "file-check-2",
            "message": f"{a.get('sender_name', 'Someone')} created approval: {a.get('title', '')}",
            "user_id": a.get("sender_id"),
            "ref_id": a.get("id"),
            "status": a.get("status"),
            "timestamp": a.get("created_at", ""),
        })

    # Recent announcements
    recent_announcements = await db.workspace_announcements.find(
        {"workspace_id": workspace_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    for ann in recent_announcements:
        activities.append({
            "type": "announcement",
            "icon": "megaphone",
            "message": f"{ann.get('author_name', 'Admin')} posted: {ann.get('title', '')}",
            "user_id": ann.get("author_id"),
            "ref_id": ann.get("id"),
            "timestamp": ann.get("created_at", ""),
        })

    # Sort all by timestamp desc
    activities.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

    return {"activities": activities[:limit]}
