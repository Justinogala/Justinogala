"""
Admin Custom PDF Templates — upload branded PDFs, define fillable fields,
manage templates that appear in the user-facing PDF Editor gallery.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request
from datetime import datetime, timezone
from typing import Optional
from config import db, logger
from security import limiter
import uuid
import base64
import json
import os
import fitz

router = APIRouter(prefix="/admin/pdf-templates", tags=["Admin PDF Templates"])


@router.get("")
async def list_custom_templates():
    """List all admin-created custom templates."""
    cursor = db.custom_pdf_templates.find(
        {}, {"_id": 0, "pdf_data": 0}
    ).sort("created_at", -1)
    templates = [doc async for doc in cursor]
    return {"templates": templates, "count": len(templates)}


@router.get("/{template_id}")
async def get_custom_template(template_id: str):
    """Get a single custom template metadata (no PDF data)."""
    doc = await db.custom_pdf_templates.find_one(
        {"id": template_id}, {"_id": 0, "pdf_data": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"template": doc}


@router.post("")
@limiter.limit("10/minute")
async def create_custom_template(
    request: Request,
    name: str = Form(...),
    description: str = Form(""),
    category: str = Form("Custom"),
    fields: str = Form("[]"),
    file: UploadFile = File(...),
):
    """Upload a branded PDF and define fillable field labels."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext != ".pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    content = await file.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 25MB)")

    try:
        pdf = fitz.open(stream=content, filetype="pdf")
        page_count = len(pdf)
        pdf.close()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or corrupted PDF")

    try:
        field_list = json.loads(fields)
        if not isinstance(field_list, list):
            raise ValueError
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(status_code=400, detail="fields must be a JSON array of strings")

    template_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    doc = {
        "id": template_id,
        "name": name.strip(),
        "description": description.strip(),
        "category": category.strip() or "Custom",
        "fields": field_list,
        "original_filename": file.filename,
        "page_count": page_count,
        "size": len(content),
        "pdf_data": base64.b64encode(content).decode("utf-8"),
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    await db.custom_pdf_templates.insert_one(doc)

    return {
        "success": True,
        "template": {k: v for k, v in doc.items() if k not in ("_id", "pdf_data")},
    }


@router.put("/{template_id}")
async def update_custom_template(template_id: str, request: Request):
    """Update a custom template's metadata (name, description, category, fields, active)."""
    body = await request.json()
    update = {"updated_at": datetime.now(timezone.utc).isoformat()}
    for key in ("name", "description", "category", "fields", "is_active"):
        if key in body:
            update[key] = body[key]

    result = await db.custom_pdf_templates.update_one(
        {"id": template_id}, {"$set": update}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")

    doc = await db.custom_pdf_templates.find_one(
        {"id": template_id}, {"_id": 0, "pdf_data": 0}
    )
    return {"success": True, "template": doc}


@router.delete("/{template_id}")
async def delete_custom_template(template_id: str):
    """Delete a custom template."""
    result = await db.custom_pdf_templates.delete_one({"id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"success": True}
