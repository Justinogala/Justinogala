"""
eSignature routes — Upload PDFs/DOC/DOCX, create/manage signatures,
apply signatures to documents, and download signed copies.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
import uuid
import io
import os
import base64
import tempfile

from config import db, logger
from security import limiter

router = APIRouter(prefix="/esignature", tags=["esignature"])

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}


def convert_doc_to_pdf(content: bytes, filename: str) -> bytes:
    """Convert DOC/DOCX to PDF using mammoth + weasyprint."""
    import mammoth
    import weasyprint

    ext = os.path.splitext(filename)[1].lower()
    if ext not in {".doc", ".docx"}:
        raise HTTPException(status_code=400, detail="Only DOC and DOCX files are supported")

    try:
        result = mammoth.convert_to_html(io.BytesIO(content))
        html_body = result.value

        full_html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
body {{ font-family: sans-serif; margin: 40px; line-height: 1.6; color: #222; }}
h1 {{ font-size: 24px; margin-bottom: 12px; }}
h2 {{ font-size: 20px; margin-bottom: 10px; }}
h3 {{ font-size: 16px; margin-bottom: 8px; }}
p {{ margin-bottom: 8px; }}
table {{ border-collapse: collapse; width: 100%; margin: 12px 0; }}
th, td {{ border: 1px solid #ccc; padding: 6px 10px; text-align: left; }}
img {{ max-width: 100%; }}
ul, ol {{ margin-left: 20px; margin-bottom: 8px; }}
</style></head><body>{html_body}</body></html>"""

        pdf_bytes = weasyprint.HTML(string=full_html).write_pdf()
        return pdf_bytes
    except Exception as e:
        logger.error(f"DOCX to PDF conversion failed: {e}")
        raise HTTPException(status_code=500, detail="Document conversion failed")


def convert_pdf_to_docx(content: bytes) -> bytes:
    """Convert PDF to DOCX using PyMuPDF + python-docx."""
    import fitz
    from docx import Document
    from docx.shared import Pt
    doc = Document()
    style = doc.styles['Normal']
    style.font.name = 'Calibri'
    style.font.size = Pt(11)
    pdf = fitz.open(stream=content, filetype="pdf")
    for page in pdf:
        text = page.get_text()
        for line in text.split('\n'):
            if line.strip():
                doc.add_paragraph(line)
    pdf.close()
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


# ============ Signature CRUD ============

@router.get("/signatures")
async def list_signatures(user_id: str):
    """List saved signatures for a user."""
    sigs = await db.esignatures.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    return {"signatures": sigs}


@router.post("/signatures")
async def save_signature(
    user_id: str = Form(...),
    name: str = Form("My Signature"),
    sig_type: str = Form("draw"),
    data_url: str = Form(...),
):
    """Save a signature (base64 data URL from canvas/typed/uploaded)."""
    sig = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": name,
        "type": sig_type,
        "data_url": data_url,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.esignatures.insert_one(sig)
    sig.pop("_id", None)
    return {"success": True, "signature": sig}


@router.delete("/signatures/{sig_id}")
async def delete_signature(sig_id: str):
    """Delete a saved signature."""
    result = await db.esignatures.delete_one({"id": sig_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Signature not found")
    return {"success": True}


# ============ Standalone Word to PDF ============

@router.post("/convert-to-pdf")
@limiter.limit("10/minute")
async def convert_word_to_pdf(request: Request, file: UploadFile = File(...), user_id: str = Form("")):
    """Convert a DOC/DOCX file to PDF and return the PDF directly."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in {".doc", ".docx"}:
        raise HTTPException(status_code=400, detail="Only DOC and DOCX files are supported")

    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 20MB)")

    pdf_bytes = convert_doc_to_pdf(content, file.filename)
    pdf_name = os.path.splitext(file.filename)[0] + ".pdf"

    # Save to conversion history
    if user_id:
        history_entry = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "conversion_type": "word-to-pdf",
            "original_filename": file.filename,
            "converted_filename": pdf_name,
            "original_size": len(content),
            "converted_size": len(pdf_bytes),
            "file_data": base64.b64encode(pdf_bytes).decode("utf-8"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.conversion_history.insert_one(history_entry)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{pdf_name}"'},
    )


# ============ Standalone PDF to Word ============

@router.post("/convert-to-word")
@limiter.limit("10/minute")
async def convert_pdf_to_word(request: Request, file: UploadFile = File(...), user_id: str = Form("")):
    """Convert a PDF file to DOCX and return the DOCX directly."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext != ".pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 20MB)")

    docx_bytes = convert_pdf_to_docx(content)
    docx_name = os.path.splitext(file.filename)[0] + ".docx"

    # Save to conversion history
    if user_id:
        history_entry = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "conversion_type": "pdf-to-word",
            "original_filename": file.filename,
            "converted_filename": docx_name,
            "original_size": len(content),
            "converted_size": len(docx_bytes),
            "file_data": base64.b64encode(docx_bytes).decode("utf-8"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.conversion_history.insert_one(history_entry)

    return StreamingResponse(
        io.BytesIO(docx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{docx_name}"'},
    )


# ============ Document Upload ============

@router.post("/upload")
@limiter.limit("15/minute")
async def upload_document(
    request: Request,
    user_id: str = Form(...),
    file: UploadFile = File(...),
):
    """Upload a PDF, DOC, or DOCX for signing. Converts DOC/DOCX to PDF automatically."""
    import fitz

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF, DOC, and DOCX files are supported")

    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 20MB)")

    converted = False
    if ext in {".doc", ".docx"}:
        content = convert_doc_to_pdf(content, file.filename)
        converted = True

    try:
        pdf = fitz.open(stream=content, filetype="pdf")
        page_count = len(pdf)
        pdf.close()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or corrupted document")

    doc_id = str(uuid.uuid4())
    original_filename = file.filename
    pdf_filename = os.path.splitext(original_filename)[0] + ".pdf" if converted else original_filename

    doc = {
        "id": doc_id,
        "user_id": user_id,
        "filename": pdf_filename,
        "original_filename": original_filename,
        "content_type": "application/pdf",
        "size": len(content),
        "page_count": page_count,
        "pdf_data": base64.b64encode(content).decode("utf-8"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "signed": False,
        "converted": converted,
    }
    await db.esignature_documents.insert_one(doc)

    return {
        "success": True,
        "document": {
            "id": doc_id,
            "filename": pdf_filename,
            "original_filename": original_filename,
            "page_count": page_count,
            "size": len(content),
            "converted": converted,
        }
    }


@router.get("/documents/{doc_id}/pdf")
async def get_document_pdf(doc_id: str):
    """Stream the original PDF for rendering."""
    doc = await db.esignature_documents.find_one({"id": doc_id}, {"pdf_data": 1})
    if not doc or not doc.get("pdf_data"):
        raise HTTPException(status_code=404, detail="Document not found")

    content = base64.b64decode(doc["pdf_data"])
    return StreamingResponse(
        io.BytesIO(content),
        media_type="application/pdf",
        headers={"Content-Disposition": 'inline; filename="document.pdf"'}
    )


# ============ Sign Document ============

@router.post("/sign")
@limiter.limit("10/minute")
async def sign_document(
    request: Request,
    doc_id: str = Form(...),
    user_id: str = Form(...),
    user_name: str = Form(""),
    user_email: str = Form(""),
    signature_data_url: str = Form(...),
    placements: str = Form(...),
):
    """
    Apply signature(s) to a PDF.
    placements: JSON string of [{page, x, y, width, height, type}]
    """
    import fitz
    import json

    doc_record = await db.esignature_documents.find_one({"id": doc_id})
    if not doc_record:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        placement_list = json.loads(placements)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid placements JSON")

    if not placement_list:
        raise HTTPException(status_code=400, detail="No signature placements provided")

    # Decode original PDF
    pdf_bytes = base64.b64decode(doc_record["pdf_data"])
    pdf = fitz.open(stream=pdf_bytes, filetype="pdf")

    # Decode signature image
    sig_header, sig_b64 = signature_data_url.split(",", 1) if "," in signature_data_url else ("", signature_data_url)
    # Ensure proper base64 padding
    sig_b64 += "=" * (-len(sig_b64) % 4)
    sig_bytes = base64.b64decode(sig_b64)

    # Apply each placement
    for p in placement_list:
        page_num = int(p.get("page", 0))
        if page_num < 0 or page_num >= len(pdf):
            continue

        page = pdf[page_num]
        page_rect = page.rect

        # Coordinates from frontend are percentages (0-1) of page dimensions
        x = float(p.get("x", 0)) * page_rect.width
        y = float(p.get("y", 0)) * page_rect.height
        w = float(p.get("width", 0.2)) * page_rect.width
        h = float(p.get("height", 0.08)) * page_rect.height

        sig_rect = fitz.Rect(x, y, x + w, y + h)

        if p.get("type") == "date":
            # Insert date text
            date_text = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            page.insert_textbox(sig_rect, date_text, fontsize=10, align=fitz.TEXT_ALIGN_LEFT)
        elif p.get("type") == "text":
            text = p.get("text", "")
            page.insert_textbox(sig_rect, text, fontsize=10, align=fitz.TEXT_ALIGN_LEFT)
        else:
            # Insert signature image
            page.insert_image(sig_rect, stream=sig_bytes)

    # Save signed PDF
    signed_buf = io.BytesIO()
    pdf.save(signed_buf)
    pdf.close()
    signed_buf.seek(0)
    signed_bytes = signed_buf.read()
    signed_b64 = base64.b64encode(signed_bytes).decode("utf-8")

    # Update document record
    signed_filename = doc_record["filename"].replace(".pdf", "_signed.pdf")
    await db.esignature_documents.update_one(
        {"id": doc_id},
        {"$set": {
            "signed": True,
            "signed_pdf_data": signed_b64,
            "signed_filename": signed_filename,
            "signed_at": datetime.now(timezone.utc).isoformat(),
            "signed_by": user_name or user_id,
        }}
    )

    # Save to signing history
    history_entry = {
        "id": str(uuid.uuid4()),
        "doc_id": doc_id,
        "user_id": user_id,
        "user_name": user_name,
        "user_email": user_email,
        "filename": doc_record["filename"],
        "signed_filename": signed_filename,
        "page_count": doc_record.get("page_count", 0),
        "placements_count": len(placement_list),
        "signed_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.esignature_history.insert_one(history_entry)

    # Also save to file manager (chat_files) for user access
    from motor.motor_asyncio import AsyncIOMotorGridFSBucket
    fs = AsyncIOMotorGridFSBucket(db, bucket_name="chat_files")
    grid_id = await fs.upload_from_stream(
        signed_filename,
        io.BytesIO(signed_bytes),
        metadata={
            "user_id": user_id,
            "content_type": "application/pdf",
            "category": "esignature",
            "original_name": doc_record["filename"],
        }
    )

    return {
        "success": True,
        "signed_document": {
            "id": doc_id,
            "filename": signed_filename,
            "size": len(signed_bytes),
            "file_manager_id": str(grid_id),
        }
    }


@router.get("/documents/{doc_id}/signed")
async def download_signed_pdf(doc_id: str):
    """Download the signed version of a document."""
    doc = await db.esignature_documents.find_one(
        {"id": doc_id}, {"signed_pdf_data": 1, "signed_filename": 1, "signed": 1}
    )
    if not doc or not doc.get("signed"):
        raise HTTPException(status_code=404, detail="Signed document not found")

    content = base64.b64decode(doc["signed_pdf_data"])
    filename = doc.get("signed_filename", "signed_document.pdf")
    return StreamingResponse(
        io.BytesIO(content),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


# ============ History ============

@router.get("/history")
async def get_signing_history(user_id: str):
    """Get signing history for a user."""
    history = await db.esignature_history.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("signed_at", -1).to_list(100)
    return {"history": history}


@router.delete("/history/{entry_id}")
async def delete_signing_history(entry_id: str):
    """Delete a signing history entry."""
    result = await db.esignature_history.delete_one({"id": entry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="History entry not found")
    return {"success": True}



# ============ Conversion History ============

@router.get("/conversion-history")
async def get_conversion_history(user_id: str):
    """Get file conversion history for a user."""
    history = await db.conversion_history.find(
        {"user_id": user_id}, {"_id": 0, "file_data": 0}
    ).sort("created_at", -1).to_list(100)
    return {"history": history}


@router.get("/conversion-history/{entry_id}/download")
async def download_conversion(entry_id: str):
    """Download a previously converted file."""
    entry = await db.conversion_history.find_one(
        {"id": entry_id}, {"_id": 0, "file_data": 1, "converted_filename": 1, "conversion_type": 1}
    )
    if not entry or not entry.get("file_data"):
        raise HTTPException(status_code=404, detail="Conversion not found")

    content = base64.b64decode(entry["file_data"])
    mime = "application/pdf" if entry["conversion_type"] == "word-to-pdf" else \
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    return StreamingResponse(
        io.BytesIO(content),
        media_type=mime,
        headers={"Content-Disposition": f'attachment; filename="{entry["converted_filename"]}"'},
    )


@router.delete("/conversion-history/{entry_id}")
async def delete_conversion(entry_id: str):
    """Delete a conversion history entry."""
    result = await db.conversion_history.delete_one({"id": entry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"success": True}
