"""
Workspace Forms - Templates & Submissions CRUD
"""
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Query
from config import db

logger = logging.getLogger(__name__)
router = APIRouter()


# ============== Models ==============

class FormField(BaseModel):
    id: str
    label: str
    type: str  # text, date, textarea, yesno, dropdown, number
    required: bool = False
    placeholder: str = ""
    options: list = []  # for dropdown
    description: str = ""

class FormTemplateCreate(BaseModel):
    name: str
    description: str = ""
    fields: list  # List of FormField dicts
    created_by_id: str
    created_by_name: str

class FormTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    fields: Optional[list] = None
    is_active: Optional[bool] = None

class FormSubmissionCreate(BaseModel):
    template_id: str
    submitted_by_id: str
    submitted_by_name: str
    submitted_by_email: str
    responses: dict  # field_id -> value

class FormSubmissionUpdate(BaseModel):
    responses: Optional[dict] = None


# ============== Seed: Maintenance Request Form ==============

MAINTENANCE_FORM_TEMPLATE = {
    "name": "Maintenance Request Form",
    "description": "This form is to submit requests for the properties repairs. If you require purchasing items for your location or have a recommended improvement to the property, please contact your Program Manager.\n\nFor Priority 1 maintenance requests after hours, please also call your on-call manager to notify them as our maintenance team is not in 24 hours per day. Reminder, a Priority 1 rating is only for items that are extreme health and safety risk and needs addressing immediately.",
    "fields": [
        {
            "id": "date_submitted",
            "label": "Date request submitted",
            "type": "date",
            "required": True,
            "placeholder": "M/d/yyyy",
            "options": [],
            "description": "Please input date (M/d/yyyy)"
        },
        {
            "id": "staff_name",
            "label": "Staff making request",
            "type": "text",
            "required": True,
            "placeholder": "Enter your answer",
            "options": [],
            "description": ""
        },
        {
            "id": "repair_location",
            "label": "Where in the location the repair is required (include client initials and room number if applicable)",
            "type": "textarea",
            "required": True,
            "placeholder": "Enter your answer",
            "options": [],
            "description": ""
        },
        {
            "id": "behavior_concern",
            "label": "Was this repair required due to a behavior of concern for a specific client?",
            "type": "yesno",
            "required": True,
            "placeholder": "",
            "options": ["Yes", "No"],
            "description": ""
        },
        {
            "id": "priority_level",
            "label": "Priority Level",
            "type": "dropdown",
            "required": True,
            "placeholder": "Select priority",
            "options": ["Priority 1 - Extreme Health & Safety Risk", "Priority 2 - Urgent", "Priority 3 - Standard", "Priority 4 - Low / Cosmetic"],
            "description": "Priority 1 is only for items that are extreme health and safety risk and needs addressing immediately."
        },
        {
            "id": "repair_description",
            "label": "Description of repair needed",
            "type": "textarea",
            "required": True,
            "placeholder": "Please describe the repair needed in detail",
            "options": [],
            "description": ""
        }
    ],
    "is_system": True,
}


async def seed_maintenance_form(workspace_id: str, owner_id: str, owner_name: str):
    """Seed the Maintenance Request Form template if not already present."""
    existing = await db.form_templates.find_one({
        "workspace_id": workspace_id,
        "name": MAINTENANCE_FORM_TEMPLATE["name"]
    })
    if existing:
        return

    now = datetime.now(timezone.utc).isoformat()
    template = {
        "id": str(uuid.uuid4()),
        "workspace_id": workspace_id,
        **MAINTENANCE_FORM_TEMPLATE,
        "is_active": True,
        "created_by_id": owner_id,
        "created_by_name": owner_name,
        "created_at": now,
        "updated_at": now,
    }
    await db.form_templates.insert_one(template)
    logger.info(f"Seeded Maintenance Request Form for workspace {workspace_id}")


# ============== Template Endpoints ==============

@router.get("/{workspace_id}/form-templates")
async def get_form_templates(workspace_id: str, user_id: str = Query(...)):
    """Get all form templates for a workspace. Seed default if first access."""
    member = await db.workspace_members.find_one({"workspace_id": workspace_id, "user_id": user_id})
    if not member:
        raise HTTPException(status_code=403, detail="Only workspace members can view forms")

    is_admin = member.get("role") in ["owner", "admin"]

    # Seed default template on first access
    count = await db.form_templates.count_documents({"workspace_id": workspace_id})
    if count == 0:
        owner = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1, "email": 1})
        owner_name = owner.get("name", owner.get("email", "Admin")) if owner else "Admin"
        await seed_maintenance_form(workspace_id, user_id, owner_name)

    query = {"workspace_id": workspace_id}
    if not is_admin:
        query["is_active"] = True

    templates = await db.form_templates.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"templates": templates, "is_admin": is_admin}


@router.post("/{workspace_id}/form-templates")
async def create_form_template(workspace_id: str, template: FormTemplateCreate):
    """Create a form template. Only owner/admin."""
    member = await db.workspace_members.find_one({"workspace_id": workspace_id, "user_id": template.created_by_id})
    if not member or member.get("role") not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only workspace owner/admin can create templates")

    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "workspace_id": workspace_id,
        "name": template.name,
        "description": template.description,
        "fields": template.fields,
        "is_active": True,
        "is_system": False,
        "created_by_id": template.created_by_id,
        "created_by_name": template.created_by_name,
        "created_at": now,
        "updated_at": now,
    }
    await db.form_templates.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "template": doc}


@router.put("/{workspace_id}/form-templates/{template_id}")
async def update_form_template(workspace_id: str, template_id: str, update: FormTemplateUpdate, user_id: str = Query(...)):
    """Update a form template. Only owner/admin."""
    member = await db.workspace_members.find_one({"workspace_id": workspace_id, "user_id": user_id})
    if not member or member.get("role") not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only workspace owner/admin can edit templates")

    template = await db.form_templates.find_one({"id": template_id, "workspace_id": workspace_id})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    fields = {}
    if update.name is not None:
        fields["name"] = update.name
    if update.description is not None:
        fields["description"] = update.description
    if update.fields is not None:
        fields["fields"] = update.fields
    if update.is_active is not None:
        fields["is_active"] = update.is_active
    fields["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.form_templates.update_one({"id": template_id}, {"$set": fields})
    updated = await db.form_templates.find_one({"id": template_id}, {"_id": 0})
    return {"success": True, "template": updated}


@router.delete("/{workspace_id}/form-templates/{template_id}")
async def delete_form_template(workspace_id: str, template_id: str, user_id: str = Query(...)):
    """Delete a form template. Only owner/admin."""
    member = await db.workspace_members.find_one({"workspace_id": workspace_id, "user_id": user_id})
    if not member or member.get("role") not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only workspace owner/admin can delete templates")

    result = await db.form_templates.delete_one({"id": template_id, "workspace_id": workspace_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")

    # Also delete all submissions for this template
    await db.form_submissions.delete_many({"template_id": template_id, "workspace_id": workspace_id})
    return {"success": True}


# ============== Submission Endpoints ==============

@router.get("/{workspace_id}/form-submissions")
async def get_form_submissions(workspace_id: str, user_id: str = Query(...), template_id: str = Query(None)):
    """Get submissions. Admin sees all, regular user sees their own."""
    member = await db.workspace_members.find_one({"workspace_id": workspace_id, "user_id": user_id})
    if not member:
        raise HTTPException(status_code=403, detail="Only workspace members can view submissions")

    is_admin = member.get("role") in ["owner", "admin"]
    query = {"workspace_id": workspace_id}
    if template_id:
        query["template_id"] = template_id
    if not is_admin:
        query["submitted_by_id"] = user_id

    submissions = await db.form_submissions.find(query, {"_id": 0}).sort("submitted_at", -1).to_list(500)
    return {"submissions": submissions, "is_admin": is_admin}


@router.get("/{workspace_id}/form-submissions/{submission_id}")
async def get_form_submission(workspace_id: str, submission_id: str, user_id: str = Query(...)):
    """Get a single submission detail."""
    member = await db.workspace_members.find_one({"workspace_id": workspace_id, "user_id": user_id})
    if not member:
        raise HTTPException(status_code=403, detail="Access denied")

    submission = await db.form_submissions.find_one({"id": submission_id, "workspace_id": workspace_id}, {"_id": 0})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    is_admin = member.get("role") in ["owner", "admin"]
    if not is_admin and submission.get("submitted_by_id") != user_id:
        raise HTTPException(status_code=403, detail="You can only view your own submissions")

    return submission


@router.post("/{workspace_id}/form-submissions")
async def create_form_submission(workspace_id: str, sub: FormSubmissionCreate):
    """Submit a filled form."""
    member = await db.workspace_members.find_one({"workspace_id": workspace_id, "user_id": sub.submitted_by_id})
    if not member:
        raise HTTPException(status_code=403, detail="Only workspace members can submit forms")

    template = await db.form_templates.find_one({"id": sub.template_id, "workspace_id": workspace_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Form template not found")

    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "workspace_id": workspace_id,
        "template_id": sub.template_id,
        "template_name": template.get("name", ""),
        "submitted_by_id": sub.submitted_by_id,
        "submitted_by_name": sub.submitted_by_name,
        "submitted_by_email": sub.submitted_by_email,
        "responses": sub.responses,
        "submitted_at": now,
        "updated_at": now,
    }
    await db.form_submissions.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "submission": doc}


@router.put("/{workspace_id}/form-submissions/{submission_id}")
async def update_form_submission(workspace_id: str, submission_id: str, update: FormSubmissionUpdate, user_id: str = Query(...)):
    """Edit a submission. Admin or original submitter can edit."""
    member = await db.workspace_members.find_one({"workspace_id": workspace_id, "user_id": user_id})
    if not member:
        raise HTTPException(status_code=403, detail="Access denied")

    submission = await db.form_submissions.find_one({"id": submission_id, "workspace_id": workspace_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    is_admin = member.get("role") in ["owner", "admin"]
    if not is_admin and submission.get("submitted_by_id") != user_id:
        raise HTTPException(status_code=403, detail="You can only edit your own submissions")

    fields = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if update.responses is not None:
        fields["responses"] = update.responses

    await db.form_submissions.update_one({"id": submission_id}, {"$set": fields})
    updated = await db.form_submissions.find_one({"id": submission_id}, {"_id": 0})
    return {"success": True, "submission": updated}


@router.delete("/{workspace_id}/form-submissions/{submission_id}")
async def delete_form_submission(workspace_id: str, submission_id: str, user_id: str = Query(...)):
    """Delete a submission. Admin only."""
    member = await db.workspace_members.find_one({"workspace_id": workspace_id, "user_id": user_id})
    if not member or member.get("role") not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only admin can delete submissions")

    result = await db.form_submissions.delete_one({"id": submission_id, "workspace_id": workspace_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"success": True}
