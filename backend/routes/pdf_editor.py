"""
PDF Editor Routes — Upload, save edits, list, and download edited PDFs.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
import uuid
import io
import os
import base64

from config import db, logger
from security import limiter
import fitz

router = APIRouter(prefix="/pdf-editor", tags=["PDF Editor"])


@router.get("/documents")
async def list_pdf_documents(user_id: str):
    """List all PDF editor documents for a user."""
    docs = await db.pdf_editor_documents.find(
        {"user_id": user_id},
        {"_id": 0, "pdf_data": 0, "edited_pdf_data": 0}
    ).sort("updated_at", -1).to_list(100)
    return {"documents": docs}


@router.post("/upload")
@limiter.limit("15/minute")
async def upload_pdf(
    request: Request,
    user_id: str = Form(...),
    file: UploadFile = File(...),
):
    """Upload a PDF for editing."""

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

    doc_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    doc = {
        "id": doc_id,
        "user_id": user_id,
        "filename": file.filename,
        "size": len(content),
        "page_count": page_count,
        "pdf_data": base64.b64encode(content).decode("utf-8"),
        "annotations": [],
        "created_at": now,
        "updated_at": now,
    }
    await db.pdf_editor_documents.insert_one(doc)

    return {
        "success": True,
        "document": {
            "id": doc_id,
            "filename": file.filename,
            "page_count": page_count,
            "size": len(content),
        }
    }


@router.get("/documents/{doc_id}")
async def get_pdf_document(doc_id: str):
    """Get a PDF document's metadata and annotations."""
    doc = await db.pdf_editor_documents.find_one(
        {"id": doc_id},
        {"_id": 0, "pdf_data": 0, "edited_pdf_data": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"document": doc}


@router.get("/documents/{doc_id}/pdf")
async def stream_pdf(doc_id: str):
    """Stream the original PDF for rendering."""
    doc = await db.pdf_editor_documents.find_one({"id": doc_id}, {"pdf_data": 1, "filename": 1})
    if not doc or not doc.get("pdf_data"):
        raise HTTPException(status_code=404, detail="Document not found")

    content = base64.b64decode(doc["pdf_data"])
    return StreamingResponse(
        io.BytesIO(content),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{doc.get("filename", "document.pdf")}"'},
    )


@router.put("/documents/{doc_id}/annotations")
async def save_annotations(doc_id: str, request: Request):
    """Save the annotations (text, drawings, signatures, highlights) for a document."""
    body = await request.json()
    annotations = body.get("annotations", [])

    result = await db.pdf_editor_documents.update_one(
        {"id": doc_id},
        {"$set": {
            "annotations": annotations,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")

    return {"success": True, "annotation_count": len(annotations)}


@router.post("/documents/{doc_id}/save-edited")
@limiter.limit("10/minute")
async def save_edited_pdf(request: Request, doc_id: str):
    """Save the final edited PDF (baked annotations) from the frontend."""
    body = await request.json()
    pdf_base64 = body.get("pdf_base64")
    if not pdf_base64:
        raise HTTPException(status_code=400, detail="Missing pdf_base64 data")

    doc = await db.pdf_editor_documents.find_one({"id": doc_id}, {"_id": 0, "filename": 1, "user_id": 1})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    edited_bytes = base64.b64decode(pdf_base64)
    edited_filename = doc["filename"].replace(".pdf", "_edited.pdf")

    await db.pdf_editor_documents.update_one(
        {"id": doc_id},
        {"$set": {
            "edited_pdf_data": pdf_base64,
            "edited_filename": edited_filename,
            "edited_size": len(edited_bytes),
            "edited_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )

    return {
        "success": True,
        "edited_document": {
            "id": doc_id,
            "filename": edited_filename,
            "size": len(edited_bytes),
        }
    }


@router.get("/documents/{doc_id}/download")
async def download_edited_pdf(doc_id: str):
    """Download the edited PDF if available, otherwise the original."""
    doc = await db.pdf_editor_documents.find_one(
        {"id": doc_id},
        {"edited_pdf_data": 1, "pdf_data": 1, "edited_filename": 1, "filename": 1}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.get("edited_pdf_data"):
        content = base64.b64decode(doc["edited_pdf_data"])
        filename = doc.get("edited_filename", "edited_document.pdf")
    else:
        content = base64.b64decode(doc["pdf_data"])
        filename = doc.get("filename", "document.pdf")

    return StreamingResponse(
        io.BytesIO(content),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.delete("/documents/{doc_id}")
async def delete_pdf_document(doc_id: str):
    """Delete a PDF editor document."""
    result = await db.pdf_editor_documents.delete_one({"id": doc_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"success": True}


# ── Templates ──

@router.get("/templates")
async def list_templates():
    """List all available PDF templates (built-in + active custom)."""
    from services.pdf_templates import TEMPLATES
    builtin = [
        {"id": t["id"], "name": t["name"], "description": t["description"],
         "category": t["category"], "icon": t["icon"], "fields": t["fields"],
         "source": "builtin"}
        for t in TEMPLATES.values()
    ]
    # Merge active custom templates
    cursor = db.custom_pdf_templates.find(
        {"is_active": True},
        {"_id": 0, "pdf_data": 0}
    ).sort("created_at", -1)
    custom = []
    async for doc in cursor:
        custom.append({
            "id": doc["id"],
            "name": doc["name"],
            "description": doc.get("description", ""),
            "category": doc.get("category", "Custom"),
            "icon": "file-text",
            "fields": doc.get("fields", []),
            "source": "custom",
            "page_count": doc.get("page_count"),
        })
    return {"templates": builtin + custom}


@router.post("/templates/{template_id}/generate")
@limiter.limit("10/minute")
async def generate_from_template(template_id: str, request: Request):
    """Generate a PDF from a built-in or custom template."""
    from services.pdf_templates import TEMPLATES, GENERATORS

    body = await request.json()
    user_id = body.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    fields = body.get("fields", {})

    # Check built-in templates first
    if template_id in TEMPLATES:
        generator = GENERATORS[template_id]
        pdf_bytes = generator(fields)
        template_name = TEMPLATES[template_id]["name"]
    else:
        # Check custom templates
        custom = await db.custom_pdf_templates.find_one({"id": template_id})
        if not custom:
            raise HTTPException(status_code=404, detail="Template not found")

        # Use the custom template's PDF as base and overlay field values
        base_pdf = base64.b64decode(custom["pdf_data"])
        pdf_doc = fitz.open(stream=base_pdf, filetype="pdf")

        # Overlay field values on the first page
        if fields and pdf_doc.page_count > 0:
            page = pdf_doc[0]
            w = page.rect.width
            y_start = 100
            for i, (label, value) in enumerate(fields.items()):
                if not value:
                    continue
                y = y_start + i * 22
                page.insert_text(
                    fitz.Point(50, y),
                    f"{label}: {value}",
                    fontsize=10, fontname="helv", color=(0.15, 0.15, 0.15),
                )

        pdf_bytes = pdf_doc.tobytes()
        pdf_doc.close()
        template_name = custom["name"]

    doc_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    filename = f"{template_name.replace(' ', '_')}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.pdf"

    temp_pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
    page_count = len(temp_pdf)
    temp_pdf.close()

    doc = {
        "id": doc_id,
        "user_id": user_id,
        "filename": filename,
        "size": len(pdf_bytes),
        "page_count": page_count,
        "pdf_data": base64.b64encode(pdf_bytes).decode("utf-8"),
        "annotations": [],
        "template_id": template_id,
        "template_name": template_name,
        "created_at": now,
        "updated_at": now,
    }
    await db.pdf_editor_documents.insert_one(doc)

    return {
        "success": True,
        "document": {
            "id": doc_id,
            "filename": filename,
            "page_count": page_count,
            "size": len(pdf_bytes),
            "template_id": template_id,
            "template_name": template_name,
        }
    }
