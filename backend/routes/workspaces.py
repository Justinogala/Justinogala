"""
Workspace routes - workspace CRUD, members, announcements, stats, activity, files.
"""
from fastapi import APIRouter, HTTPException, Query, Form
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel
import uuid
import base64

from config import db, fs_workspace_files, logger

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
        "id": "ict-support",
        "name": "ICT Support",
        "description": "IT helpdesk hub for hardware, software, network, and access support requests with ticket tracking and resolution workflows",
        "icon": "🖥️",
        "color": "#0ea5e9",
        "scope": "team",
        "category": "IT",
        "includes": ["ICT support request form", "Ticket tracking", "Resolution comments"],
        "announcements": [
            {"title": "ICT Support Hub", "content": "Submit IT support requests using the ICT Support tab. Track ticket status, view resolutions, and add comments. Only workspace members can view and interact with tickets.", "pinned": True},
            {"title": "How to Submit a Request", "content": "1. Go to the ICT Support tab\n2. Click 'New Request'\n3. Fill in the category, priority, and description\n4. Submit — the IT team will be notified", "pinned": False},
        ],
        "approval_templates": [
            {"name": "ICT Support Request", "category": "IT", "description": "Submit an IT support ticket", "icon": "monitor", "fields": [
                {"name": "category", "label": "Category", "type": "select", "required": True, "options": ["Hardware", "Software", "Network", "Access/Permissions", "Email", "Printer", "Phone/VoIP", "Other"]},
                {"name": "priority", "label": "Priority", "type": "select", "required": True, "options": ["Low", "Medium", "High", "Critical"]},
                {"name": "affected_system", "label": "Affected System/Device", "type": "text", "required": True},
                {"name": "description", "label": "Issue Description", "type": "textarea", "required": True},
                {"name": "steps_to_reproduce", "label": "Steps to Reproduce (if applicable)", "type": "textarea", "required": False},
                {"name": "impact", "label": "Business Impact", "type": "select", "required": True, "options": ["Individual", "Team", "Department", "Organisation-wide"]},
            ]},
            {"name": "Access Request", "category": "IT", "description": "Request new system access or permission changes", "icon": "key", "fields": [
                {"name": "request_type", "label": "Request Type", "type": "select", "required": True, "options": ["New Access", "Modify Access", "Revoke Access"]},
                {"name": "system_name", "label": "System/Application Name", "type": "text", "required": True},
                {"name": "access_level", "label": "Access Level Needed", "type": "select", "required": True, "options": ["Read Only", "Read/Write", "Admin", "Custom"]},
                {"name": "justification", "label": "Business Justification", "type": "textarea", "required": True},
                {"name": "duration", "label": "Duration", "type": "select", "required": True, "options": ["Permanent", "30 Days", "90 Days", "Project-based"]},
            ]},
        ],
        "quick_links": [
            {"label": "Submit Ticket", "path": "/ict-support", "icon": "monitor"},
            {"label": "My Tickets", "path": "/ict-support", "icon": "clipboard-list"},
            {"label": "IT Docs", "path": "/files", "icon": "book"},
            {"label": "Team Chat", "path": "/workspace/chat", "icon": "message-square"},
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
        # Exclude deleted workspaces for regular users
        not_deleted = {"status": {"$ne": "deleted"}}
        
        if user_id:
            owned = await db.workspaces.find(
                {"owner_id": user_id, **not_deleted}, {"_id": 0}
            ).to_list(100)
            
            memberships = await db.workspace_members.find({"user_id": user_id}, {"workspace_id": 1}).to_list(100)
            member_workspace_ids = [m["workspace_id"] for m in memberships]
            
            member_workspaces = await db.workspaces.find(
                {"id": {"$in": member_workspace_ids}, "owner_id": {"$ne": user_id}, **not_deleted},
                {"_id": 0}
            ).to_list(100)
            
            all_workspaces = owned + member_workspaces
        else:
            all_workspaces = await db.workspaces.find(not_deleted, {"_id": 0}).to_list(100)
        
        return {"workspaces": all_workspaces}
    except Exception as e:
        logger.error(f"Error fetching workspaces: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_workspace(workspace: WorkspaceCreate):
    """Create a new workspace. Only admin users can create workspaces."""
    try:
        # Check if the user has admin role
        creator = await db.users.find_one({"id": workspace.owner_id}, {"_id": 0, "role": 1})
        if not creator or (creator.get("role") or "").lower() not in ["admin", "super_admin", "manager"]:
            raise HTTPException(status_code=403, detail="Only admin users can create workspaces")

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
        
        # Clean up workspace files from GridFS
        ws_files = await db.workspace_files.find({"workspace_id": workspace_id}, {"grid_id": 1}).to_list(500)
        if ws_files:
            from bson import ObjectId
            for wf in ws_files:
                try:
                    await fs_workspace_files.delete(ObjectId(wf["grid_id"]))
                except Exception:
                    pass
            await db.workspace_files.delete_many({"workspace_id": workspace_id})
        
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
    file_count = await db.workspace_files.count_documents({"workspace_id": workspace_id})
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
    recent_files = await db.workspace_files.count_documents({
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


# ============ Workspace Files ============

# Permission levels: owner/admin > member > viewer
# owner/admin: upload, download, delete any file
# member: upload, download, delete own files only
# viewer: download only

async def get_user_file_permission(workspace_id: str, user_id: str) -> str:
    """Return the effective file permission for a user in a workspace: 'admin', 'member', or 'viewer'."""
    ws = await db.workspaces.find_one({"id": workspace_id}, {"_id": 0, "owner_id": 1, "settings": 1})
    if not ws:
        return "viewer"

    # Owner always has admin
    if ws.get("owner_id") == user_id:
        return "admin"

    # Check workspace membership
    membership = await db.workspace_members.find_one(
        {"workspace_id": workspace_id, "user_id": user_id},
        {"_id": 0, "role": 1, "file_role": 1},
    )
    if not membership:
        return "viewer"

    # Per-member override takes priority
    if membership.get("file_role"):
        return membership["file_role"]

    # Workspace-level role mapping
    ws_role = membership.get("role", "member")
    if ws_role in ("owner", "admin"):
        return "admin"

    # Fall back to workspace default_file_role setting
    default_role = (ws.get("settings") or {}).get("default_file_role", "member")
    return default_role


class FilePermissionUpdate(BaseModel):
    default_file_role: str  # "member" or "viewer"


class MemberFileRoleUpdate(BaseModel):
    file_role: str  # "admin", "member", or "viewer"


@router.get("/{workspace_id}/file-permissions")
async def get_file_permissions(workspace_id: str, user_id: str = Query(...)):
    """Get workspace file permission settings + the requesting user's effective permission."""
    ws = await db.workspaces.find_one({"id": workspace_id}, {"_id": 0, "owner_id": 1, "settings": 1})
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    default_role = (ws.get("settings") or {}).get("default_file_role", "member")
    effective = await get_user_file_permission(workspace_id, user_id)

    return {"default_file_role": default_role, "user_permission": effective}


@router.put("/{workspace_id}/file-permissions")
async def update_file_permissions(workspace_id: str, body: FilePermissionUpdate, user_id: str = Query(...)):
    """Update workspace default file role. Only workspace owner/admin can do this."""
    perm = await get_user_file_permission(workspace_id, user_id)
    if perm != "admin":
        raise HTTPException(status_code=403, detail="Only workspace admins can change file permissions")

    if body.default_file_role not in ("member", "viewer"):
        raise HTTPException(status_code=400, detail="default_file_role must be 'member' or 'viewer'")

    await db.workspaces.update_one(
        {"id": workspace_id},
        {"$set": {"settings.default_file_role": body.default_file_role}},
    )
    return {"success": True, "default_file_role": body.default_file_role}


@router.put("/{workspace_id}/members/{member_user_id}/file-role")
async def update_member_file_role(workspace_id: str, member_user_id: str, body: MemberFileRoleUpdate, user_id: str = Query(...)):
    """Override a specific member's file role. Only workspace owner/admin can do this."""
    perm = await get_user_file_permission(workspace_id, user_id)
    if perm != "admin":
        raise HTTPException(status_code=403, detail="Only workspace admins can change member file roles")

    if body.file_role not in ("admin", "member", "viewer"):
        raise HTTPException(status_code=400, detail="file_role must be 'admin', 'member', or 'viewer'")

    result = await db.workspace_members.update_one(
        {"workspace_id": workspace_id, "user_id": member_user_id},
        {"$set": {"file_role": body.file_role}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")

    return {"success": True, "file_role": body.file_role}


@router.post("/{workspace_id}/files/upload")
async def upload_workspace_file(
    workspace_id: str,
    user_id: str = Form(...),
    file_name: str = Form(...),
    file_data: str = Form(...),
    content_type: str = Form(...),
):
    """Upload a file to a workspace. Requires 'admin' or 'member' permission."""
    try:
        # Check permission
        perm = await get_user_file_permission(workspace_id, user_id)
        if perm == "viewer":
            raise HTTPException(status_code=403, detail="You don't have permission to upload files in this workspace")

        # Verify workspace exists
        ws = await db.workspaces.find_one({"id": workspace_id}, {"_id": 0, "id": 1})
        if not ws:
            raise HTTPException(status_code=404, detail="Workspace not found")

        file_bytes = base64.b64decode(file_data)
        file_id = str(uuid.uuid4())

        grid_id = await fs_workspace_files.upload_from_stream(
            file_name,
            file_bytes,
            metadata={
                "file_id": file_id,
                "workspace_id": workspace_id,
                "user_id": user_id,
                "content_type": content_type,
                "uploaded_at": datetime.now(timezone.utc).isoformat(),
            },
        )

        file_doc = {
            "id": file_id,
            "grid_id": str(grid_id),
            "workspace_id": workspace_id,
            "user_id": user_id,
            "file_name": file_name,
            "content_type": content_type,
            "size": len(file_bytes),
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.workspace_files.insert_one(file_doc)

        # Get uploader name for response
        uploader = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1, "email": 1})
        uploader_name = (uploader.get("name") or uploader.get("email", "Unknown")) if uploader else "Unknown"

        return {
            "success": True,
            "file": {
                "id": file_id,
                "workspace_id": workspace_id,
                "user_id": user_id,
                "uploader_name": uploader_name,
                "file_name": file_name,
                "content_type": content_type,
                "size": len(file_bytes),
                "uploaded_at": file_doc["uploaded_at"],
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading workspace file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{workspace_id}/files")
async def list_workspace_files(workspace_id: str, limit: int = Query(100, le=500)):
    """List all files in a workspace."""
    try:
        files = await db.workspace_files.find(
            {"workspace_id": workspace_id},
            {"_id": 0, "grid_id": 0},
        ).sort("uploaded_at", -1).to_list(limit)

        # Enrich with uploader names
        user_ids = list({f["user_id"] for f in files})
        users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0, "id": 1, "name": 1, "email": 1}).to_list(len(user_ids))
        user_map = {u["id"]: u.get("name") or u.get("email", "Unknown") for u in users}

        for f in files:
            f["uploader_name"] = user_map.get(f.get("user_id"), "Unknown")

        return {"files": files, "count": len(files)}
    except Exception as e:
        logger.error(f"Error listing workspace files: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{workspace_id}/files/{file_id}")
async def download_workspace_file(workspace_id: str, file_id: str):
    """Download/stream a workspace file."""
    file_doc = await db.workspace_files.find_one({"id": file_id, "workspace_id": workspace_id})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")

    try:
        from bson import ObjectId

        grid_out = await fs_workspace_files.open_download_stream(ObjectId(file_doc["grid_id"]))

        async def file_iterator():
            while True:
                chunk = await grid_out.read(8192)
                if not chunk:
                    break
                yield chunk

        return StreamingResponse(
            file_iterator(),
            media_type=file_doc.get("content_type", "application/octet-stream"),
            headers={"Content-Disposition": f'inline; filename="{file_doc["file_name"]}"'},
        )
    except Exception as e:
        logger.error(f"Error downloading workspace file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{workspace_id}/files/{file_id}")
async def delete_workspace_file(workspace_id: str, file_id: str, user_id: str = Query(...)):
    """Delete a file from a workspace. Admin can delete any file; members can delete only their own."""
    file_doc = await db.workspace_files.find_one({"id": file_id, "workspace_id": workspace_id})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")

    perm = await get_user_file_permission(workspace_id, user_id)
    if perm == "viewer":
        raise HTTPException(status_code=403, detail="You don't have permission to delete files")
    if perm == "member" and file_doc.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="You can only delete your own files")

    try:
        from bson import ObjectId

        await fs_workspace_files.delete(ObjectId(file_doc["grid_id"]))
        await db.workspace_files.delete_one({"id": file_id, "workspace_id": workspace_id})
        return {"success": True, "message": "File deleted"}
    except Exception as e:
        logger.error(f"Error deleting workspace file: {e}")
        raise HTTPException(status_code=500, detail=str(e))



# ============== ICT Support Request Models ==============

class ICTRequestCreate(BaseModel):
    workspace_id: str
    submitted_by_id: str
    submitted_by_name: str
    # Reporter info
    reporter_role: str = ""
    department: str = ""
    reporting_for_self: str = "Yes"
    other_user_name: str = ""
    other_user_email: str = ""
    # Request details
    request_type: str = ""
    location: str = ""
    description: str = ""
    device_equipment: str = ""
    who_is_affected: str = ""
    symptoms: str = ""
    error_messages: str = ""
    troubleshooting_attempted: str = "No"
    troubleshooting_results: str = ""
    # HR related
    is_hr_related: str = "No"
    hr_details: str = ""
    hr_email: str = ""
    # Contact
    contact_number: str = ""
    work_email: str = ""
    # Legacy/compatible fields
    priority: str = "Medium"

class ICTRequestUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to_id: Optional[str] = None
    assigned_to_name: Optional[str] = None
    resolution_notes: Optional[str] = None
    notes: Optional[str] = None
    email_sent: Optional[bool] = None

class ICTCommentCreate(BaseModel):
    user_id: str
    user_name: str
    content: str


# ============== ICT Support Request Endpoints ==============

@router.post("/{workspace_id}/ict-requests")
async def create_ict_request(workspace_id: str, request: ICTRequestCreate):
    """Create a new ICT support request. Only workspace members can submit."""
    ws = await db.workspaces.find_one({"id": workspace_id})
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    member = await db.workspace_members.find_one({"workspace_id": workspace_id, "user_id": request.submitted_by_id})
    if not member:
        raise HTTPException(status_code=403, detail="Only workspace members can submit requests")

    now = datetime.now(timezone.utc).isoformat()
    ticket_id = str(uuid.uuid4())

    # Generate a human-readable ticket number
    count = await db.ict_support_requests.count_documents({"workspace_id": workspace_id})
    ticket_number = f"ICT-{count + 1:04d}"

    ticket = {
        "id": ticket_id,
        "ticket_number": ticket_number,
        "workspace_id": workspace_id,
        # Reporter info
        "submitted_by_id": request.submitted_by_id,
        "submitted_by_name": request.submitted_by_name,
        "reporter_role": request.reporter_role,
        "department": request.department,
        "reporting_for_self": request.reporting_for_self,
        "other_user_name": request.other_user_name,
        "other_user_email": request.other_user_email,
        # Request details
        "request_type": request.request_type,
        "location": request.location,
        "description": request.description,
        "device_equipment": request.device_equipment,
        "who_is_affected": request.who_is_affected,
        "symptoms": request.symptoms,
        "error_messages": request.error_messages,
        "troubleshooting_attempted": request.troubleshooting_attempted,
        "troubleshooting_results": request.troubleshooting_results,
        # HR related
        "is_hr_related": request.is_hr_related,
        "hr_details": request.hr_details,
        "hr_email": request.hr_email,
        # Contact
        "contact_number": request.contact_number,
        "work_email": request.work_email,
        # Ticket meta
        "priority": request.priority,
        "status": "Open",
        "assigned_to_id": None,
        "assigned_to_name": None,
        "resolution_notes": None,
        "notes": "",
        "email_sent": False,
        "comments": [],
        "created_at": now,
        "updated_at": now,
        "resolved_at": None,
    }
    await db.ict_support_requests.insert_one(ticket)
    ticket.pop("_id", None)
    return {"success": True, "request": ticket}


@router.get("/{workspace_id}/ict-requests")
async def get_ict_requests(workspace_id: str, user_id: str = Query(...)):
    """Get ICT requests. Standard users see only their own; owner/admin see all."""
    member = await db.workspace_members.find_one({"workspace_id": workspace_id, "user_id": user_id})
    if not member:
        raise HTTPException(status_code=403, detail="Only workspace members can view requests")

    is_admin = member.get("role") in ["owner", "admin"]
    query = {"workspace_id": workspace_id}
    if not is_admin:
        query["submitted_by_id"] = user_id

    cursor = db.ict_support_requests.find(query, {"_id": 0}).sort("created_at", -1)
    requests = await cursor.to_list(500)
    return {"requests": requests, "is_admin": is_admin}


@router.get("/{workspace_id}/ict-requests/{request_id}")
async def get_ict_request(workspace_id: str, request_id: str, user_id: str = Query(...)):
    """Get a single ICT request with comments. Only workspace members can view."""
    member = await db.workspace_members.find_one({"workspace_id": workspace_id, "user_id": user_id})
    if not member:
        raise HTTPException(status_code=403, detail="Only workspace members can view requests")

    ticket = await db.ict_support_requests.find_one({"id": request_id, "workspace_id": workspace_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Request not found")
    return ticket


@router.put("/{workspace_id}/ict-requests/{request_id}")
async def update_ict_request(workspace_id: str, request_id: str, update: ICTRequestUpdate, user_id: str = Query(...)):
    """Update ICT request status/assignment. Only owner/admin can update."""
    member = await db.workspace_members.find_one({"workspace_id": workspace_id, "user_id": user_id})
    if not member or member.get("role") not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only workspace owner/admin can update requests")

    ticket = await db.ict_support_requests.find_one({"id": request_id, "workspace_id": workspace_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Request not found")

    now = datetime.now(timezone.utc).isoformat()
    update_fields = {"updated_at": now}
    if update.status:
        update_fields["status"] = update.status
        if update.status == "Resolved":
            update_fields["resolved_at"] = now
    if update.assigned_to_id is not None:
        update_fields["assigned_to_id"] = update.assigned_to_id
        update_fields["assigned_to_name"] = update.assigned_to_name
    if update.resolution_notes is not None:
        update_fields["resolution_notes"] = update.resolution_notes
    if update.notes is not None:
        update_fields["notes"] = update.notes
    if update.email_sent is not None:
        update_fields["email_sent"] = update.email_sent

    await db.ict_support_requests.update_one({"id": request_id}, {"$set": update_fields})
    updated = await db.ict_support_requests.find_one({"id": request_id}, {"_id": 0})
    return {"success": True, "request": updated}


@router.post("/{workspace_id}/ict-requests/{request_id}/comments")
async def add_ict_comment(workspace_id: str, request_id: str, comment: ICTCommentCreate):
    """Add a comment to an ICT request. Members can comment after resolution; owner/admin anytime."""
    member = await db.workspace_members.find_one({"workspace_id": workspace_id, "user_id": comment.user_id})
    if not member:
        raise HTTPException(status_code=403, detail="Only workspace members can comment")

    ticket = await db.ict_support_requests.find_one({"id": request_id, "workspace_id": workspace_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Request not found")

    is_admin = member.get("role") in ["owner", "admin"]
    if not is_admin and ticket.get("status") not in ["Resolved", "Closed"]:
        raise HTTPException(status_code=403, detail="Members can only comment after the ticket is resolved")

    now = datetime.now(timezone.utc).isoformat()
    new_comment = {
        "id": str(uuid.uuid4()),
        "user_id": comment.user_id,
        "user_name": comment.user_name,
        "content": comment.content,
        "created_at": now,
    }

    await db.ict_support_requests.update_one(
        {"id": request_id},
        {"$push": {"comments": new_comment}, "$set": {"updated_at": now}}
    )
    return {"success": True, "comment": new_comment}


@router.delete("/{workspace_id}/ict-requests/{request_id}")
async def delete_ict_request(workspace_id: str, request_id: str, user_id: str = Query(...)):
    """Delete an ICT request. Only owner/admin can delete."""
    member = await db.workspace_members.find_one({"workspace_id": workspace_id, "user_id": user_id})
    if not member or member.get("role") not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only workspace owner/admin can delete requests")

    result = await db.ict_support_requests.delete_one({"id": request_id, "workspace_id": workspace_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"success": True}
