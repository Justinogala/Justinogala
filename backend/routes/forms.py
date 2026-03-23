"""
Workspace Forms - Templates & Submissions CRUD
"""
import uuid
import logging
import asyncio
import resend
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Query
from config import db, SENDER_EMAIL

logger = logging.getLogger(__name__)
router = APIRouter()


async def send_form_submission_email(recipient_emails, template_name, submitter_name, submitter_email, responses, fields):
    """Send email notification to recipient emails when a form is submitted."""
    if not recipient_emails:
        return
    try:
        # Build response HTML
        rows = ""
        field_map = {f["id"]: f for f in (fields or [])}
        for field_id, value in responses.items():
            label = field_map.get(field_id, {}).get("label", field_id)
            rows += f'<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;color:#374151;width:40%">{label}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#6b7280">{value}</td></tr>'

        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px;border-radius:12px 12px 0 0">
                <h2 style="color:#fff;margin:0;font-size:18px">New Form Submission</h2>
                <p style="color:#c7d2fe;margin:4px 0 0;font-size:14px">{template_name}</p>
            </div>
            <div style="background:#fff;padding:20px;border:1px solid #e5e7eb;border-top:none">
                <p style="color:#374151;font-size:14px;margin:0 0 16px">
                    <strong>{submitter_name}</strong> ({submitter_email}) submitted a response.
                </p>
                <table style="width:100%;border-collapse:collapse;font-size:14px">{rows}</table>
            </div>
            <div style="background:#f9fafb;padding:12px 20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
                <p style="color:#9ca3af;font-size:12px;margin:0">Sent from Munal EchoNote AI</p>
            </div>
        </div>
        """
        params = {
            "from": SENDER_EMAIL,
            "to": recipient_emails,
            "subject": f"New Submission: {template_name} - by {submitter_name}",
            "html": html,
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Form submission email sent to {recipient_emails} for '{template_name}'")
    except Exception as e:
        logger.error(f"Failed to send form submission email: {e}")


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
    recipient_emails: list = []  # Emails that receive submissions

class FormTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    fields: Optional[list] = None
    is_active: Optional[bool] = None
    recipient_emails: Optional[list] = None

class FormSubmissionCreate(BaseModel):
    template_id: str
    submitted_by_id: str
    submitted_by_name: str
    submitted_by_email: str
    responses: dict  # field_id -> value

class FormSubmissionUpdate(BaseModel):
    responses: Optional[dict] = None


# ============== Seed: Maintenance Request Form ==============

HEALTHCARE_FORM_TEMPLATES = [
    # 1. Maintenance Request Form
    {
        "name": "Maintenance Request Form",
        "description": "This form is to submit requests for the properties repairs. If you require purchasing items for your location or have a recommended improvement to the property, please contact your Program Manager.\n\nFor Priority 1 maintenance requests after hours, please also call your on-call manager to notify them as our maintenance team is not in 24 hours per day. Reminder, a Priority 1 rating is only for items that are extreme health and safety risk and needs addressing immediately.",
        "fields": [
            {"id": "date_submitted", "label": "Date request submitted", "type": "date", "required": True, "placeholder": "M/d/yyyy", "options": [], "description": "Please input date (M/d/yyyy)"},
            {"id": "staff_name", "label": "Staff making request", "type": "text", "required": True, "placeholder": "Enter your answer", "options": [], "description": ""},
            {"id": "repair_location", "label": "Where in the location the repair is required (include client initials and room number if applicable)", "type": "textarea", "required": True, "placeholder": "Enter your answer", "options": [], "description": ""},
            {"id": "behavior_concern", "label": "Was this repair required due to a behavior of concern for a specific client?", "type": "yesno", "required": True, "placeholder": "", "options": ["Yes", "No"], "description": ""},
            {"id": "priority_level", "label": "Priority Level", "type": "dropdown", "required": True, "placeholder": "Select priority", "options": ["Priority 1 - Extreme Health & Safety Risk", "Priority 2 - Urgent", "Priority 3 - Standard", "Priority 4 - Low / Cosmetic"], "description": "Priority 1 is only for items that are extreme health and safety risk and needs addressing immediately."},
            {"id": "repair_description", "label": "Description of repair needed", "type": "textarea", "required": True, "placeholder": "Please describe the repair needed in detail", "options": [], "description": ""},
        ],
        "is_system": True, "recipient_emails": [],
    },
    # 2. Daily Log Form
    {
        "name": "Daily Log Form",
        "description": "Staff daily activity and shift log. Document client interactions, observations, activities completed, and any notable events during your shift.",
        "fields": [
            {"id": "log_date", "label": "Date", "type": "date", "required": True, "placeholder": "", "options": [], "description": ""},
            {"id": "staff_name", "label": "Staff Name", "type": "text", "required": True, "placeholder": "Enter your full name", "options": [], "description": ""},
            {"id": "shift", "label": "Shift", "type": "dropdown", "required": True, "placeholder": "Select shift", "options": ["Morning (7am-3pm)", "Afternoon (3pm-11pm)", "Overnight (11pm-7am)", "Split Shift"], "description": ""},
            {"id": "location", "label": "Location / House", "type": "text", "required": True, "placeholder": "Enter location name", "options": [], "description": ""},
            {"id": "clients_present", "label": "Clients present during shift", "type": "textarea", "required": True, "placeholder": "List client initials and status", "options": [], "description": "Use client initials only for confidentiality"},
            {"id": "activities_completed", "label": "Activities completed", "type": "textarea", "required": True, "placeholder": "List activities, outings, therapy sessions, meals, etc.", "options": [], "description": ""},
            {"id": "client_observations", "label": "Client observations and behaviors", "type": "textarea", "required": True, "placeholder": "Document any notable behaviors, mood changes, or health observations", "options": [], "description": ""},
            {"id": "medications_administered", "label": "Were all scheduled medications administered?", "type": "yesno", "required": True, "placeholder": "", "options": ["Yes", "No"], "description": ""},
            {"id": "medication_notes", "label": "Medication notes (if any missed or issues)", "type": "textarea", "required": False, "placeholder": "Explain if any medications were missed or refused", "options": [], "description": ""},
            {"id": "incidents", "label": "Any incidents or concerns to report?", "type": "yesno", "required": True, "placeholder": "", "options": ["Yes", "No"], "description": ""},
            {"id": "incident_details", "label": "Incident/Concern details", "type": "textarea", "required": False, "placeholder": "Provide details of any incidents or concerns", "options": [], "description": "If yes, also complete a separate Incident Report Form"},
            {"id": "handoff_notes", "label": "Notes for next shift", "type": "textarea", "required": False, "placeholder": "Important information for the incoming staff", "options": [], "description": ""},
        ],
        "is_system": True, "recipient_emails": [],
    },
    # 3. Incident Report Form
    {
        "name": "Incident Report Form",
        "description": "Document any incidents, injuries, near-misses, or unusual events. This form must be completed as soon as possible after the incident occurs. Notify your supervisor immediately for any serious incidents.",
        "fields": [
            {"id": "incident_date", "label": "Date of incident", "type": "date", "required": True, "placeholder": "", "options": [], "description": ""},
            {"id": "incident_time", "label": "Time of incident", "type": "text", "required": True, "placeholder": "e.g. 2:30 PM", "options": [], "description": ""},
            {"id": "reporter_name", "label": "Name of person reporting", "type": "text", "required": True, "placeholder": "Enter your full name", "options": [], "description": ""},
            {"id": "location", "label": "Location of incident", "type": "text", "required": True, "placeholder": "Specific location (building, room, area)", "options": [], "description": ""},
            {"id": "incident_type", "label": "Type of incident", "type": "dropdown", "required": True, "placeholder": "Select type", "options": ["Injury - Client", "Injury - Staff", "Behavioral Incident", "Fall", "Medication Error", "Property Damage", "Elopement/AWOL", "Altercation", "Medical Emergency", "Near Miss", "Other"], "description": ""},
            {"id": "persons_involved", "label": "Persons involved (use initials for clients)", "type": "textarea", "required": True, "placeholder": "List all persons involved with their role (staff name / client initials)", "options": [], "description": ""},
            {"id": "witnesses", "label": "Witnesses", "type": "textarea", "required": False, "placeholder": "List any witnesses", "options": [], "description": ""},
            {"id": "description", "label": "Detailed description of incident", "type": "textarea", "required": True, "placeholder": "Describe exactly what happened, in chronological order", "options": [], "description": "Include what led to the incident, what occurred, and immediate aftermath"},
            {"id": "injuries", "label": "Were there any injuries?", "type": "yesno", "required": True, "placeholder": "", "options": ["Yes", "No"], "description": ""},
            {"id": "injury_details", "label": "Injury details and first aid provided", "type": "textarea", "required": False, "placeholder": "Describe injuries and any first aid or medical treatment given", "options": [], "description": ""},
            {"id": "action_taken", "label": "Immediate action taken", "type": "textarea", "required": True, "placeholder": "What steps were taken immediately after the incident?", "options": [], "description": ""},
            {"id": "supervisor_notified", "label": "Was supervisor notified?", "type": "yesno", "required": True, "placeholder": "", "options": ["Yes", "No"], "description": ""},
            {"id": "follow_up_needed", "label": "Follow-up actions needed", "type": "textarea", "required": False, "placeholder": "Any recommended follow-up actions", "options": [], "description": ""},
        ],
        "is_system": True, "recipient_emails": [],
    },
    # 4. Client Medication Administration Record
    {
        "name": "Medication Administration Record",
        "description": "Track medication administration for clients. Complete this form each time medication is given. All fields are required for compliance.",
        "fields": [
            {"id": "admin_date", "label": "Date of administration", "type": "date", "required": True, "placeholder": "", "options": [], "description": ""},
            {"id": "admin_time", "label": "Time of administration", "type": "text", "required": True, "placeholder": "e.g. 08:00 AM", "options": [], "description": ""},
            {"id": "staff_name", "label": "Staff administering medication", "type": "text", "required": True, "placeholder": "Enter your full name", "options": [], "description": ""},
            {"id": "client_initials", "label": "Client initials", "type": "text", "required": True, "placeholder": "e.g. J.D.", "options": [], "description": "Use initials only for confidentiality"},
            {"id": "medication_name", "label": "Medication name", "type": "text", "required": True, "placeholder": "Full medication name", "options": [], "description": ""},
            {"id": "dosage", "label": "Dosage", "type": "text", "required": True, "placeholder": "e.g. 500mg, 2 tablets, 5ml", "options": [], "description": ""},
            {"id": "route", "label": "Route of administration", "type": "dropdown", "required": True, "placeholder": "Select route", "options": ["Oral", "Topical", "Injection", "Inhaler", "Eye Drops", "Ear Drops", "Sublingual", "Rectal", "Other"], "description": ""},
            {"id": "medication_taken", "label": "Was medication taken successfully?", "type": "yesno", "required": True, "placeholder": "", "options": ["Yes", "No - Refused", "No - Vomited", "No - Other reason"], "description": ""},
            {"id": "adverse_reaction", "label": "Any adverse reactions observed?", "type": "yesno", "required": True, "placeholder": "", "options": ["Yes", "No"], "description": ""},
            {"id": "reaction_details", "label": "Reaction details (if any)", "type": "textarea", "required": False, "placeholder": "Describe any adverse reactions", "options": [], "description": ""},
            {"id": "notes", "label": "Additional notes", "type": "textarea", "required": False, "placeholder": "Any other observations", "options": [], "description": ""},
        ],
        "is_system": True, "recipient_emails": [],
    },
    # 5. Vehicle/Transportation Log
    {
        "name": "Vehicle / Transportation Log",
        "description": "Log all vehicle usage for client transportation. Complete before and after each trip. Report any vehicle issues immediately.",
        "fields": [
            {"id": "trip_date", "label": "Date", "type": "date", "required": True, "placeholder": "", "options": [], "description": ""},
            {"id": "driver_name", "label": "Driver name", "type": "text", "required": True, "placeholder": "Enter your full name", "options": [], "description": ""},
            {"id": "vehicle_id", "label": "Vehicle ID / License plate", "type": "text", "required": True, "placeholder": "e.g. Van #3 or ABC-1234", "options": [], "description": ""},
            {"id": "trip_purpose", "label": "Purpose of trip", "type": "dropdown", "required": True, "placeholder": "Select purpose", "options": ["Medical Appointment", "Community Outing", "Grocery/Shopping", "Day Program Transport", "Emergency Transport", "Staff Errand", "Other"], "description": ""},
            {"id": "destination", "label": "Destination", "type": "text", "required": True, "placeholder": "Where are you going?", "options": [], "description": ""},
            {"id": "passengers", "label": "Passengers (use client initials)", "type": "textarea", "required": True, "placeholder": "List all passengers", "options": [], "description": ""},
            {"id": "odometer_start", "label": "Odometer reading - Start", "type": "number", "required": True, "placeholder": "Starting mileage", "options": [], "description": ""},
            {"id": "odometer_end", "label": "Odometer reading - End", "type": "number", "required": True, "placeholder": "Ending mileage", "options": [], "description": ""},
            {"id": "vehicle_condition", "label": "Vehicle condition", "type": "dropdown", "required": True, "placeholder": "Select condition", "options": ["Good - No issues", "Minor issue noted", "Needs maintenance", "Unsafe - Do not drive"], "description": ""},
            {"id": "condition_notes", "label": "Condition notes (if any issues)", "type": "textarea", "required": False, "placeholder": "Describe any vehicle issues", "options": [], "description": ""},
        ],
        "is_system": True, "recipient_emails": [],
    },
    # 6. Fire Drill / Emergency Drill Report
    {
        "name": "Fire Drill / Emergency Drill Report",
        "description": "Document all emergency drill results for compliance. Fire drills must be conducted monthly. Complete this form immediately after each drill.",
        "fields": [
            {"id": "drill_date", "label": "Date of drill", "type": "date", "required": True, "placeholder": "", "options": [], "description": ""},
            {"id": "drill_time", "label": "Time drill initiated", "type": "text", "required": True, "placeholder": "e.g. 10:15 AM", "options": [], "description": ""},
            {"id": "drill_type", "label": "Type of drill", "type": "dropdown", "required": True, "placeholder": "Select type", "options": ["Fire Drill", "Tornado Drill", "Earthquake Drill", "Lockdown Drill", "Evacuation Drill", "Other Emergency Drill"], "description": ""},
            {"id": "location", "label": "Location / Building", "type": "text", "required": True, "placeholder": "Enter location name", "options": [], "description": ""},
            {"id": "conducted_by", "label": "Drill conducted by", "type": "text", "required": True, "placeholder": "Staff name who initiated the drill", "options": [], "description": ""},
            {"id": "evacuation_time", "label": "Total evacuation time (minutes)", "type": "number", "required": True, "placeholder": "Time in minutes", "options": [], "description": "From alarm to all-clear"},
            {"id": "clients_present", "label": "Number of clients present", "type": "number", "required": True, "placeholder": "0", "options": [], "description": ""},
            {"id": "staff_present", "label": "Number of staff present", "type": "number", "required": True, "placeholder": "0", "options": [], "description": ""},
            {"id": "all_evacuated", "label": "Were all persons successfully evacuated?", "type": "yesno", "required": True, "placeholder": "", "options": ["Yes", "No"], "description": ""},
            {"id": "alarm_functional", "label": "Was the alarm system functional?", "type": "yesno", "required": True, "placeholder": "", "options": ["Yes", "No"], "description": ""},
            {"id": "issues_noted", "label": "Issues or concerns noted during drill", "type": "textarea", "required": False, "placeholder": "Document any problems encountered", "options": [], "description": ""},
            {"id": "corrective_actions", "label": "Corrective actions needed", "type": "textarea", "required": False, "placeholder": "What improvements should be made?", "options": [], "description": ""},
        ],
        "is_system": True, "recipient_emails": [],
    },
    # 7. Visitor Sign-In/Sign-Out Form
    {
        "name": "Visitor Sign-In / Sign-Out Form",
        "description": "All visitors must sign in upon arrival and sign out upon departure. This is required for safety and compliance purposes.",
        "fields": [
            {"id": "visit_date", "label": "Date", "type": "date", "required": True, "placeholder": "", "options": [], "description": ""},
            {"id": "visitor_name", "label": "Visitor full name", "type": "text", "required": True, "placeholder": "Enter visitor name", "options": [], "description": ""},
            {"id": "visitor_organization", "label": "Organization / Relationship", "type": "text", "required": True, "placeholder": "e.g. Family member, Therapist, Vendor", "options": [], "description": ""},
            {"id": "location", "label": "Location visiting", "type": "text", "required": True, "placeholder": "Building / House name", "options": [], "description": ""},
            {"id": "person_visiting", "label": "Person visiting (use client initials if applicable)", "type": "text", "required": True, "placeholder": "Who are you here to see?", "options": [], "description": ""},
            {"id": "purpose", "label": "Purpose of visit", "type": "dropdown", "required": True, "placeholder": "Select purpose", "options": ["Family Visit", "Medical Professional", "Therapy Session", "Case Manager Visit", "Maintenance/Repair", "Delivery", "Inspection/Survey", "Other"], "description": ""},
            {"id": "sign_in_time", "label": "Sign-in time", "type": "text", "required": True, "placeholder": "e.g. 2:00 PM", "options": [], "description": ""},
            {"id": "sign_out_time", "label": "Sign-out time", "type": "text", "required": False, "placeholder": "e.g. 3:30 PM", "options": [], "description": "Complete when leaving"},
            {"id": "staff_on_duty", "label": "Staff on duty who approved visit", "type": "text", "required": True, "placeholder": "Staff name", "options": [], "description": ""},
        ],
        "is_system": True, "recipient_emails": [],
    },
    # 8. Supply/Inventory Request Form
    {
        "name": "Supply / Inventory Request Form",
        "description": "Request supplies, equipment, or materials for your location. Submit requests at least 5 business days in advance for standard items. Emergency requests will be prioritized.",
        "fields": [
            {"id": "request_date", "label": "Date of request", "type": "date", "required": True, "placeholder": "", "options": [], "description": ""},
            {"id": "requestor_name", "label": "Requestor name", "type": "text", "required": True, "placeholder": "Enter your full name", "options": [], "description": ""},
            {"id": "location", "label": "Location / House", "type": "text", "required": True, "placeholder": "Which location needs the supplies?", "options": [], "description": ""},
            {"id": "request_urgency", "label": "Urgency", "type": "dropdown", "required": True, "placeholder": "Select urgency", "options": ["Emergency - Needed within 24hrs", "Urgent - Needed within 3 days", "Standard - Needed within 1 week", "Low - Needed within 2 weeks"], "description": ""},
            {"id": "category", "label": "Category", "type": "dropdown", "required": True, "placeholder": "Select category", "options": ["Cleaning Supplies", "Food / Kitchen", "Personal Care / Hygiene", "Office Supplies", "Medical Supplies", "Maintenance/Repair Materials", "Furniture/Equipment", "Clothing/Linens", "Recreational", "Other"], "description": ""},
            {"id": "items_requested", "label": "Items requested (include quantity)", "type": "textarea", "required": True, "placeholder": "List each item with quantity needed\ne.g.\n- Paper towels x 12 rolls\n- Hand soap x 6 bottles", "options": [], "description": ""},
            {"id": "justification", "label": "Justification / Reason for request", "type": "textarea", "required": True, "placeholder": "Why are these items needed?", "options": [], "description": ""},
            {"id": "estimated_cost", "label": "Estimated cost (if known)", "type": "number", "required": False, "placeholder": "0", "options": [], "description": "Enter estimated total cost in dollars"},
            {"id": "preferred_vendor", "label": "Preferred vendor (if any)", "type": "text", "required": False, "placeholder": "e.g. Amazon, Staples, local store", "options": [], "description": ""},
        ],
        "is_system": True, "recipient_emails": [],
    },
]


async def seed_healthcare_forms(workspace_id: str, owner_id: str, owner_name: str):
    """Seed all healthcare form templates if not already present."""
    existing_count = await db.form_templates.count_documents({"workspace_id": workspace_id, "is_system": True})
    if existing_count >= len(HEALTHCARE_FORM_TEMPLATES):
        return

    now = datetime.now(timezone.utc).isoformat()
    for tpl_data in HEALTHCARE_FORM_TEMPLATES:
        exists = await db.form_templates.find_one({"workspace_id": workspace_id, "name": tpl_data["name"]})
        if exists:
            continue
        template = {
            "id": str(uuid.uuid4()),
            "workspace_id": workspace_id,
            **tpl_data,
            "is_active": True,
            "created_by_id": owner_id,
            "created_by_name": owner_name,
            "created_at": now,
            "updated_at": now,
        }
        await db.form_templates.insert_one(template)
    logger.info(f"Seeded healthcare form templates for workspace {workspace_id}")


# ============== Template Endpoints ==============

@router.get("/{workspace_id}/form-templates")
async def get_form_templates(workspace_id: str, user_id: str = Query(...)):
    """Get all form templates for a workspace. Seed default if first access."""
    member = await db.workspace_members.find_one({"workspace_id": workspace_id, "user_id": user_id})
    if not member:
        raise HTTPException(status_code=403, detail="Only workspace members can view forms")

    is_admin = member.get("role") in ["owner", "admin"]

    # Seed default templates on first access or when templates are missing
    system_count = await db.form_templates.count_documents({"workspace_id": workspace_id, "is_system": True})
    if system_count < len(HEALTHCARE_FORM_TEMPLATES):
        owner = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1, "email": 1})
        owner_name = owner.get("name", owner.get("email", "Admin")) if owner else "Admin"
        await seed_healthcare_forms(workspace_id, user_id, owner_name)

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
        "recipient_emails": template.recipient_emails,
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
    if update.recipient_emails is not None:
        fields["recipient_emails"] = update.recipient_emails
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

    # Send email to recipient emails
    recipient_emails = template.get("recipient_emails", [])
    if recipient_emails:
        asyncio.create_task(send_form_submission_email(
            recipient_emails, template.get("name", "Form"),
            sub.submitted_by_name, sub.submitted_by_email,
            sub.responses, template.get("fields", [])
        ))

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


# ============== Admin-Level Endpoints (Org-Wide) ==============

admin_router = APIRouter()


@admin_router.get("/form-templates")
async def admin_get_all_templates():
    """Admin: Get ALL form templates across all workspaces."""
    templates = await db.form_templates.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    # Enrich with workspace names
    ws_ids = list({t.get("workspace_id") for t in templates if t.get("workspace_id")})
    ws_map = {}
    if ws_ids:
        cursor = db.workspaces.find({"id": {"$in": ws_ids}}, {"_id": 0, "id": 1, "name": 1})
        async for ws in cursor:
            ws_map[ws["id"]] = ws.get("name", "Unknown")
    for t in templates:
        t["workspace_name"] = ws_map.get(t.get("workspace_id"), "Unknown")
    return {"templates": templates}


@admin_router.post("/form-templates")
async def admin_create_template(template: FormTemplateCreate, workspace_id: str = Query(...)):
    """Admin: Create a form template for a specific workspace."""
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "workspace_id": workspace_id,
        "name": template.name,
        "description": template.description,
        "fields": template.fields,
        "is_active": True,
        "is_system": False,
        "recipient_emails": template.recipient_emails,
        "created_by_id": template.created_by_id,
        "created_by_name": template.created_by_name,
        "created_at": now,
        "updated_at": now,
    }
    await db.form_templates.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "template": doc}


@admin_router.put("/form-templates/{template_id}")
async def admin_update_template(template_id: str, update: FormTemplateUpdate):
    """Admin: Update any form template."""
    template = await db.form_templates.find_one({"id": template_id})
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
    if update.recipient_emails is not None:
        fields["recipient_emails"] = update.recipient_emails
    fields["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.form_templates.update_one({"id": template_id}, {"$set": fields})
    updated = await db.form_templates.find_one({"id": template_id}, {"_id": 0})
    return {"success": True, "template": updated}


@admin_router.delete("/form-templates/{template_id}")
async def admin_delete_template(template_id: str):
    """Admin: Delete any form template and its submissions."""
    result = await db.form_templates.delete_one({"id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    await db.form_submissions.delete_many({"template_id": template_id})
    return {"success": True}


@admin_router.get("/form-submissions")
async def admin_get_all_submissions(template_id: str = Query(None)):
    """Admin: Get ALL form submissions across all workspaces."""
    query = {}
    if template_id:
        query["template_id"] = template_id
    submissions = await db.form_submissions.find(query, {"_id": 0}).sort("submitted_at", -1).to_list(500)
    return {"submissions": submissions}


@admin_router.delete("/form-submissions/{submission_id}")
async def admin_delete_submission(submission_id: str):
    """Admin: Delete any form submission."""
    result = await db.form_submissions.delete_one({"id": submission_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"success": True}


@admin_router.get("/workspaces-list")
async def admin_get_workspaces_list():
    """Admin: Get all workspaces for dropdown selection when creating templates."""
    cursor = db.workspaces.find({}, {"_id": 0, "id": 1, "name": 1}).sort("name", 1)
    workspaces = await cursor.to_list(200)
    return {"workspaces": workspaces}
