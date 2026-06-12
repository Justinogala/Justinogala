"""
AI Chat routes - GPT-5.2 powered conversational AI with streaming, file upload, and voice input.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Query
from fastapi.responses import StreamingResponse, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timezone
from typing import Optional
import uuid
import json
import os
import asyncio
import requests
import tempfile

from dotenv import load_dotenv
load_dotenv()

from config import db, logger
from routes.auth import get_current_user

router = APIRouter(prefix="/ai-chat", tags=["AI Chat"])

# ============== Object Storage (reuse from chat.py) ==============
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "munal-aichat"
_storage_key = None

def _init_storage():
    global _storage_key
    if _storage_key:
        return _storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        _storage_key = resp.json()["storage_key"]
        return _storage_key
    except Exception as e:
        logger.error(f"AI Chat storage init failed: {e}")
        return None

def _put_object(path, data, content_type):
    key = _init_storage()
    if not key:
        raise Exception("Storage not initialized")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def _get_object(path):
    key = _init_storage()
    if not key:
        raise Exception("Storage not initialized")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ============== System Prompt ==============
SYSTEM_PROMPT = """You are Munal AI Assistant, a helpful and knowledgeable AI powered by GPT-5.2. You are part of the Munal AI platform — an all-in-one AI-powered workforce and meeting companion built by Jiffix Inc.

You can help with:
- General questions on any topic (coding, writing, math, science, business, etc.)
- Meeting preparation, agendas, and follow-up action items
- Summarizing documents, notes, and transcriptions
- Writing emails, reports, proposals, and professional documents
- Brainstorming ideas and strategic planning
- Technical problem-solving and code assistance
- Data analysis and interpretation
- Analyzing uploaded images, PDFs, and spreadsheets
- Generating images from text descriptions
- Creating charts (pie charts, bar charts) from data
- Creating downloadable documents (PDF, DOCX, XLSX)

When a user asks you to generate an image, respond with the tag [GENERATE_IMAGE: description] where description is the detailed image prompt.
When a user asks you to create a pie chart, respond with the tag [GENERATE_PIE_CHART: {"title":"Chart Title","labels":["A","B","C"],"values":[30,50,20],"colors":["#7c3aed","#3b82f6","#10b981"]}] — provide valid JSON with title, labels, values, and optional colors array.
When a user asks you to create a bar chart, respond with the tag [GENERATE_BAR_CHART: {"title":"Chart Title","labels":["A","B","C"],"values":[30,50,20],"colors":["#7c3aed","#3b82f6","#10b981"]}] — provide valid JSON with title, labels, values, and optional colors array.
When a user asks you to create a line chart or trend chart, respond with the tag [GENERATE_LINE_CHART: {"title":"Chart Title","labels":["Jan","Feb","Mar"],"datasets":[{"name":"Revenue","values":[100,150,200],"color":"#7c3aed"},{"name":"Costs","values":[80,90,110],"color":"#ef4444"}]}] — supports multiple series via datasets array.
When a user asks you to create a stacked bar chart, respond with the tag [GENERATE_STACKED_BAR_CHART: {"title":"Chart Title","labels":["Q1","Q2","Q3"],"datasets":[{"name":"Product A","values":[30,40,50],"color":"#7c3aed"},{"name":"Product B","values":[20,30,25],"color":"#3b82f6"}]}] — multiple datasets stacked.
When a user asks you to create a radar chart or spider chart, respond with the tag [GENERATE_RADAR_CHART: {"title":"Chart Title","labels":["Speed","Power","Range","Defense","Health"],"datasets":[{"name":"Player 1","values":[80,90,70,60,85],"color":"#7c3aed"}]}] — needs at least 3 axes.
When a user asks you to create/generate/export a PDF document, include [GENERATE_PDF] at the end of your response — the system will auto-convert your response to a downloadable PDF.
When a user asks you to create/generate/export a Word/DOCX document, include [GENERATE_DOCX] at the end of your response.
When a user asks you to create/generate/export an Excel/spreadsheet, include [GENERATE_XLSX] at the end of your response.

Be concise, accurate, and helpful. Use markdown formatting when appropriate (headers, lists, code blocks, bold, etc.). When writing code, always specify the language for syntax highlighting."""


# ============== File Processing Utilities ==============
# Imported from ai_chat_files.py module
from routes.ai_chat_files import (
    extract_pdf_text, extract_excel_data, encode_image_base64,
    extract_file_content, generate_pdf_from_markdown,
    generate_docx_from_markdown, generate_xlsx_from_text,
    generate_pie_chart, generate_bar_chart,
    generate_line_chart, generate_stacked_bar_chart, generate_radar_chart,
)

# Keep aliases for internal use
_extract_pdf_text = extract_pdf_text
_extract_excel_data = extract_excel_data
_encode_image_base64 = encode_image_base64


async def _extract_file_content(attachment: dict) -> tuple:
    """Extract content from an uploaded file attachment, looking up the real storage path from DB."""
    try:
        file_id = attachment.get("file_id")
        filename = attachment.get("filename") or attachment.get("original_filename", "")
        content_type = attachment.get("content_type", "")

        if not file_id:
            return f"[File: {filename}]", None

        # Look up the actual storage path from the DB record
        record = await db.ai_chat_files.find_one({"id": file_id}, {"_id": 0})
        if not record:
            logger.warning(f"File record not found for id={file_id}")
            return f"[File: {filename} — could not be read]", None

        storage_path = record.get("storage_path", "")
        content_type = content_type or record.get("content_type", "")
        filename = filename or record.get("original_filename", "file")

        try:
            file_bytes, _ = _get_object(storage_path)
        except Exception as e:
            logger.error(f"Failed to read file from storage: {storage_path} — {e}")
            return f"[File: {filename} — storage read error]", None

        if content_type.startswith("image/"):
            img_b64 = _encode_image_base64(file_bytes)
            return f"[Image: {filename}]", f"data:{content_type};base64,{img_b64}"

        ext = filename.lower().split(".")[-1] if "." in filename else ""

        if content_type == "application/pdf" or ext == "pdf":
            text = _extract_pdf_text(file_bytes)
            return f"[PDF: {filename}]\n{text}", None

        if content_type in ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel") or ext in ("xlsx", "xls"):
            text = _extract_excel_data(file_bytes)
            return f"[Spreadsheet: {filename}]\n{text}", None

        if content_type.startswith("text/") or ext in ("txt", "csv", "json", "md", "py", "js", "ts", "html", "css"):
            text = file_bytes.decode("utf-8", errors="replace")[:8000]
            return f"[File: {filename}]\n{text}", None

        if content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" or ext == "docx":
            try:
                from docx import Document as DocxDocument
                import io
                doc = DocxDocument(io.BytesIO(file_bytes))
                text = "\n".join([p.text for p in doc.paragraphs[:100]])[:8000]
                return f"[Document: {filename}]\n{text}", None
            except Exception as e:
                return f"[Document: {filename} — could not read: {e}]", None

        return f"[Attached file: {filename} ({content_type})]", None
    except Exception as e:
        logger.error(f"File extraction error: {e}")
        return f"[Error reading file: {str(e)}]", None

# ============== Conversations CRUD ==============

@router.post("/conversations")
async def create_conversation(user: dict = Depends(get_current_user)):
    conv = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "title": "New Chat",
        "pinned": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.ai_conversations.insert_one(conv)
    conv.pop("_id", None)
    return conv


@router.get("/conversations")
async def list_conversations(user: dict = Depends(get_current_user)):
    cursor = db.ai_conversations.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort([("pinned", -1), ("updated_at", -1)])
    return await cursor.to_list(length=100)


# ============== Search Conversations ==============

@router.get("/conversations/search")
async def search_conversations(q: str = Query(..., min_length=1), user: dict = Depends(get_current_user)):
    query = q.strip()
    if not query:
        return []

    # Search by conversation title
    title_matches = await db.ai_conversations.find(
        {"user_id": user["id"], "title": {"$regex": query, "$options": "i"}},
        {"_id": 0}
    ).sort([("pinned", -1), ("updated_at", -1)]).to_list(length=50)
    title_ids = {c["id"] for c in title_matches}

    # Search by message content
    msg_matches = await db.ai_messages.find(
        {"content": {"$regex": query, "$options": "i"}},
        {"_id": 0, "conversation_id": 1}
    ).to_list(length=200)
    msg_conv_ids = {m["conversation_id"] for m in msg_matches} - title_ids

    # Fetch conversations for message matches
    content_matches = []
    if msg_conv_ids:
        content_matches = await db.ai_conversations.find(
            {"id": {"$in": list(msg_conv_ids)}, "user_id": user["id"]},
            {"_id": 0}
        ).sort("updated_at", -1).to_list(length=50)

    return title_matches + content_matches


# ============== Pin/Unpin Conversation ==============

@router.patch("/conversations/{conv_id}/pin")
async def toggle_pin_conversation(conv_id: str, user: dict = Depends(get_current_user)):
    conv = await db.ai_conversations.find_one({"id": conv_id, "user_id": user["id"]}, {"_id": 0, "id": 1, "pinned": 1})
    if not conv or "id" not in conv:
        raise HTTPException(404, "Conversation not found")
    new_pinned = not conv.get("pinned", False)
    await db.ai_conversations.update_one(
        {"id": conv_id},
        {"$set": {"pinned": new_pinned}}
    )
    return {"pinned": new_pinned}


@router.get("/conversations/{conv_id}")
async def get_conversation(conv_id: str, user: dict = Depends(get_current_user)):
    conv = await db.ai_conversations.find_one(
        {"id": conv_id, "user_id": user["id"]}, {"_id": 0}
    )
    if not conv:
        raise HTTPException(404, "Conversation not found")
    messages = await db.ai_messages.find(
        {"conversation_id": conv_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(length=500)
    conv["messages"] = messages
    return conv


@router.patch("/conversations/{conv_id}")
async def rename_conversation(conv_id: str, body: dict, user: dict = Depends(get_current_user)):
    title = body.get("title", "").strip()
    if not title:
        raise HTTPException(400, "Title required")
    result = await db.ai_conversations.update_one(
        {"id": conv_id, "user_id": user["id"]},
        {"$set": {"title": title, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Conversation not found")
    return {"status": "ok"}


@router.delete("/conversations/{conv_id}")
async def delete_conversation(conv_id: str, user: dict = Depends(get_current_user)):
    result = await db.ai_conversations.delete_one({"id": conv_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(404, "Conversation not found")
    await db.ai_messages.delete_many({"conversation_id": conv_id})
    return {"status": "deleted"}


# ============== Send Message (Streaming) ==============

@router.post("/conversations/{conv_id}/messages")
async def send_message(conv_id: str, body: dict, user: dict = Depends(get_current_user)):
    conv = await db.ai_conversations.find_one({"id": conv_id, "user_id": user["id"]})
    if not conv:
        raise HTTPException(404, "Conversation not found")

    user_text = body.get("content", "").strip()
    attachments = body.get("attachments", [])

    if not user_text and not attachments:
        raise HTTPException(400, "Message content required")

    # Save user message
    user_msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "role": "user",
        "content": user_text,
        "attachments": attachments,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.ai_messages.insert_one(user_msg)

    # Build message history for LLM
    history = await db.ai_messages.find(
        {"conversation_id": conv_id, "role": {"$in": ["user", "assistant"]}},
        {"_id": 0, "role": 1, "content": 1}
    ).sort("created_at", 1).to_list(length=50)

    # Auto-title on first user message
    msg_count = await db.ai_messages.count_documents({"conversation_id": conv_id, "role": "user"})
    if msg_count == 1 and user_text:
        short_title = user_text[:60] + ("..." if len(user_text) > 60 else "")
        await db.ai_conversations.update_one(
            {"id": conv_id}, {"$set": {"title": short_title}}
        )

    assistant_msg_id = str(uuid.uuid4())

    async def stream_response():
        from llm_client import chat_completion

        full_response = ""
        try:
            yield f"data: {json.dumps({'type': 'thinking'})}\n\n"

            # Build conversation messages in OpenAI format
            llm_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            for msg in history[-20:]:
                llm_messages.append({"role": msg["role"], "content": msg["content"]})

            # Process file attachments for current message
            current_content = user_text
            image_urls = []
            if attachments:
                file_texts = []
                for att in attachments:
                    text, img_data = await _extract_file_content(att)
                    file_texts.append(text)
                    if img_data:
                        image_urls.append(img_data)
                current_content += "\n\n" + "\n".join(file_texts)

            # Build current user message - use vision format if images present
            if image_urls:
                content_parts = [{"type": "text", "text": current_content}]
                for img_url in image_urls:
                    content_parts.append({"type": "image_url", "image_url": {"url": img_url, "detail": "auto"}})
                # Ensure last message is multimodal
                if llm_messages and llm_messages[-1]["role"] == "user":
                    llm_messages[-1]["content"] = content_parts
                else:
                    llm_messages.append({"role": "user", "content": content_parts})
            else:
                if llm_messages and llm_messages[-1]["role"] == "user":
                    llm_messages[-1]["content"] = current_content
                else:
                    llm_messages.append({"role": "user", "content": current_content})

            # Real streaming call via OpenAI SDK
            response = chat_completion(
                messages=llm_messages,
                model="gpt-5.2",
                api_key=EMERGENT_KEY,
                stream=True,
            )

            for chunk in response:
                delta = chunk.choices[0].delta if chunk.choices else None
                if delta and delta.content:
                    full_response += delta.content
                    yield f"data: {json.dumps({'type': 'chunk', 'content': delta.content})}\n\n"

        except Exception as e:
            logger.error(f"AI Chat streaming error: {e}")
            full_response = "I'm sorry, I encountered an error processing your request. Please try again."
            yield f"data: {json.dumps({'type': 'chunk', 'content': full_response})}\n\n"

        # Save assistant message
        assistant_msg = {
            "id": assistant_msg_id,
            "conversation_id": conv_id,
            "role": "assistant",
            "content": full_response,
            "attachments": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        # Detect and handle generation tags
        generated_files = []
        import re

        async def _store_generated_metadata(file_info, conv_id, user_id, file_size=0):
            """Store file generation metadata in MongoDB for tracking/cleanup."""
            await db.ai_generated_files.insert_one({
                "id": file_info.get("file_id", str(uuid.uuid4())),
                "conversation_id": conv_id,
                "user_id": user_id,
                "type": file_info.get("type"),
                "filename": file_info.get("filename"),
                "content_type": file_info.get("content_type"),
                "storage_path": f"ai-generated/{file_info.get('file_id', '')}.{file_info.get('type', 'bin')}",
                "file_size": file_size,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            # Check quota and send email alerts if thresholds crossed
            try:
                from routes.storage_quotas import check_and_alert_quota
                await check_and_alert_quota(user_id)
            except Exception as e:
                logger.warning(f"Quota alert check failed: {e}")

        async def _check_user_quota():
            """Check if user has storage quota remaining."""
            from routes.storage_quotas import check_quota
            quota = await check_quota(user["id"])
            return quota["can_generate"], quota["remaining_formatted"]

        def _extract_chart_json(tag_name, text):
            """Extract balanced JSON from a [TAG: {...}] pattern handling nested braces."""
            marker = f"[{tag_name}:"
            start = text.find(marker)
            if start == -1:
                return None, text
            json_start = text.index("{", start)
            depth = 0
            for i in range(json_start, len(text)):
                if text[i] == "{": depth += 1
                elif text[i] == "}": depth -= 1
                if depth == 0:
                    json_str = text[json_start:i+1]
                    # Find the closing ]
                    end = text.find("]", i+1)
                    if end == -1: end = i + 1
                    clean_text = text[:start] + text[end+1:]
                    try:
                        return json.loads(json_str), clean_text.strip()
                    except json.JSONDecodeError:
                        return None, text
            return None, text

        # Image generation
        img_match = re.search(r'\[GENERATE_IMAGE:\s*(.+?)\]', full_response)
        if img_match:
            can_gen, remaining = await _check_user_quota()
            if not can_gen:
                full_response = re.sub(r'\[GENERATE_IMAGE:\s*.+?\]', '', full_response).strip()
                full_response += f"\n\n*Storage quota exceeded ({remaining} remaining). Upgrade your plan to generate more files.*"
            else:
                img_prompt = img_match.group(1)
                try:
                    yield f"data: {json.dumps({'type': 'status', 'content': 'Generating image...'})}\n\n"
                    from llm_client import get_client
                    client = get_client(EMERGENT_KEY)
                    img_resp = client.images.generate(
                        model="gpt-image-1",
                        prompt=img_prompt,
                        n=1,
                        size="1024x1024",
                    )
                    if img_resp.data and img_resp.data[0].b64_json:
                        import base64 as b64
                        img_bytes = b64.b64decode(img_resp.data[0].b64_json)
                        img_id = str(uuid.uuid4())
                        _put_object(f"ai-generated/{img_id}.png", img_bytes, "image/png")
                        generated_files.append({
                            "type": "image", "file_id": img_id, "filename": f"generated_{img_id[:8]}.png",
                            "content_type": "image/png", "url": f"/api/ai-chat/files/{img_id}"
                        })
                        await _store_generated_metadata(generated_files[-1], conv_id, user["id"], len(img_bytes))
                    elif img_resp.data and img_resp.data[0].url:
                        generated_files.append({
                            "type": "image", "url": img_resp.data[0].url, "filename": "generated_image.png",
                            "content_type": "image/png"
                        })
                    full_response = re.sub(r'\[GENERATE_IMAGE:\s*.+?\]', '', full_response).strip()
                except Exception as e:
                    logger.error(f"Image generation error: {e}")
                    full_response += f"\n\n*Image generation failed: {str(e)}*"

        # PDF generation
        if "[GENERATE_PDF]" in full_response:
            can_gen, remaining = await _check_user_quota()
            if not can_gen:
                full_response = full_response.replace("[GENERATE_PDF]", "").strip()
                full_response += f"\n\n*Storage quota exceeded ({remaining} remaining). Upgrade your plan.*"
            else:
                try:
                    yield f"data: {json.dumps({'type': 'status', 'content': 'Creating PDF...'})}\n\n"
                    pdf_bytes = generate_pdf_from_markdown(full_response.replace("[GENERATE_PDF]", "").strip())
                    pdf_id = str(uuid.uuid4())
                    _put_object(f"ai-generated/{pdf_id}.pdf", pdf_bytes, "application/pdf")
                    generated_files.append({
                        "type": "pdf", "file_id": pdf_id, "filename": f"document_{pdf_id[:8]}.pdf",
                        "content_type": "application/pdf", "url": f"/api/ai-chat/files/{pdf_id}"
                    })
                    await _store_generated_metadata(generated_files[-1], conv_id, user["id"], len(pdf_bytes))
                    full_response = full_response.replace("[GENERATE_PDF]", "").strip()
                except Exception as e:
                    logger.error(f"PDF generation error: {e}")

        # DOCX generation
        if "[GENERATE_DOCX]" in full_response:
            can_gen, remaining = await _check_user_quota()
            if not can_gen:
                full_response = full_response.replace("[GENERATE_DOCX]", "").strip()
                full_response += f"\n\n*Storage quota exceeded ({remaining} remaining). Upgrade your plan.*"
            else:
                try:
                    yield f"data: {json.dumps({'type': 'status', 'content': 'Creating Word document...'})}\n\n"
                    docx_bytes = generate_docx_from_markdown(full_response.replace("[GENERATE_DOCX]", "").strip())
                    docx_id = str(uuid.uuid4())
                    _put_object(f"ai-generated/{docx_id}.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                    generated_files.append({
                        "type": "docx", "file_id": docx_id, "filename": f"document_{docx_id[:8]}.docx",
                        "content_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        "url": f"/api/ai-chat/files/{docx_id}"
                    })
                    await _store_generated_metadata(generated_files[-1], conv_id, user["id"], len(docx_bytes))
                    full_response = full_response.replace("[GENERATE_DOCX]", "").strip()
                except Exception as e:
                    logger.error(f"DOCX generation error: {e}")

        # XLSX generation
        if "[GENERATE_XLSX]" in full_response:
            can_gen, remaining = await _check_user_quota()
            if not can_gen:
                full_response = full_response.replace("[GENERATE_XLSX]", "").strip()
                full_response += f"\n\n*Storage quota exceeded ({remaining} remaining). Upgrade your plan.*"
            else:
                try:
                    yield f"data: {json.dumps({'type': 'status', 'content': 'Creating spreadsheet...'})}\n\n"
                    xlsx_bytes = generate_xlsx_from_text(full_response.replace("[GENERATE_XLSX]", "").strip())
                    xlsx_id = str(uuid.uuid4())
                    _put_object(f"ai-generated/{xlsx_id}.xlsx", xlsx_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    generated_files.append({
                        "type": "xlsx", "file_id": xlsx_id, "filename": f"spreadsheet_{xlsx_id[:8]}.xlsx",
                        "content_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        "url": f"/api/ai-chat/files/{xlsx_id}"
                    })
                    await _store_generated_metadata(generated_files[-1], conv_id, user["id"], len(xlsx_bytes))
                    full_response = full_response.replace("[GENERATE_XLSX]", "").strip()
                except Exception as e:
                    logger.error(f"XLSX generation error: {e}")

        # Pie Chart generation
        pie_data, full_response = _extract_chart_json("GENERATE_PIE_CHART", full_response)
        if pie_data:
            can_gen, remaining = await _check_user_quota()
            if not can_gen:
                full_response += f"\n\n*Storage quota exceeded ({remaining} remaining).*"
            else:
                try:
                    yield f"data: {json.dumps({'type': 'status', 'content': 'Creating pie chart...'})}\n\n"
                    chart_bytes = generate_pie_chart(pie_data)
                    chart_id = str(uuid.uuid4())
                    _put_object(f"ai-generated/{chart_id}.png", chart_bytes, "image/png")
                    generated_files.append({"type": "image", "file_id": chart_id, "filename": f"pie_chart_{chart_id[:8]}.png", "content_type": "image/png", "url": f"/api/ai-chat/files/{chart_id}"})
                    await _store_generated_metadata(generated_files[-1], conv_id, user["id"], len(chart_bytes))
                except Exception as e:
                    logger.error(f"Pie chart generation error: {e}")

        # Bar Chart generation
        bar_data, full_response = _extract_chart_json("GENERATE_BAR_CHART", full_response)
        if bar_data:
            can_gen, remaining = await _check_user_quota()
            if not can_gen:
                full_response += f"\n\n*Storage quota exceeded ({remaining} remaining).*"
            else:
                try:
                    yield f"data: {json.dumps({'type': 'status', 'content': 'Creating bar chart...'})}\n\n"
                    chart_bytes = generate_bar_chart(bar_data)
                    chart_id = str(uuid.uuid4())
                    _put_object(f"ai-generated/{chart_id}.png", chart_bytes, "image/png")
                    generated_files.append({"type": "image", "file_id": chart_id, "filename": f"bar_chart_{chart_id[:8]}.png", "content_type": "image/png", "url": f"/api/ai-chat/files/{chart_id}"})
                    await _store_generated_metadata(generated_files[-1], conv_id, user["id"], len(chart_bytes))
                except Exception as e:
                    logger.error(f"Bar chart generation error: {e}")

        # Line Chart generation
        line_data, full_response = _extract_chart_json("GENERATE_LINE_CHART", full_response)
        if line_data:
            can_gen, remaining = await _check_user_quota()
            if not can_gen:
                full_response += f"\n\n*Storage quota exceeded ({remaining} remaining).*"
            else:
                try:
                    yield f"data: {json.dumps({'type': 'status', 'content': 'Creating line chart...'})}\n\n"
                    chart_bytes = generate_line_chart(line_data)
                    chart_id = str(uuid.uuid4())
                    _put_object(f"ai-generated/{chart_id}.png", chart_bytes, "image/png")
                    generated_files.append({"type": "image", "file_id": chart_id, "filename": f"line_chart_{chart_id[:8]}.png", "content_type": "image/png", "url": f"/api/ai-chat/files/{chart_id}"})
                    await _store_generated_metadata(generated_files[-1], conv_id, user["id"], len(chart_bytes))
                except Exception as e:
                    logger.error(f"Line chart generation error: {e}")

        # Stacked Bar Chart generation
        stacked_data, full_response = _extract_chart_json("GENERATE_STACKED_BAR_CHART", full_response)
        if stacked_data:
            can_gen, remaining = await _check_user_quota()
            if not can_gen:
                full_response += f"\n\n*Storage quota exceeded ({remaining} remaining).*"
            else:
                try:
                    yield f"data: {json.dumps({'type': 'status', 'content': 'Creating stacked bar chart...'})}\n\n"
                    chart_bytes = generate_stacked_bar_chart(stacked_data)
                    chart_id = str(uuid.uuid4())
                    _put_object(f"ai-generated/{chart_id}.png", chart_bytes, "image/png")
                    generated_files.append({"type": "image", "file_id": chart_id, "filename": f"stacked_chart_{chart_id[:8]}.png", "content_type": "image/png", "url": f"/api/ai-chat/files/{chart_id}"})
                    await _store_generated_metadata(generated_files[-1], conv_id, user["id"], len(chart_bytes))
                except Exception as e:
                    logger.error(f"Stacked bar chart generation error: {e}")

        # Radar Chart generation
        radar_data, full_response = _extract_chart_json("GENERATE_RADAR_CHART", full_response)
        if radar_data:
            can_gen, remaining = await _check_user_quota()
            if not can_gen:
                full_response += f"\n\n*Storage quota exceeded ({remaining} remaining).*"
            else:
                try:
                    yield f"data: {json.dumps({'type': 'status', 'content': 'Creating radar chart...'})}\n\n"
                    chart_bytes = generate_radar_chart(radar_data)
                    chart_id = str(uuid.uuid4())
                    _put_object(f"ai-generated/{chart_id}.png", chart_bytes, "image/png")
                    generated_files.append({"type": "image", "file_id": chart_id, "filename": f"radar_chart_{chart_id[:8]}.png", "content_type": "image/png", "url": f"/api/ai-chat/files/{chart_id}"})
                    await _store_generated_metadata(generated_files[-1], conv_id, user["id"], len(chart_bytes))
                except Exception as e:
                    logger.error(f"Radar chart generation error: {e}")

        assistant_msg["content"] = full_response
        assistant_msg["attachments"] = generated_files
        await db.ai_messages.insert_one(assistant_msg)
        await db.ai_conversations.update_one(
            {"id": conv_id},
            {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
        )

        yield f"data: {json.dumps({'type': 'done', 'message_id': assistant_msg_id, 'generated_files': generated_files})}\n\n"

    return StreamingResponse(
        stream_response(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )



# ============== Regenerate Response ==============

@router.post("/conversations/{conv_id}/regenerate")
async def regenerate_response(conv_id: str, user: dict = Depends(get_current_user)):
    conv = await db.ai_conversations.find_one({"id": conv_id, "user_id": user["id"]})
    if not conv:
        raise HTTPException(404, "Conversation not found")

    # Get all messages
    all_messages = await db.ai_messages.find(
        {"conversation_id": conv_id, "role": {"$in": ["user", "assistant"]}},
        {"_id": 0, "role": 1, "content": 1, "id": 1, "created_at": 1}
    ).sort("created_at", 1).to_list(length=500)

    if not all_messages:
        raise HTTPException(400, "No messages to regenerate from")

    # Delete the last assistant message from DB
    last_assistant = None
    for msg in reversed(all_messages):
        if msg["role"] == "assistant":
            last_assistant = msg
            break

    if last_assistant:
        await db.ai_messages.delete_one({"id": last_assistant["id"], "conversation_id": conv_id})

    # Build history without the deleted assistant message
    history = [m for m in all_messages if m.get("id") != (last_assistant or {}).get("id")]

    # Find the last user message
    last_user_text = ""
    for msg in reversed(history):
        if msg["role"] == "user":
            last_user_text = msg["content"]
            break

    if not last_user_text:
        raise HTTPException(400, "No user message found to regenerate from")

    assistant_msg_id = str(uuid.uuid4())

    async def stream_response():
        from llm_client import chat_completion

        full_response = ""
        try:
            yield f"data: {json.dumps({'type': 'thinking'})}\n\n"

            llm_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            for msg in history[-20:]:
                llm_messages.append({"role": msg["role"], "content": msg["content"]})

            # Ensure last message is the user message
            if not llm_messages or llm_messages[-1]["role"] != "user":
                llm_messages.append({"role": "user", "content": last_user_text})

            response = chat_completion(
                messages=llm_messages,
                model="gpt-5.2",
                api_key=EMERGENT_KEY,
                stream=True,
            )

            for chunk in response:
                delta = chunk.choices[0].delta if chunk.choices else None
                if delta and delta.content:
                    full_response += delta.content
                    yield f"data: {json.dumps({'type': 'chunk', 'content': delta.content})}\n\n"

        except Exception as e:
            logger.error(f"AI Chat regenerate error: {e}")
            full_response = "I'm sorry, I encountered an error regenerating the response. Please try again."
            yield f"data: {json.dumps({'type': 'chunk', 'content': full_response})}\n\n"

        # Save new assistant message
        assistant_msg = {
            "id": assistant_msg_id,
            "conversation_id": conv_id,
            "role": "assistant",
            "content": full_response,
            "attachments": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.ai_messages.insert_one(assistant_msg)
        await db.ai_conversations.update_one(
            {"id": conv_id},
            {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
        )

        yield f"data: {json.dumps({'type': 'done', 'message_id': assistant_msg_id})}\n\n"

    return StreamingResponse(
        stream_response(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )

# ============== File Upload ==============

# ============== Chat Export ==============

@router.get("/conversations/{conv_id}/export")
async def export_conversation(conv_id: str, format: str = Query("md", regex="^(md|pdf|docx)$"), user: dict = Depends(get_current_user)):
    conv = await db.ai_conversations.find_one({"id": conv_id, "user_id": user["id"]}, {"_id": 0})
    if not conv:
        raise HTTPException(404, "Conversation not found")

    msgs = await db.ai_messages.find(
        {"conversation_id": conv_id, "role": {"$in": ["user", "assistant"]}},
        {"_id": 0}
    ).sort("created_at", 1).to_list(length=500)

    title = conv.get("title", "Chat Export")
    created = conv.get("created_at", "")

    if format == "md":
        md = _build_markdown(title, created, msgs)
        return Response(
            content=md.encode("utf-8"),
            media_type="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="{_safe_filename(title)}.md"'}
        )
    elif format == "pdf":
        pdf_bytes = _build_pdf(title, created, msgs)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{_safe_filename(title)}.pdf"'}
        )
    elif format == "docx":
        docx_bytes = _build_docx(title, created, msgs)
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{_safe_filename(title)}.docx"'}
        )


def _safe_filename(title: str) -> str:
    import re
    safe = re.sub(r'[^\w\s-]', '', title)[:60].strip()
    return safe or "chat-export"


def _build_markdown(title: str, created: str, msgs: list) -> str:
    lines = [f"# {title}\n"]
    if created:
        try:
            dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
            lines.append(f"*Exported from Munal AI &mdash; {dt.strftime('%B %d, %Y')}*\n")
        except Exception:
            lines.append(f"*Exported from Munal AI*\n")
    lines.append("---\n")

    for msg in msgs:
        role = "You" if msg["role"] == "user" else "Munal AI"
        lines.append(f"### {role}\n")
        lines.append(f"{msg.get('content', '')}\n")
        lines.append("")

    lines.append("---\n*Exported from Munal AI*")
    return "\n".join(lines)


def _build_pdf(title: str, created: str, msgs: list) -> bytes:
    import fitz  # PyMuPDF

    doc = fitz.open()
    WIDTH, HEIGHT = 595, 842  # A4
    MARGIN = 50
    usable_w = WIDTH - 2 * MARGIN
    y = MARGIN

    def new_page():
        nonlocal y
        page = doc.new_page(width=WIDTH, height=HEIGHT)
        y = MARGIN
        return page

    page = new_page()

    # Title
    y += 10
    page.insert_text((MARGIN, y), title[:80], fontsize=18, fontname="helv", color=(0.29, 0.27, 0.53))
    y += 28

    # Date
    date_str = "Exported from Munal AI"
    if created:
        try:
            dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
            date_str = f"Exported from Munal AI — {dt.strftime('%B %d, %Y')}"
        except Exception:
            pass
    page.insert_text((MARGIN, y), date_str, fontsize=9, fontname="helv", color=(0.5, 0.5, 0.5))
    y += 20

    # Divider
    page.draw_line((MARGIN, y), (WIDTH - MARGIN, y), color=(0.85, 0.85, 0.85), width=0.5)
    y += 15

    for msg in msgs:
        role = "You" if msg["role"] == "user" else "Munal AI"
        content = msg.get("content", "")
        role_color = (0.29, 0.27, 0.53) if msg["role"] == "assistant" else (0.2, 0.2, 0.2)

        # Role header
        if y > HEIGHT - 80:
            page = new_page()
        page.insert_text((MARGIN, y), role, fontsize=11, fontname="helvetica-bold", color=role_color)
        y += 18

        # Content - wrap text manually
        lines = []
        for paragraph in content.split('\n'):
            if not paragraph.strip():
                lines.append("")
                continue
            words = paragraph.split(' ')
            current_line = ""
            for word in words:
                test_line = f"{current_line} {word}".strip() if current_line else word
                text_width = fitz.get_text_length(test_line, fontname="helv", fontsize=10)
                if text_width > usable_w:
                    lines.append(current_line)
                    current_line = word
                else:
                    current_line = test_line
            if current_line:
                lines.append(current_line)

        for line in lines:
            if y > HEIGHT - MARGIN:
                page = new_page()
            page.insert_text((MARGIN, y), line, fontsize=10, fontname="helv", color=(0.15, 0.15, 0.15))
            y += 14

        y += 12  # spacing between messages

    # Footer on last page
    if y > HEIGHT - 40:
        page = new_page()
    page.draw_line((MARGIN, HEIGHT - 40), (WIDTH - MARGIN, HEIGHT - 40), color=(0.85, 0.85, 0.85), width=0.5)
    page.insert_text((MARGIN, HEIGHT - 28), "Exported from Munal AI", fontsize=8, fontname="helv", color=(0.6, 0.6, 0.6))

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def _build_docx(title: str, created: str, msgs: list) -> bytes:
    from docx import Document
    from docx.shared import Pt, Inches, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    import io

    doc = Document()

    # Set default font
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Calibri'
    font.size = Pt(11)

    # Title
    heading = doc.add_heading(title, level=1)
    for run in heading.runs:
        run.font.color.rgb = RGBColor(75, 69, 135)

    # Date
    date_str = "Exported from Munal AI"
    if created:
        try:
            dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
            date_str = f"Exported from Munal AI — {dt.strftime('%B %d, %Y')}"
        except Exception:
            pass
    date_para = doc.add_paragraph(date_str)
    date_para.runs[0].font.size = Pt(9)
    date_para.runs[0].font.color.rgb = RGBColor(128, 128, 128)

    doc.add_paragraph("").paragraph_format.space_after = Pt(4)

    for msg in msgs:
        role = "You" if msg["role"] == "user" else "Munal AI"
        content = msg.get("content", "")

        # Role heading
        role_para = doc.add_paragraph()
        role_run = role_para.add_run(role)
        role_run.bold = True
        role_run.font.size = Pt(11)
        if msg["role"] == "assistant":
            role_run.font.color.rgb = RGBColor(75, 69, 135)
        role_para.paragraph_format.space_after = Pt(2)

        # Content
        for paragraph_text in content.split('\n'):
            p = doc.add_paragraph(paragraph_text)
            p.paragraph_format.space_after = Pt(2)
            for run in p.runs:
                run.font.size = Pt(10)

        # Spacer
        doc.add_paragraph("").paragraph_format.space_after = Pt(6)

    # Footer
    footer_para = doc.add_paragraph("Exported from Munal AI")
    footer_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer_para.runs[0].font.size = Pt(8)
    footer_para.runs[0].font.color.rgb = RGBColor(160, 160, 160)

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


# ============== File Upload (original) ==============

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    max_size = 10 * 1024 * 1024  # 10MB
    data = await file.read()
    if len(data) > max_size:
        raise HTTPException(413, "File too large (max 10MB)")

    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    storage_path = f"{APP_NAME}/uploads/{user['id']}/{uuid.uuid4()}.{ext}"

    try:
        result = _put_object(storage_path, data, file.content_type or "application/octet-stream")
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(500, "File upload failed")

    file_record = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": len(data),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.ai_chat_files.insert_one(file_record)
    file_record.pop("_id", None)
    return file_record


@router.get("/files/{file_id}")
async def download_file(file_id: str, user: dict = Depends(get_current_user)):
    """Download uploaded or AI-generated files."""
    # First check user-uploaded files in DB
    record = await db.ai_chat_files.find_one({"id": file_id, "user_id": user["id"]}, {"_id": 0})
    if record:
        try:
            data, ct = _get_object(record["storage_path"])
            return Response(content=data, media_type=record.get("content_type", ct))
        except Exception as e:
            logger.error(f"Download failed: {e}")
            raise HTTPException(500, "File download failed")

    # Fallback: check AI-generated files in object storage
    for ext in [".png", ".pdf", ".docx", ".xlsx", ".jpg", ".jpeg", ""]:
        try:
            data, ct = _get_object(f"ai-generated/{file_id}{ext}")
            return Response(content=data, media_type=ct)
        except Exception:
            continue

    raise HTTPException(404, "File not found")


# ============== Voice Transcription ==============

@router.post("/voice")
async def transcribe_voice(
    audio: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    max_size = 25 * 1024 * 1024  # 25MB whisper limit
    data = await audio.read()
    if len(data) > max_size:
        raise HTTPException(413, "Audio file too large (max 25MB)")

    try:
        from llm_client import speech_to_text

        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            tmp.write(data)
            tmp_path = tmp.name

        with open(tmp_path, "rb") as audio_file:
            response = speech_to_text(audio_file=audio_file, api_key=EMERGENT_KEY)

        os.unlink(tmp_path)
        return {"text": response.text}

    except Exception as e:
        logger.error(f"Voice transcription failed: {e}")
        raise HTTPException(500, f"Transcription failed: {str(e)}")
