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
    import fitz

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
