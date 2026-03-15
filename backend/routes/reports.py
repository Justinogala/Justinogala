"""
Incident Reports (IR) and Serious Occurrence Reports (SOR) routes.
Provides CRUD operations with role-based access control.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
import uuid

from config import db, logger

router = APIRouter(prefix="/reports", tags=["Incident Reports"])


# ============== Models ==============

class PersonInvolved(BaseModel):
    full_name: str
    role: str  # staff, client, visitor
    contact_info: Optional[str] = None

class ReportCreate(BaseModel):
    workspace_id: str
    submitted_by: str  # user ID
    # Section A - Incident Details
    incident_date: str
    incident_time: str
    location: str
    department: Optional[str] = None
    incident_type: str  # injury, medication_error, property_damage, behavioural, safeguarding, near_miss, other
    incident_type_other: Optional[str] = None
    # Section B - Persons Involved
    persons_involved: List[PersonInvolved] = []
    witnesses: Optional[str] = None
    # Section C - Description
    description: str
    immediate_action: Optional[str] = None
    was_911_called: bool = False
    # Section D - Severity
    severity: str  # minor, moderate, major, critical, serious_occurrence
    # Section F - Follow-up (optional on creation)
    assigned_investigator: Optional[str] = None

class ReportUpdate(BaseModel):
    # Section A
    incident_date: Optional[str] = None
    incident_time: Optional[str] = None
    location: Optional[str] = None
    department: Optional[str] = None
    incident_type: Optional[str] = None
    incident_type_other: Optional[str] = None
    # Section B
    persons_involved: Optional[List[PersonInvolved]] = None
    witnesses: Optional[str] = None
    # Section C
    description: Optional[str] = None
    immediate_action: Optional[str] = None
    was_911_called: Optional[bool] = None
    # Section D
    severity: Optional[str] = None
    # Section F - Investigation (manager/admin only)
    assigned_investigator: Optional[str] = None
    root_cause: Optional[str] = None
    corrective_action: Optional[str] = None
    follow_up_due_date: Optional[str] = None
    status: Optional[str] = None  # open, under_review, closed
    investigation_notes: Optional[str] = None


# ============== Endpoints ==============

@router.post("")
async def create_report(report: ReportCreate):
    """Create a new incident report. Any authenticated user can submit."""
    try:
        report_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        # Get submitter info
        submitter = await db.users.find_one({"id": report.submitted_by}, {"_id": 0, "name": 1, "email": 1, "role": 1})
        
        # Determine report type
        report_type = "SOR" if report.severity == "serious_occurrence" else "IR"
        
        doc = {
            "id": report_id,
            "report_number": f"{report_type}-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{report_id[:6].upper()}",
            "report_type": report_type,
            "workspace_id": report.workspace_id,
            "submitted_by": report.submitted_by,
            "submitted_by_name": submitter.get("name") if submitter else None,
            "submitted_by_email": submitter.get("email") if submitter else None,
            # Section A
            "incident_date": report.incident_date,
            "incident_time": report.incident_time,
            "location": report.location,
            "department": report.department,
            "incident_type": report.incident_type,
            "incident_type_other": report.incident_type_other,
            # Section B
            "persons_involved": [p.dict() for p in report.persons_involved],
            "witnesses": report.witnesses,
            # Section C
            "description": report.description,
            "immediate_action": report.immediate_action,
            "was_911_called": report.was_911_called,
            # Section D
            "severity": report.severity,
            # Section E
            "attachments": [],
            # Section F
            "assigned_investigator": report.assigned_investigator,
            "root_cause": None,
            "corrective_action": None,
            "follow_up_due_date": None,
            "investigation_notes": None,
            "status": "open",
            # Metadata
            "created_at": now,
            "updated_at": now,
            "audit_log": [{
                "action": "created",
                "by": report.submitted_by,
                "by_name": submitter.get("name") if submitter else None,
                "at": now,
            }]
        }
        
        await db.incident_reports.insert_one(doc)
        doc.pop("_id", None)
        
        return {"success": True, "report": doc}
    except Exception as e:
        logger.error(f"Error creating report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def list_reports(
    workspace_id: Optional[str] = None,
    user_id: Optional[str] = None,
    user_role: Optional[str] = None,
    report_type: Optional[str] = None,  # IR, SOR
    severity: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """List reports with role-based filtering."""
    try:
        query = {}
        
        if workspace_id:
            query["workspace_id"] = workspace_id
        
        # Role-based access: staff can only see their own
        if user_role and user_role not in ["Admin", "Manager"] and user_id:
            query["submitted_by"] = user_id
        
        if report_type:
            query["report_type"] = report_type
        if severity:
            query["severity"] = severity
        if status:
            query["status"] = status
        
        total = await db.incident_reports.count_documents(query)
        skip = (page - 1) * limit
        
        reports = await db.incident_reports.find(
            query, {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        return {
            "success": True,
            "reports": reports,
            "total": total,
            "page": page,
            "pages": (total + limit - 1) // limit
        }
    except Exception as e:
        logger.error(f"Error listing reports: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_report_stats(workspace_id: Optional[str] = None):
    """Dashboard statistics for reports."""
    try:
        query = {}
        if workspace_id:
            query["workspace_id"] = workspace_id
        
        total = await db.incident_reports.count_documents(query)
        open_count = await db.incident_reports.count_documents({**query, "status": "open"})
        review_count = await db.incident_reports.count_documents({**query, "status": "under_review"})
        closed_count = await db.incident_reports.count_documents({**query, "status": "closed"})
        
        ir_count = await db.incident_reports.count_documents({**query, "report_type": "IR"})
        sor_count = await db.incident_reports.count_documents({**query, "report_type": "SOR"})
        
        critical_count = await db.incident_reports.count_documents({**query, "severity": {"$in": ["critical", "serious_occurrence"]}})
        
        # By type
        by_type = {}
        for itype in ["injury", "medication_error", "property_damage", "behavioural", "safeguarding", "near_miss", "other"]:
            c = await db.incident_reports.count_documents({**query, "incident_type": itype})
            if c > 0:
                by_type[itype] = c
        
        # By severity
        by_severity = {}
        for sev in ["minor", "moderate", "major", "critical", "serious_occurrence"]:
            c = await db.incident_reports.count_documents({**query, "severity": sev})
            if c > 0:
                by_severity[sev] = c
        
        return {
            "success": True,
            "stats": {
                "total": total,
                "open": open_count,
                "under_review": review_count,
                "closed": closed_count,
                "ir_count": ir_count,
                "sor_count": sor_count,
                "critical": critical_count,
                "by_type": by_type,
                "by_severity": by_severity,
            }
        }
    except Exception as e:
        logger.error(f"Error getting report stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{report_id}")
async def get_report(report_id: str):
    """Get a single report by ID."""
    try:
        report = await db.incident_reports.find_one({"id": report_id}, {"_id": 0})
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        return {"success": True, "report": report}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{report_id}")
async def update_report(report_id: str, update: ReportUpdate, editor_id: str = None):
    """Update a report. Manager/Admin can update status and investigation fields."""
    try:
        existing = await db.incident_reports.find_one({"id": report_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Report not found")
        
        update_data = {k: v for k, v in update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Handle persons_involved serialization
        if "persons_involved" in update_data:
            update_data["persons_involved"] = [p.dict() if hasattr(p, 'dict') else p for p in update_data["persons_involved"]]
        
        now = datetime.now(timezone.utc).isoformat()
        update_data["updated_at"] = now
        
        # Auto-detect report type change
        if "severity" in update_data:
            update_data["report_type"] = "SOR" if update_data["severity"] == "serious_occurrence" else "IR"
        
        # Add audit log entry
        editor = None
        if editor_id:
            editor = await db.users.find_one({"id": editor_id}, {"_id": 0, "name": 1})
        
        audit_entry = {
            "action": "updated",
            "by": editor_id or "unknown",
            "by_name": editor.get("name") if editor else None,
            "at": now,
            "fields_changed": list(update_data.keys())
        }
        
        await db.incident_reports.update_one(
            {"id": report_id},
            {
                "$set": update_data,
                "$push": {"audit_log": audit_entry}
            }
        )
        
        updated = await db.incident_reports.find_one({"id": report_id}, {"_id": 0})
        return {"success": True, "report": updated}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{report_id}/attachments")
async def upload_report_attachment(
    report_id: str,
    file: UploadFile = File(...),
    user_id: str = Form(...)
):
    """Upload an attachment to a report."""
    try:
        report = await db.incident_reports.find_one({"id": report_id})
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        contents = await file.read()
        if len(contents) > 20 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum 20MB.")
        
        attachment_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        # Store file in GridFS
        from motor.motor_asyncio import AsyncIOMotorGridFSBucket
        fs = AsyncIOMotorGridFSBucket(db, bucket_name="report_attachments")
        grid_id = await fs.upload_from_stream(
            file.filename,
            contents,
            metadata={
                "report_id": report_id,
                "attachment_id": attachment_id,
                "user_id": user_id,
                "content_type": file.content_type,
                "size": len(contents),
            }
        )
        
        attachment = {
            "id": attachment_id,
            "grid_id": str(grid_id),
            "filename": file.filename,
            "content_type": file.content_type,
            "size": len(contents),
            "uploaded_by": user_id,
            "uploaded_at": now,
        }
        
        await db.incident_reports.update_one(
            {"id": report_id},
            {"$push": {"attachments": attachment}}
        )
        
        return {"success": True, "attachment": attachment}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading report attachment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{report_id}/attachments/{attachment_id}")
async def download_report_attachment(report_id: str, attachment_id: str):
    """Download a report attachment."""
    try:
        from bson import ObjectId
        from fastapi.responses import StreamingResponse
        from motor.motor_asyncio import AsyncIOMotorGridFSBucket
        
        report = await db.incident_reports.find_one({"id": report_id}, {"_id": 0, "attachments": 1})
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        attachment = next((a for a in report.get("attachments", []) if a["id"] == attachment_id), None)
        if not attachment:
            raise HTTPException(status_code=404, detail="Attachment not found")
        
        fs = AsyncIOMotorGridFSBucket(db, bucket_name="report_attachments")
        grid_out = await fs.open_download_stream(ObjectId(attachment["grid_id"]))
        
        async def file_stream():
            while True:
                chunk = await grid_out.read(8192)
                if not chunk:
                    break
                yield chunk
        
        return StreamingResponse(
            file_stream(),
            media_type=attachment.get("content_type", "application/octet-stream"),
            headers={
                "Content-Disposition": f'attachment; filename="{attachment["filename"]}"',
                "Content-Length": str(attachment.get("size", 0))
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading attachment: {e}")
        raise HTTPException(status_code=500, detail=str(e))
