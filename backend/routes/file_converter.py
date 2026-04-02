"""
File Converter API — handles format conversions between PDF, Word, Image, Excel, PPTX.
"""
import io
import os
import base64
import zipfile
import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
import fitz  # PyMuPDF
from PIL import Image

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/converter", tags=["converter"])

ALLOWED_CONVERSIONS = {
    "pdf-to-jpg", "pdf-to-png", "pdf-to-word",
    "jpg-to-pdf", "png-to-pdf", "image-to-pdf",
    "word-to-pdf", "excel-to-pdf", "pptx-to-pdf",
    "png-to-jpg", "jpg-to-png",
}

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


@router.get("/supported")
async def get_supported_conversions():
    return {
        "conversions": [
            {"id": "pdf-to-jpg", "from": "PDF", "to": "JPG", "category": "Convert from PDF"},
            {"id": "pdf-to-png", "from": "PDF", "to": "PNG", "category": "Convert from PDF"},
            {"id": "pdf-to-word", "from": "PDF", "to": "DOCX", "category": "Convert from PDF"},
            {"id": "word-to-pdf", "from": "DOCX", "to": "PDF", "category": "Convert to PDF"},
            {"id": "excel-to-pdf", "from": "XLSX", "to": "PDF", "category": "Convert to PDF"},
            {"id": "pptx-to-pdf", "from": "PPTX", "to": "PDF", "category": "Convert to PDF"},
            {"id": "jpg-to-pdf", "from": "JPG", "to": "PDF", "category": "Convert to PDF"},
            {"id": "png-to-pdf", "from": "PNG", "to": "PDF", "category": "Convert to PDF"},
            {"id": "image-to-pdf", "from": "Image", "to": "PDF", "category": "Convert to PDF"},
            {"id": "png-to-jpg", "from": "PNG", "to": "JPG", "category": "Image Converter"},
            {"id": "jpg-to-png", "from": "JPG", "to": "PNG", "category": "Image Converter"},
        ]
    }


@router.post("/convert")
async def convert_file(
    file: UploadFile = File(...),
    conversion_type: str = Form(...),
):
    if conversion_type not in ALLOWED_CONVERSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported conversion: {conversion_type}")

    file_data = await file.read()
    if len(file_data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 50MB)")

    original_name = os.path.splitext(file.filename or "file")[0]

    try:
        if conversion_type == "pdf-to-jpg":
            return _pdf_to_images(file_data, original_name, "jpeg")
        elif conversion_type == "pdf-to-png":
            return _pdf_to_images(file_data, original_name, "png")
        elif conversion_type == "pdf-to-word":
            return _pdf_to_word(file_data, original_name)
        elif conversion_type in ("jpg-to-pdf", "png-to-pdf", "image-to-pdf"):
            return _image_to_pdf(file_data, original_name)
        elif conversion_type == "word-to-pdf":
            return _word_to_pdf(file_data, original_name)
        elif conversion_type == "excel-to-pdf":
            return _excel_to_pdf(file_data, original_name)
        elif conversion_type == "pptx-to-pdf":
            return _pptx_to_pdf(file_data, original_name)
        elif conversion_type == "png-to-jpg":
            return _convert_image_format(file_data, original_name, "jpeg")
        elif conversion_type == "jpg-to-png":
            return _convert_image_format(file_data, original_name, "png")
        else:
            raise HTTPException(status_code=400, detail="Conversion not implemented")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Conversion error ({conversion_type}): {e}")
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")


# ── PDF to Images ──────────────────────────────────────────────
def _pdf_to_images(pdf_data: bytes, name: str, fmt: str):
    doc = fitz.open(stream=pdf_data, filetype="pdf")
    if len(doc) == 1:
        page = doc[0]
        pix = page.get_pixmap(dpi=200)
        ext = "jpg" if fmt == "jpeg" else "png"
        img_data = pix.tobytes(fmt)
        doc.close()
        return StreamingResponse(
            io.BytesIO(img_data),
            media_type=f"image/{fmt}",
            headers={"Content-Disposition": f'attachment; filename="{name}.{ext}"'},
        )
    # Multiple pages → zip
    buf = io.BytesIO()
    ext = "jpg" if fmt == "jpeg" else "png"
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for i, page in enumerate(doc):
            pix = page.get_pixmap(dpi=200)
            zf.writestr(f"{name}_page_{i+1}.{ext}", pix.tobytes(fmt))
    doc.close()
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{name}_images.zip"'},
    )


# ── PDF to Word ────────────────────────────────────────────────
def _pdf_to_word(pdf_data: bytes, name: str):
    from pdf2docx import Converter
    import tempfile

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_pdf:
        tmp_pdf.write(pdf_data)
        tmp_pdf_path = tmp_pdf.name

    tmp_docx_path = tmp_pdf_path.replace(".pdf", ".docx")
    try:
        cv = Converter(tmp_pdf_path)
        cv.convert(tmp_docx_path)
        cv.close()

        with open(tmp_docx_path, "rb") as f:
            docx_data = f.read()
    finally:
        for p in (tmp_pdf_path, tmp_docx_path):
            if os.path.exists(p):
                os.unlink(p)

    return StreamingResponse(
        io.BytesIO(docx_data),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{name}.docx"'},
    )


# ── Image to PDF ──────────────────────────────────────────────
def _image_to_pdf(img_data: bytes, name: str):
    doc = fitz.open()
    img = fitz.open(stream=img_data, filetype="png")  # auto-detects format
    for page_idx in range(len(img)):
        pdfbytes = img.convert_to_pdf()
        img_pdf = fitz.open("pdf", pdfbytes)
        doc.insert_pdf(img_pdf)
        break  # single image
    pdf_bytes = doc.tobytes()
    doc.close()
    img.close()
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{name}.pdf"'},
    )


# ── Word to PDF ───────────────────────────────────────────────
def _word_to_pdf(docx_data: bytes, name: str):
    from docx import Document

    doc = Document(io.BytesIO(docx_data))
    pdf = fitz.open()

    # Extract text from each paragraph and render to PDF pages
    page_text_lines = []
    max_lines_per_page = 45

    for para in doc.paragraphs:
        text = para.text.strip()
        if text:
            page_text_lines.append((text, para.style.name if para.style else "Normal"))
        else:
            page_text_lines.append(("", "Normal"))

    if not page_text_lines:
        page_text_lines = [("(Empty document)", "Normal")]

    # Render pages
    i = 0
    while i < len(page_text_lines):
        page = pdf.new_page(width=612, height=792)
        y = 50
        lines_on_page = 0

        while i < len(page_text_lines) and lines_on_page < max_lines_per_page:
            text, style = page_text_lines[i]
            fontsize = 11
            if "Heading 1" in style:
                fontsize = 18
            elif "Heading 2" in style:
                fontsize = 15
            elif "Heading" in style:
                fontsize = 13

            if text:
                # Word wrap long lines
                words = text.split()
                line = ""
                for word in words:
                    test = f"{line} {word}".strip()
                    if len(test) * fontsize * 0.45 > 500:
                        page.insert_text(fitz.Point(50, y), line, fontsize=fontsize, color=(0.1, 0.1, 0.1))
                        y += fontsize + 4
                        lines_on_page += 1
                        line = word
                        if lines_on_page >= max_lines_per_page:
                            break
                    else:
                        line = test
                if line and lines_on_page < max_lines_per_page:
                    page.insert_text(fitz.Point(50, y), line, fontsize=fontsize, color=(0.1, 0.1, 0.1))
                    y += fontsize + 6
                    lines_on_page += 1
            else:
                y += 8
                lines_on_page += 1
            i += 1

    pdf_bytes = pdf.tobytes()
    pdf.close()
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{name}.pdf"'},
    )


# ── Excel to PDF ──────────────────────────────────────────────
def _excel_to_pdf(xlsx_data: bytes, name: str):
    from openpyxl import load_workbook

    wb = load_workbook(io.BytesIO(xlsx_data), data_only=True)
    pdf = fitz.open()

    for ws in wb.worksheets:
        page = pdf.new_page(width=842, height=595)  # landscape A4
        y = 40
        page.insert_text(fitz.Point(40, y), ws.title, fontsize=14, color=(0.2, 0.15, 0.5))
        y += 24

        for row in ws.iter_rows(min_row=1, max_row=min(ws.max_row or 1, 50), values_only=True):
            cells = [str(c) if c is not None else "" for c in row]
            line = "  |  ".join(cells[:10])  # max 10 cols
            if len(line) > 120:
                line = line[:117] + "..."
            page.insert_text(fitz.Point(40, y), line, fontsize=8, color=(0.15, 0.15, 0.15))
            y += 12
            if y > 560:
                page = pdf.new_page(width=842, height=595)
                y = 40

    pdf_bytes = pdf.tobytes()
    pdf.close()
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{name}.pdf"'},
    )


# ── PPTX to PDF ──────────────────────────────────────────────
def _pptx_to_pdf(pptx_data: bytes, name: str):
    from pptx import Presentation
    from pptx.util import Emu

    prs = Presentation(io.BytesIO(pptx_data))
    slide_w = prs.slide_width or Emu(9144000)
    slide_h = prs.slide_height or Emu(6858000)
    w_pt = slide_w / 12700
    h_pt = slide_h / 12700

    pdf = fitz.open()

    for slide_num, slide in enumerate(prs.slides):
        page = pdf.new_page(width=w_pt, height=h_pt)
        # Render slide number
        page.insert_text(
            fitz.Point(w_pt - 60, h_pt - 20),
            f"Slide {slide_num + 1}",
            fontsize=8, color=(0.5, 0.5, 0.5),
        )

        y = 40
        for shape in slide.shapes:
            if shape.has_text_frame:
                for para in shape.text_frame.paragraphs:
                    text = para.text.strip()
                    if text:
                        fontsize = 11
                        color = (0.1, 0.1, 0.1)
                        if para.level == 0 and len(text) < 80:
                            fontsize = 18
                            color = (0.2, 0.15, 0.5)
                        elif para.level == 1:
                            fontsize = 14

                        if len(text) > 90:
                            text = text[:87] + "..."
                        page.insert_text(fitz.Point(40, y), text, fontsize=fontsize, color=color)
                        y += fontsize + 8
                        if y > h_pt - 40:
                            break
            if y > h_pt - 40:
                break

    pdf_bytes = pdf.tobytes()
    pdf.close()
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{name}.pdf"'},
    )


# ── Image format conversion ───────────────────────────────────
def _convert_image_format(img_data: bytes, name: str, target_fmt: str):
    img = Image.open(io.BytesIO(img_data))
    if img.mode == "RGBA" and target_fmt == "jpeg":
        img = img.convert("RGB")
    buf = io.BytesIO()
    ext = "jpg" if target_fmt == "jpeg" else "png"
    img.save(buf, format=target_fmt.upper(), quality=92)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type=f"image/{target_fmt}",
        headers={"Content-Disposition": f'attachment; filename="{name}.{ext}"'},
    )
