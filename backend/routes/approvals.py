"""
Approvals Module - Workflow & Request Management System
Handles approval requests, templates, workflows, comments, and audit trails.
"""
import uuid
import io
import os
import csv
import base64
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

router = APIRouter(prefix="/approvals", tags=["approvals"])

# ============ Template Data ============

DEFAULT_TEMPLATES = [
    # Activity
    {"id": "tpl-activity-funds", "name": "Activity Funds Application", "category": "Activity", "description": "Request funds for team activities and events", "icon": "banknote",
     "fields": [{"name": "activity_name", "label": "Activity Name", "type": "text", "required": True}, {"name": "date", "label": "Activity Date", "type": "date", "required": True}, {"name": "amount", "label": "Requested Amount", "type": "number", "required": True}, {"name": "participants", "label": "Number of Participants", "type": "number", "required": True}, {"name": "description", "label": "Description", "type": "textarea", "required": True}, {"name": "attachments", "label": "Supporting Documents", "type": "file", "required": False}]},
    {"id": "tpl-discount", "name": "Discount Application", "category": "Activity", "description": "Apply for special discounts on products or services", "icon": "percent",
     "fields": [{"name": "item", "label": "Item/Service", "type": "text", "required": True}, {"name": "original_price", "label": "Original Price", "type": "number", "required": True}, {"name": "discount_percent", "label": "Discount %", "type": "number", "required": True}, {"name": "reason", "label": "Reason for Discount", "type": "textarea", "required": True}]},
    {"id": "tpl-field-trip", "name": "Field Trip Request", "category": "Activity", "description": "Request approval for field trips and outings", "icon": "map-pin",
     "fields": [{"name": "destination", "label": "Destination", "type": "text", "required": True}, {"name": "date", "label": "Trip Date", "type": "date", "required": True}, {"name": "return_date", "label": "Return Date", "type": "date", "required": True}, {"name": "participants", "label": "Participants", "type": "number", "required": True}, {"name": "budget", "label": "Estimated Budget", "type": "number", "required": True}, {"name": "purpose", "label": "Purpose", "type": "textarea", "required": True}]},
    {"id": "tpl-gift", "name": "Gift Application", "category": "Activity", "description": "Request approval for corporate gifts", "icon": "gift",
     "fields": [{"name": "recipient", "label": "Recipient", "type": "text", "required": True}, {"name": "occasion", "label": "Occasion", "type": "text", "required": True}, {"name": "amount", "label": "Amount", "type": "number", "required": True}, {"name": "description", "label": "Gift Description", "type": "textarea", "required": True}]},
    # Administration
    {"id": "tpl-business-card", "name": "Business Card Request", "category": "Administration", "description": "Order new business cards", "icon": "credit-card",
     "fields": [{"name": "name_on_card", "label": "Name on Card", "type": "text", "required": True}, {"name": "title", "label": "Job Title", "type": "text", "required": True}, {"name": "phone", "label": "Phone Number", "type": "text", "required": True}, {"name": "email", "label": "Email", "type": "text", "required": True}, {"name": "quantity", "label": "Quantity", "type": "number", "required": True}]},
    {"id": "tpl-item-application", "name": "Item Application", "category": "Administration", "description": "Request office items or equipment", "icon": "package",
     "fields": [{"name": "item_name", "label": "Item Name", "type": "text", "required": True}, {"name": "quantity", "label": "Quantity", "type": "number", "required": True}, {"name": "reason", "label": "Reason", "type": "textarea", "required": True}, {"name": "urgency", "label": "Urgency", "type": "select", "required": True, "options": ["Low", "Medium", "High", "Critical"]}]},
    {"id": "tpl-maintenance", "name": "Maintenance Request", "category": "Administration", "description": "Submit maintenance and repair requests", "icon": "wrench",
     "fields": [{"name": "location", "label": "Location", "type": "text", "required": True}, {"name": "issue", "label": "Issue Description", "type": "textarea", "required": True}, {"name": "urgency", "label": "Urgency", "type": "select", "required": True, "options": ["Low", "Medium", "High", "Critical"]}, {"name": "attachments", "label": "Photos", "type": "file", "required": False}]},
    {"id": "tpl-official-seal", "name": "Official Seal Application", "category": "Administration", "description": "Request use of company official seal", "icon": "stamp",
     "fields": [{"name": "document_type", "label": "Document Type", "type": "text", "required": True}, {"name": "purpose", "label": "Purpose", "type": "textarea", "required": True}, {"name": "date_needed", "label": "Date Needed", "type": "date", "required": True}]},
    # Projects
    {"id": "tpl-project-request", "name": "Project Request", "category": "Projects", "description": "Submit a new project proposal for approval", "icon": "folder-kanban",
     "fields": [{"name": "project_name", "label": "Project Name", "type": "text", "required": True}, {"name": "budget", "label": "Budget", "type": "number", "required": True}, {"name": "start_date", "label": "Start Date", "type": "date", "required": True}, {"name": "end_date", "label": "End Date", "type": "date", "required": True}, {"name": "team_size", "label": "Team Size", "type": "number", "required": True}, {"name": "description", "label": "Project Description", "type": "textarea", "required": True}, {"name": "attachments", "label": "Project Plan", "type": "file", "required": False}]},
    {"id": "tpl-verification-letter", "name": "Verification Letter", "category": "Projects", "description": "Request an employment or project verification letter", "icon": "file-check",
     "fields": [{"name": "letter_type", "label": "Letter Type", "type": "select", "required": True, "options": ["Employment Verification", "Project Completion", "Income Verification", "Other"]}, {"name": "addressed_to", "label": "Addressed To", "type": "text", "required": True}, {"name": "purpose", "label": "Purpose", "type": "textarea", "required": True}]},
    # Attendance
    {"id": "tpl-leave", "name": "Leave Request", "category": "Attendance", "description": "Apply for leave (annual, sick, personal)", "icon": "calendar-off",
     "fields": [{"name": "leave_type", "label": "Leave Type", "type": "select", "required": True, "options": ["Annual Leave", "Sick Leave", "Personal Leave", "Maternity/Paternity", "Bereavement", "Other"]}, {"name": "start_date", "label": "Start Date", "type": "date", "required": True}, {"name": "end_date", "label": "End Date", "type": "date", "required": True}, {"name": "reason", "label": "Reason", "type": "textarea", "required": True}]},
    {"id": "tpl-overtime", "name": "Overtime Request", "category": "Attendance", "description": "Request approval for overtime work", "icon": "clock",
     "fields": [{"name": "date", "label": "Date", "type": "date", "required": True}, {"name": "hours", "label": "Overtime Hours", "type": "number", "required": True}, {"name": "reason", "label": "Reason", "type": "textarea", "required": True}]},
    {"id": "tpl-business-trip", "name": "Business Trip", "category": "Attendance", "description": "Request approval for business travel", "icon": "plane",
     "fields": [{"name": "destination", "label": "Destination", "type": "text", "required": True}, {"name": "departure_date", "label": "Departure Date", "type": "date", "required": True}, {"name": "return_date", "label": "Return Date", "type": "date", "required": True}, {"name": "budget", "label": "Estimated Budget", "type": "number", "required": True}, {"name": "purpose", "label": "Purpose", "type": "textarea", "required": True}]},
    {"id": "tpl-enter-office", "name": "Enter Office Request", "category": "Attendance", "description": "Request permission to enter office on non-working days", "icon": "building-2",
     "fields": [{"name": "date", "label": "Date", "type": "date", "required": True}, {"name": "time_in", "label": "Time In", "type": "text", "required": True}, {"name": "time_out", "label": "Time Out", "type": "text", "required": True}, {"name": "reason", "label": "Reason", "type": "textarea", "required": True}]},
    {"id": "tpl-swap-shift", "name": "Swap Shift", "category": "Attendance", "description": "Request to swap shift with a colleague", "icon": "arrow-left-right",
     "fields": [{"name": "swap_with", "label": "Swap With (Name)", "type": "text", "required": True}, {"name": "your_shift", "label": "Your Shift Date", "type": "date", "required": True}, {"name": "their_shift", "label": "Their Shift Date", "type": "date", "required": True}, {"name": "reason", "label": "Reason", "type": "textarea", "required": True}]},
    {"id": "tpl-wfh", "name": "Work From Home", "category": "Attendance", "description": "Request to work from home", "icon": "home",
     "fields": [{"name": "date", "label": "Date", "type": "date", "required": True}, {"name": "reason", "label": "Reason", "type": "textarea", "required": True}]},
    # Finance
    {"id": "tpl-direct-deposit", "name": "Direct Deposit Request", "category": "Finance", "description": "Set up or change direct deposit information", "icon": "landmark",
     "fields": [{"name": "bank_name", "label": "Bank Name", "type": "text", "required": True}, {"name": "account_type", "label": "Account Type", "type": "select", "required": True, "options": ["Checking", "Savings"]}, {"name": "routing_number", "label": "Routing Number", "type": "text", "required": True}, {"name": "account_number", "label": "Account Number", "type": "text", "required": True}]},
    {"id": "tpl-payment-request", "name": "Payment Request", "category": "Finance", "description": "Request a payment to be processed", "icon": "banknote",
     "fields": [{"name": "payee", "label": "Payee Name", "type": "text", "required": True}, {"name": "amount", "label": "Amount", "type": "number", "required": True}, {"name": "due_date", "label": "Due Date", "type": "date", "required": True}, {"name": "description", "label": "Description", "type": "textarea", "required": True}, {"name": "invoice", "label": "Invoice/Receipt", "type": "file", "required": False}]},
    {"id": "tpl-reimbursement", "name": "Reimbursement", "category": "Finance", "description": "Submit expense reimbursement request", "icon": "receipt",
     "fields": [{"name": "expense_type", "label": "Expense Type", "type": "select", "required": True, "options": ["Travel", "Meals", "Supplies", "Software", "Other"]}, {"name": "amount", "label": "Amount", "type": "number", "required": True}, {"name": "date", "label": "Expense Date", "type": "date", "required": True}, {"name": "description", "label": "Description", "type": "textarea", "required": True}, {"name": "receipt", "label": "Receipt", "type": "file", "required": True}]},
    # Order Management
    {"id": "tpl-contract", "name": "Contract Request", "category": "Order Management", "description": "Request contract review and approval", "icon": "file-signature",
     "fields": [{"name": "contract_type", "label": "Contract Type", "type": "select", "required": True, "options": ["Vendor", "Client", "Employment", "NDA", "Other"]}, {"name": "party", "label": "Other Party", "type": "text", "required": True}, {"name": "value", "label": "Contract Value", "type": "number", "required": True}, {"name": "start_date", "label": "Start Date", "type": "date", "required": True}, {"name": "end_date", "label": "End Date", "type": "date", "required": True}, {"name": "document", "label": "Contract Document", "type": "file", "required": True}]},
    {"id": "tpl-purchase-order", "name": "Purchase Order", "category": "Order Management", "description": "Submit a purchase order for approval", "icon": "shopping-cart",
     "fields": [{"name": "vendor", "label": "Vendor", "type": "text", "required": True}, {"name": "items", "label": "Items Description", "type": "textarea", "required": True}, {"name": "amount", "label": "Total Amount", "type": "number", "required": True}, {"name": "delivery_date", "label": "Expected Delivery", "type": "date", "required": True}, {"name": "urgency", "label": "Urgency", "type": "select", "required": True, "options": ["Low", "Medium", "High", "Critical"]}]},
    {"id": "tpl-refund", "name": "Refund Request", "category": "Order Management", "description": "Process a refund request", "icon": "undo-2",
     "fields": [{"name": "order_id", "label": "Order/Invoice ID", "type": "text", "required": True}, {"name": "amount", "label": "Refund Amount", "type": "number", "required": True}, {"name": "reason", "label": "Reason for Refund", "type": "textarea", "required": True}]},
    {"id": "tpl-sales-order", "name": "Sales Order", "category": "Order Management", "description": "Submit a sales order for processing", "icon": "trending-up",
     "fields": [{"name": "customer", "label": "Customer Name", "type": "text", "required": True}, {"name": "items", "label": "Items", "type": "textarea", "required": True}, {"name": "amount", "label": "Total Amount", "type": "number", "required": True}, {"name": "delivery_date", "label": "Delivery Date", "type": "date", "required": True}]},
]

TEMPLATE_CATEGORIES = ["Activity", "Administration", "Projects", "Attendance", "Finance", "Order Management"]


# ============ Models ============

class CreateApprovalRequest(BaseModel):
    title: str
    template_id: Optional[str] = None
    category: Optional[str] = None
    priority: str = "Medium"
    approvers: List[dict] = []  # [{user_id, name, email, step, type}]
    form_data: dict = {}
    workflow_type: str = "single"  # single, sequential, parallel, conditional
    conditions: Optional[List[dict]] = None  # [{field, operator, value, action}]
    deadline: Optional[str] = None
    description: Optional[str] = ""
    attachments: Optional[List[dict]] = None
    linked_meeting: Optional[dict] = None  # {meeting_id, title}
    linked_files: Optional[List[dict]] = None  # [{file_id, name, url}]
    linked_chat_message: Optional[dict] = None  # {message_id, preview}

class UpdateApprovalAction(BaseModel):
    action: str  # approve, reject, cancel, reassign
    comment: Optional[str] = ""
    reassign_to: Optional[dict] = None

class AddCommentRequest(BaseModel):
    content: str
    attachments: Optional[List[dict]] = None

class CreateTemplateRequest(BaseModel):
    name: str
    category: str
    description: str
    icon: str = "file-text"
    fields: List[dict] = []
    default_workflow: Optional[dict] = None
    scope: str = "org"  # org, team
    team_id: Optional[str] = None


# ============ Helpers ============

def now_iso():
    return datetime.now(timezone.utc).isoformat()


# ============ Template Endpoints ============

@router.get("/templates")
async def get_templates(category: Optional[str] = None):
    """Get all available templates (default + custom)."""
    templates = list(DEFAULT_TEMPLATES)
    custom = await db.approval_templates.find({}, {"_id": 0}).to_list(500)
    templates.extend([{k: v for k, v in t.items() if k != "_id"} for t in custom])
    if category:
        templates = [t for t in templates if t.get("category") == category]
    return {"templates": templates, "categories": TEMPLATE_CATEGORIES}


@router.get("/templates/{template_id}")
async def get_template(template_id: str):
    """Get a specific template."""
    for t in DEFAULT_TEMPLATES:
        if t["id"] == template_id:
            return t
    custom = await db.approval_templates.find_one({"id": template_id}, {"_id": 0})
    if custom:
        return custom
    raise HTTPException(status_code=404, detail="Template not found")


@router.post("/templates")
async def create_template(request: CreateTemplateRequest):
    """Create a custom template."""
    template = {
        "id": f"tpl-custom-{uuid.uuid4().hex[:8]}",
        "name": request.name,
        "category": request.category,
        "description": request.description,
        "icon": request.icon,
        "fields": request.fields,
        "default_workflow": request.default_workflow,
        "scope": request.scope,
        "team_id": request.team_id,
        "is_custom": True,
        "created_at": now_iso(),
    }
    await db.approval_templates.insert_one(template)
    return {"success": True, "template": {k: v for k, v in template.items() if k != "_id"}}


@router.put("/templates/{template_id}")
async def update_template(template_id: str, request: CreateTemplateRequest):
    """Update a custom template."""
    existing = await db.approval_templates.find_one({"id": template_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Custom template not found")
    update = {
        "name": request.name,
        "category": request.category,
        "description": request.description,
        "icon": request.icon,
        "fields": request.fields,
        "default_workflow": request.default_workflow,
        "scope": request.scope,
        "team_id": request.team_id,
        "updated_at": now_iso(),
    }
    await db.approval_templates.update_one({"id": template_id}, {"$set": update})
    updated = await db.approval_templates.find_one({"id": template_id}, {"_id": 0})
    return {"success": True, "template": updated}


@router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    """Delete a custom template."""
    result = await db.approval_templates.delete_one({"id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found or is a default template")
    return {"success": True}


# ============ Approval CRUD ============

@router.post("/create")
async def create_approval(req: CreateApprovalRequest, user_id: str = Query(...), user_name: str = Query(""), user_email: str = Query("")):
    """Create a new approval request."""
    approval_id = str(uuid.uuid4())

    # Build approval steps
    steps = []
    for i, approver in enumerate(req.approvers):
        steps.append({
            "step": i + 1,
            "approver_id": approver.get("user_id", ""),
            "approver_name": approver.get("name", ""),
            "approver_email": approver.get("email", ""),
            "type": approver.get("type", "individual"),  # individual, group
            "status": "pending" if i == 0 or req.workflow_type == "parallel" else "waiting",
            "action_at": None,
            "comment": "",
        })

    approval = {
        "id": approval_id,
        "title": req.title,
        "template_id": req.template_id,
        "category": req.category or "General",
        "priority": req.priority,
        "status": "pending",
        "workflow_type": req.workflow_type,
        "conditions": req.conditions,
        "form_data": req.form_data,
        "steps": steps,
        "description": req.description or "",
        "attachments": req.attachments or [],
        "linked_meeting": req.linked_meeting,
        "linked_files": req.linked_files or [],
        "linked_chat_message": req.linked_chat_message,
        "deadline": req.deadline,
        "sender_id": user_id,
        "sender_name": user_name,
        "sender_email": user_email,
        "created_at": now_iso(),
        "updated_at": now_iso(),
        "completed_at": None,
        "source": "Manual",
    }

    # Audit trail
    audit = {
        "id": str(uuid.uuid4()),
        "approval_id": approval_id,
        "action": "created",
        "actor_id": user_id,
        "actor_name": user_name,
        "details": f"Approval request created: {req.title}",
        "timestamp": now_iso(),
    }

    await db.approvals.insert_one(approval)
    await db.approval_audit.insert_one(audit)

    # Create notifications for all approvers
    for step in steps:
        if step["approver_id"]:
            await db.approval_notifications.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": step["approver_id"],
                "type": "approval_request",
                "title": "New Approval Request",
                "message": f"{user_name} sent you an approval request: {req.title}",
                "approval_id": approval_id,
                "read": False,
                "created_at": now_iso(),
            })

    return {"success": True, "approval": {k: v for k, v in approval.items() if k != "_id"}}


@router.get("/list")
async def list_approvals(user_id: str = Query(...), tab: str = Query("received"), status: Optional[str] = None, priority: Optional[str] = None, search: Optional[str] = None):
    """List approvals for a user (received or sent)."""
    query = {}

    if tab == "sent":
        query["sender_id"] = user_id
    else:
        query["steps.approver_id"] = user_id

    if status and status != "all":
        query["status"] = status
    if priority and priority != "all":
        query["priority"] = priority
    if search:
        query["title"] = {"$regex": search, "$options": "i"}

    approvals = await db.approvals.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"approvals": approvals}


@router.get("/detail/{approval_id}")
async def get_approval_detail(approval_id: str):
    """Get full approval detail with comments and audit trail."""
    approval = await db.approvals.find_one({"id": approval_id}, {"_id": 0})
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")

    comments = await db.approval_comments.find({"approval_id": approval_id}, {"_id": 0}).sort("created_at", 1).to_list(500)
    audit = await db.approval_audit.find({"approval_id": approval_id}, {"_id": 0}).sort("timestamp", 1).to_list(500)

    return {"approval": approval, "comments": comments, "audit": audit}


@router.post("/action/{approval_id}")
async def take_action(approval_id: str, req: UpdateApprovalAction, user_id: str = Query(...), user_name: str = Query("")):
    """Approve, reject, cancel, or reassign an approval."""
    approval = await db.approvals.find_one({"id": approval_id}, {"_id": 0})
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")

    action = req.action
    steps = approval.get("steps", [])
    workflow_type = approval.get("workflow_type", "single")
    now = now_iso()

    if action == "cancel":
        await db.approvals.update_one({"id": approval_id}, {"$set": {"status": "cancelled", "updated_at": now, "completed_at": now}})
    elif action in ("approve", "reject"):
        # Find the step for this user
        step_updated = False
        for step in steps:
            if step["approver_id"] == user_id and step["status"] == "pending":
                step["status"] = "approved" if action == "approve" else "rejected"
                step["action_at"] = now
                step["comment"] = req.comment or ""
                step_updated = True
                break

        if not step_updated:
            raise HTTPException(status_code=400, detail="No pending step found for this user")

        # Determine overall status
        new_status = approval["status"]
        if action == "reject":
            new_status = "rejected"
        elif workflow_type == "single":
            new_status = "approved"
        elif workflow_type == "parallel":
            if all(s["status"] == "approved" for s in steps):
                new_status = "approved"
        elif workflow_type in ("sequential", "conditional"):
            current_step = next((s for s in steps if s["status"] == "approved"), None)
            if current_step:
                next_step = next((s for s in steps if s["status"] == "waiting"), None)
                if next_step:
                    next_step["status"] = "pending"
                else:
                    new_status = "approved"

        # Check conditional rules
        if approval.get("conditions") and action == "approve":
            for cond in approval["conditions"]:
                field_val = approval.get("form_data", {}).get(cond.get("field", ""), 0)
                try:
                    field_val = float(field_val)
                except (ValueError, TypeError):
                    field_val = 0
                threshold = float(cond.get("value", 0))
                op = cond.get("operator", ">")
                triggered = (op == ">" and field_val > threshold) or (op == ">=" and field_val >= threshold) or (op == "<" and field_val < threshold)
                if triggered and cond.get("action") == "add_approver":
                    extra = cond.get("approver", {})
                    if extra and not any(s["approver_id"] == extra.get("user_id") for s in steps):
                        steps.append({
                            "step": len(steps) + 1,
                            "approver_id": extra.get("user_id", ""),
                            "approver_name": extra.get("name", ""),
                            "approver_email": extra.get("email", ""),
                            "type": "individual",
                            "status": "pending",
                            "action_at": None,
                            "comment": "",
                        })
                        new_status = "pending"

        update = {"steps": steps, "status": new_status, "updated_at": now}
        if new_status in ("approved", "rejected", "cancelled"):
            update["completed_at"] = now
        await db.approvals.update_one({"id": approval_id}, {"$set": update})
    elif action == "reassign" and req.reassign_to:
        for step in steps:
            if step["approver_id"] == user_id and step["status"] == "pending":
                step["approver_id"] = req.reassign_to.get("user_id", "")
                step["approver_name"] = req.reassign_to.get("name", "")
                step["approver_email"] = req.reassign_to.get("email", "")
                break
        await db.approvals.update_one({"id": approval_id}, {"$set": {"steps": steps, "updated_at": now}})

    # Audit
    audit = {
        "id": str(uuid.uuid4()),
        "approval_id": approval_id,
        "action": action,
        "actor_id": user_id,
        "actor_name": user_name,
        "details": req.comment or f"Action: {action}",
        "timestamp": now,
    }
    await db.approval_audit.insert_one(audit)

    # Notification to sender on approve/reject/cancel
    if action in ("approve", "reject", "cancel"):
        action_label = {"approve": "approved", "reject": "rejected", "cancel": "cancelled"}[action]
        await db.approval_notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": approval["sender_id"],
            "type": f"approval_{action_label}",
            "title": f"Request {action_label.capitalize()}",
            "message": f'Your request "{approval["title"]}" was {action_label} by {user_name}',
            "approval_id": approval_id,
            "read": False,
            "created_at": now,
        })

    updated = await db.approvals.find_one({"id": approval_id}, {"_id": 0})
    return {"success": True, "approval": updated}


# ============ Comments ============

@router.post("/comments/{approval_id}")
async def add_comment(approval_id: str, req: AddCommentRequest, user_id: str = Query(...), user_name: str = Query("")):
    """Add a comment to an approval."""
    comment = {
        "id": str(uuid.uuid4()),
        "approval_id": approval_id,
        "user_id": user_id,
        "user_name": user_name,
        "content": req.content,
        "attachments": req.attachments or [],
        "created_at": now_iso(),
    }
    await db.approval_comments.insert_one(comment)

    # Notify other participants about the comment
    approval = await db.approvals.find_one({"id": approval_id}, {"_id": 0})
    if approval:
        notify_ids = set()
        notify_ids.add(approval.get("sender_id", ""))
        for step in approval.get("steps", []):
            notify_ids.add(step.get("approver_id", ""))
        notify_ids.discard(user_id)  # Don't notify the commenter
        for nid in notify_ids:
            if nid:
                await db.approval_notifications.insert_one({
                    "id": str(uuid.uuid4()),
                    "user_id": nid,
                    "type": "approval_comment",
                    "title": "New Comment",
                    "message": f'{user_name} commented on "{approval.get("title", "")}"',
                    "approval_id": approval_id,
                    "read": False,
                    "created_at": now_iso(),
                })

    return {"success": True, "comment": {k: v for k, v in comment.items() if k != "_id"}}


# ============ Stats ============

@router.get("/stats")
async def get_stats(user_id: str = Query(...)):
    """Get approval statistics for dashboard."""
    received_pending = await db.approvals.count_documents({"steps.approver_id": user_id, "status": "pending"})
    sent_pending = await db.approvals.count_documents({"sender_id": user_id, "status": "pending"})
    approved = await db.approvals.count_documents({"sender_id": user_id, "status": "approved"})
    rejected = await db.approvals.count_documents({"sender_id": user_id, "status": "rejected"})
    total_sent = await db.approvals.count_documents({"sender_id": user_id})
    total_received = await db.approvals.count_documents({"steps.approver_id": user_id})

    return {
        "received_pending": received_pending,
        "sent_pending": sent_pending,
        "approved": approved,
        "rejected": rejected,
        "total_sent": total_sent,
        "total_received": total_received,
    }


# ============ Export ============

@router.get("/export")
async def export_approvals(user_id: str = Query(...), format: str = Query("csv")):
    """Export approval data as CSV."""
    approvals = await db.approvals.find(
        {"$or": [{"sender_id": user_id}, {"steps.approver_id": user_id}]}, {"_id": 0}
    ).sort("created_at", -1).to_list(1000)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Title", "Category", "Priority", "Status", "Sender", "Created", "Completed", "Workflow Type"])
    for a in approvals:
        writer.writerow([
            a.get("title", ""), a.get("category", ""), a.get("priority", ""),
            a.get("status", ""), a.get("sender_name", ""), a.get("created_at", ""),
            a.get("completed_at", ""), a.get("workflow_type", ""),
        ])

    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=approvals_export.csv"},
    )


# ============ Notifications ============

@router.get("/notifications")
async def get_notifications(user_id: str = Query(...)):
    """Get approval notifications for a user."""
    notifs = await db.approval_notifications.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    unread = sum(1 for n in notifs if not n.get("read"))
    return {"notifications": notifs, "unread_count": unread}


@router.post("/notifications/read")
async def mark_notifications_read(user_id: str = Query(...)):
    """Mark all approval notifications as read for a user."""
    await db.approval_notifications.update_many(
        {"user_id": user_id, "read": False},
        {"$set": {"read": True}}
    )
    return {"success": True}


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark a single notification as read."""
    await db.approval_notifications.update_one(
        {"id": notification_id},
        {"$set": {"read": True}}
    )
    return {"success": True}


# ============ Analytics & AI Insights ============

@router.get("/analytics")
async def get_analytics(user_id: str = Query(...)):
    """Full analytics: volume trends, category breakdown, resolution times, bottlenecks, AI insights."""
    all_approvals = await db.approvals.find(
        {"$or": [{"sender_id": user_id}, {"steps.approver_id": user_id}]}, {"_id": 0}
    ).to_list(5000)

    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)

    # --- Volume over time (last 30 days) ---
    daily_volume = {}
    for i in range(30):
        day = (thirty_days_ago + timedelta(days=i)).strftime("%Y-%m-%d")
        daily_volume[day] = {"date": day, "created": 0, "resolved": 0}

    for a in all_approvals:
        created = a.get("created_at", "")
        if created:
            day = created[:10]
            if day in daily_volume:
                daily_volume[day]["created"] += 1
        completed = a.get("completed_at")
        if completed:
            day = completed[:10] if isinstance(completed, str) else ""
            if day in daily_volume:
                daily_volume[day]["resolved"] += 1
    volume_trend = list(daily_volume.values())

    # --- Status breakdown ---
    status_counts = {}
    for a in all_approvals:
        s = a.get("status", "unknown")
        status_counts[s] = status_counts.get(s, 0) + 1
    status_breakdown = [{"status": k, "count": v} for k, v in status_counts.items()]

    # --- Category breakdown ---
    category_counts = {}
    for a in all_approvals:
        c = a.get("category", "Other")
        category_counts[c] = category_counts.get(c, 0) + 1
    category_breakdown = [{"category": k, "count": v} for k, v in category_counts.items()]

    # --- Resolution times by category ---
    cat_times = {}
    for a in all_approvals:
        if a.get("completed_at") and a.get("created_at"):
            try:
                created_dt = datetime.fromisoformat(a["created_at"].replace("Z", "+00:00"))
                completed_dt = datetime.fromisoformat(a["completed_at"].replace("Z", "+00:00"))
                hours = (completed_dt - created_dt).total_seconds() / 3600
                c = a.get("category", "Other")
                cat_times.setdefault(c, []).append(hours)
            except Exception:
                pass
    resolution_by_category = [
        {"category": k, "avg_hours": round(sum(v) / len(v), 1), "count": len(v)}
        for k, v in cat_times.items()
    ]

    # --- Summary stats ---
    total = len(all_approvals)
    approved_count = sum(1 for a in all_approvals if a.get("status") == "approved")
    rejected_count = sum(1 for a in all_approvals if a.get("status") == "rejected")
    pending_count = sum(1 for a in all_approvals if a.get("status") == "pending")
    approval_rate = round((approved_count / max(approved_count + rejected_count, 1)) * 100, 1)
    all_times = [h for v in cat_times.values() for h in v]
    avg_resolution = round(sum(all_times) / max(len(all_times), 1), 1) if all_times else 0
    most_active = max(category_counts, key=category_counts.get) if category_counts else "N/A"

    summary = {
        "total_requests": total,
        "approved": approved_count,
        "rejected": rejected_count,
        "pending": pending_count,
        "approval_rate": approval_rate,
        "avg_resolution_hours": avg_resolution,
        "most_active_category": most_active,
    }

    # --- Bottleneck detection ---
    bottlenecks = []

    # Slow approvers
    approver_times = {}
    for a in all_approvals:
        for step in a.get("steps", []):
            if step.get("status") in ("approved", "rejected") and step.get("acted_at") and a.get("created_at"):
                try:
                    created_dt = datetime.fromisoformat(a["created_at"].replace("Z", "+00:00"))
                    acted_dt = datetime.fromisoformat(step["acted_at"].replace("Z", "+00:00"))
                    hours = (acted_dt - created_dt).total_seconds() / 3600
                    aid = step.get("approver_id", "unknown")
                    aname = step.get("approver_name", "Unknown")
                    approver_times.setdefault(aid, {"name": aname, "times": []})["times"].append(hours)
                except Exception:
                    pass

    for aid, data in approver_times.items():
        avg = sum(data["times"]) / len(data["times"])
        if avg > 24:  # More than 24h average
            bottlenecks.append({
                "type": "slow_approver",
                "severity": "high" if avg > 72 else "medium",
                "approver_name": data["name"],
                "avg_hours": round(avg, 1),
                "request_count": len(data["times"]),
                "message": f'{data["name"]} takes {round(avg, 1)}h on average to respond ({len(data["times"])} requests)',
            })

    # Stuck requests (pending > 3 days)
    for a in all_approvals:
        if a.get("status") == "pending" and a.get("created_at"):
            try:
                created_dt = datetime.fromisoformat(a["created_at"].replace("Z", "+00:00"))
                age_hours = (now - created_dt).total_seconds() / 3600
                if age_hours > 72:
                    bottlenecks.append({
                        "type": "stuck_request",
                        "severity": "high" if age_hours > 168 else "medium",
                        "approval_id": a["id"],
                        "title": a.get("title", ""),
                        "age_hours": round(age_hours, 1),
                        "age_days": round(age_hours / 24, 1),
                        "message": f'"{a.get("title", "")}" has been pending for {round(age_hours / 24, 1)} days',
                    })
            except Exception:
                pass

    # --- AI Insights (data-driven, no LLM) ---
    insights = []

    # Trend
    recent_7 = sum(d["created"] for d in volume_trend[-7:])
    prev_7 = sum(d["created"] for d in volume_trend[-14:-7])
    if prev_7 > 0:
        change = round(((recent_7 - prev_7) / prev_7) * 100, 1)
        if abs(change) > 10:
            direction = "increased" if change > 0 else "decreased"
            insights.append({
                "type": "trend",
                "icon": "trending-up" if change > 0 else "trending-down",
                "title": f"Request volume {direction} {abs(change)}%",
                "detail": f"Last 7 days: {recent_7} requests vs previous 7 days: {prev_7}",
                "severity": "info" if change < 50 else "warning",
            })
    elif recent_7 > 0:
        insights.append({
            "type": "trend",
            "icon": "trending-up",
            "title": f"{recent_7} new requests in the last 7 days",
            "detail": "Approval activity is active.",
            "severity": "info",
        })

    # High rejection categories
    cat_rejections = {}
    cat_totals_for_rate = {}
    for a in all_approvals:
        c = a.get("category", "Other")
        cat_totals_for_rate[c] = cat_totals_for_rate.get(c, 0) + 1
        if a.get("status") == "rejected":
            cat_rejections[c] = cat_rejections.get(c, 0) + 1
    for c, rej in cat_rejections.items():
        t = cat_totals_for_rate.get(c, 1)
        rate = round((rej / t) * 100, 1)
        if rate > 30 and t >= 3:
            insights.append({
                "type": "rejection_rate",
                "icon": "alert-triangle",
                "title": f"High rejection rate in {c} ({rate}%)",
                "detail": f"{rej} of {t} requests rejected. Review template requirements or guidelines.",
                "severity": "warning",
            })

    # Approval rate insight
    if total >= 5:
        if approval_rate >= 90:
            insights.append({
                "type": "approval_rate",
                "icon": "check-circle",
                "title": f"Excellent approval rate: {approval_rate}%",
                "detail": "Your requests are well-prepared and consistently approved.",
                "severity": "success",
            })
        elif approval_rate < 50:
            insights.append({
                "type": "approval_rate",
                "icon": "alert-circle",
                "title": f"Low approval rate: {approval_rate}%",
                "detail": "Consider improving request details or discussing requirements with approvers.",
                "severity": "warning",
            })

    # Bottleneck insight
    if bottlenecks:
        stuck = [b for b in bottlenecks if b["type"] == "stuck_request"]
        slow = [b for b in bottlenecks if b["type"] == "slow_approver"]
        if stuck:
            insights.append({
                "type": "bottleneck",
                "icon": "alert-triangle",
                "title": f"{len(stuck)} request{'s' if len(stuck) != 1 else ''} stuck for 3+ days",
                "detail": "Consider following up with the assigned approvers.",
                "severity": "warning",
            })
        if slow:
            insights.append({
                "type": "bottleneck",
                "icon": "clock",
                "title": f"{len(slow)} approver{'s' if len(slow) != 1 else ''} with slow response times",
                "detail": "Average response time exceeds 24 hours.",
                "severity": "info",
            })

    # Peak activity
    day_counts = {}
    for a in all_approvals:
        created = a.get("created_at", "")
        if created:
            try:
                dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                day_name = dt.strftime("%A")
                day_counts[day_name] = day_counts.get(day_name, 0) + 1
            except Exception:
                pass
    if day_counts:
        peak_day = max(day_counts, key=day_counts.get)
        insights.append({
            "type": "pattern",
            "icon": "calendar",
            "title": f"Peak activity on {peak_day}s",
            "detail": f"{day_counts[peak_day]} requests created on {peak_day}s historically.",
            "severity": "info",
        })

    return {
        "volume_trend": volume_trend,
        "status_breakdown": status_breakdown,
        "category_breakdown": category_breakdown,
        "resolution_by_category": resolution_by_category,
        "summary": summary,
        "bottlenecks": bottlenecks,
        "insights": insights,
    }


@router.post("/duplicate/{approval_id}")
async def duplicate_approval(
    approval_id: str,
    user_id: str = Query(...),
    user_name: str = Query(""),
    user_email: str = Query(""),
):
    """Duplicate an existing approval as a new draft-like pending request."""
    original = await db.approvals.find_one({"id": approval_id}, {"_id": 0})
    if not original:
        raise HTTPException(status_code=404, detail="Approval not found")

    new_id = str(uuid.uuid4())
    now = now_iso()

    # Rebuild steps from original approvers
    steps = []
    for s in original.get("steps", []):
        steps.append({
            "step": s.get("step", 1),
            "approver_id": s.get("approver_id"),
            "approver_name": s.get("approver_name"),
            "approver_email": s.get("approver_email"),
            "type": s.get("type", "individual"),
            "status": "pending" if s.get("step", 1) == 1 else "waiting",
            "acted_at": None,
            "comment": None,
        })

    new_approval = {
        "id": new_id,
        "title": f"{original.get('title', '')} (Copy)",
        "template_id": original.get("template_id"),
        "category": original.get("category", "General"),
        "priority": original.get("priority", "Medium"),
        "status": "pending",
        "workflow_type": original.get("workflow_type", "single"),
        "conditions": original.get("conditions"),
        "form_data": original.get("form_data", {}),
        "steps": steps,
        "description": original.get("description", ""),
        "attachments": [],
        "linked_meeting": original.get("linked_meeting"),
        "linked_files": original.get("linked_files", []),
        "linked_chat_message": original.get("linked_chat_message"),
        "deadline": None,
        "sender_id": user_id,
        "sender_name": user_name,
        "sender_email": user_email,
        "created_at": now,
        "updated_at": now,
        "completed_at": None,
        "source": "Duplicated",
    }

    await db.approvals.insert_one(new_approval)

    audit = {
        "id": str(uuid.uuid4()),
        "approval_id": new_id,
        "action": "created",
        "actor_id": user_id,
        "actor_name": user_name,
        "details": f"Duplicated from request: {original.get('title', '')}",
        "timestamp": now,
    }
    await db.approval_audit.insert_one(audit)

    # Notify approvers
    for step in steps:
        if step["approver_id"]:
            await db.approval_notifications.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": step["approver_id"],
                "type": "approval_request",
                "title": "New Approval Request",
                "message": f"{user_name} sent you an approval request: {new_approval['title']}",
                "approval_id": new_id,
                "read": False,
                "created_at": now,
            })

    return {"success": True, "approval": {k: v for k, v in new_approval.items() if k != "_id"}}
