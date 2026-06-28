"""
AI Chat routes - GPT-5.2 powered conversational AI with streaming, file upload, and voice input.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Query
from fastapi.responses import StreamingResponse, Response
from datetime import datetime, timezone
import uuid
import json
import os
import asyncio
import re
import tempfile

from config import db, logger
from routes.auth import get_current_user
from routes.ai_chat_config import (
    EMERGENT_KEY, APP_NAME, SYSTEM_PROMPT, SEARCH_FOLLOWUP_PROMPT,
    put_object_sync, put_object_async, put_object, get_object,
)
from routes.ai_chat_export import export_conversation_handler

router = APIRouter(prefix="/ai-chat", tags=["AI Chat"])

# ============== File Processing Utilities ==============
from routes.ai_chat_files import (
    extract_pdf_text, extract_excel_data, encode_image_base64,
    extract_file_content, generate_pdf_from_markdown,
    generate_docx_from_markdown, generate_xlsx_from_text,
    generate_pie_chart, generate_bar_chart,
    generate_line_chart, generate_stacked_bar_chart, generate_radar_chart,
)


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
            file_bytes, _ = get_object(storage_path)
        except Exception as e:
            logger.error(f"Failed to read file from storage: {storage_path} — {e}")
            return f"[File: {filename} — storage read error]", None

        if content_type.startswith("image/"):
            img_b64 = encode_image_base64(file_bytes)
            return f"[Image: {filename}]", f"data:{content_type};base64,{img_b64}"

        ext = filename.lower().split(".")[-1] if "." in filename else ""

        if content_type == "application/pdf" or ext == "pdf":
            text = extract_pdf_text(file_bytes)
            return f"[PDF: {filename}]\n{text}", None

        if content_type in ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel") or ext in ("xlsx", "xls"):
            text = extract_excel_data(file_bytes)
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
    web_search_enabled = body.get("web_search", True)

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
                model="gpt-5.5",
                api_key=EMERGENT_KEY,
                stream=True,
            )

            for chunk in response:
                delta = chunk.choices[0].delta if chunk.choices else None
                if delta and delta.content:
                    full_response += delta.content
                    yield f"data: {json.dumps({'type': 'chunk', 'content': delta.content})}\n\n"

        except Exception as e:
            err_str = str(e)
            logger.error(f"AI Chat streaming error: {err_str}")
            if "budget" in err_str.lower() or "balance" in err_str.lower() or "quota" in err_str.lower() or "insufficient" in err_str.lower():
                full_response = "The AI service is temporarily unavailable due to usage limits. Please contact your administrator to add balance to the Universal Key (Profile → Universal Key → Add Balance)."
            elif "rate" in err_str.lower() and "limit" in err_str.lower():
                full_response = "Too many requests. Please wait a moment and try again."
            elif "api_key" in err_str.lower() or "auth" in err_str.lower() or "401" in err_str:
                full_response = "AI service authentication failed. Please contact your administrator to check the API key configuration."
            else:
                full_response = f"I encountered an error processing your request. Please try again. (Error: {err_str[:100]})"
            yield f"data: {json.dumps({'type': 'chunk', 'content': full_response})}\n\n"

        # ============== Web Search Detection ==============
        web_search_match = re.search(r'\[WEB_SEARCH:\s*(.+?)\]', full_response) if web_search_enabled else None
        sources = []
        # If search is disabled but LLM still produced the tag, strip it
        if not web_search_enabled and '[WEB_SEARCH:' in full_response:
            full_response = re.sub(r'\[WEB_SEARCH:\s*.+?\]', '', full_response).strip()
        if web_search_match:
            search_query = web_search_match.group(1).strip()
            full_response = ""  # Clear first response entirely (it was just the search tag)
            try:
                yield f"data: {json.dumps({'type': 'search_start', 'content': ''})}\n\n"
                yield f"data: {json.dumps({'type': 'status', 'content': 'Searching the web...'})}\n\n"
                from routes.web_search import web_search, format_search_results
                search_results = await web_search(search_query, db)
                logger.info(f"Web search for '{search_query}' returned {len(search_results)} results")

                if search_results:
                    yield f"data: {json.dumps({'type': 'status', 'content': 'Analyzing search results...'})}\n\n"
                    formatted = format_search_results(search_results)
                    search_prompt = SEARCH_FOLLOWUP_PROMPT.format(
                        search_results=formatted,
                        user_question=user_text
                    )
                    search_messages = [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": search_prompt}
                    ]

                    full_response = ""
                    search_resp = chat_completion(
                        messages=search_messages,
                        model="gpt-5.5",
                        api_key=EMERGENT_KEY,
                        stream=True,
                    )
                    tag_buffer = ""
                    tag_stripped = False
                    for chunk in search_resp:
                        delta = chunk.choices[0].delta if chunk.choices else None
                        if delta and delta.content:
                            content = delta.content
                            # Buffer and strip any [WEB_SEARCH: ...] tag from start of response
                            if not tag_stripped:
                                tag_buffer += content
                                if "]" in tag_buffer:
                                    tag_buffer = re.sub(r'\[WEB_SEARCH:\s*.+?\]', '', tag_buffer)
                                    tag_stripped = True
                                    if tag_buffer.strip():
                                        full_response += tag_buffer
                                        yield f"data: {json.dumps({'type': 'chunk', 'content': tag_buffer})}\n\n"
                                    tag_buffer = ""
                                elif len(tag_buffer) > 200:
                                    tag_stripped = True
                                    full_response += tag_buffer
                                    yield f"data: {json.dumps({'type': 'chunk', 'content': tag_buffer})}\n\n"
                                    tag_buffer = ""
                                continue
                            full_response += content
                            yield f"data: {json.dumps({'type': 'chunk', 'content': content})}\n\n"
                    # Flush any remaining buffer
                    if tag_buffer:
                        tag_buffer = re.sub(r'\[WEB_SEARCH:\s*.+?\]', '', tag_buffer)
                        if tag_buffer.strip():
                            full_response += tag_buffer
                            yield f"data: {json.dumps({'type': 'chunk', 'content': tag_buffer})}\n\n"

                    # Final cleanup
                    full_response = re.sub(r'\[WEB_SEARCH:\s*.+?\]', '', full_response).strip()

                    sources = [{"title": r["title"], "url": r["url"]} for r in search_results if r.get("url")]
                else:
                    full_response = "I tried searching the web but couldn't find relevant results. Let me try answering from my knowledge instead.\n\n" + full_response
                    yield f"data: {json.dumps({'type': 'chunk', 'content': full_response})}\n\n"
            except Exception as e:
                logger.error(f"Web search error: {e}")
                yield f"data: {json.dumps({'type': 'chunk', 'content': 'Web search encountered an error. Answering from my knowledge.'})}\n\n"

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

        async def _store_generated_metadata(file_info, conv_id, user_id, file_size=0):
            """Store file generation metadata in MongoDB for tracking/cleanup."""
            filename = file_info.get("filename", "")
            ext = filename.rsplit(".", 1)[-1] if "." in filename else file_info.get("type", "bin")
            file_id = file_info.get("file_id", str(uuid.uuid4()))
            await db.ai_generated_files.insert_one({
                "id": file_id,
                "conversation_id": conv_id,
                "user_id": user_id,
                "type": file_info.get("type"),
                "filename": filename,
                "content_type": file_info.get("content_type"),
                "storage_path": f"ai-generated/{file_id}.{ext}",
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
                    yield f"data: {json.dumps({'type': 'status', 'content': 'Generating image... This may take 15-30 seconds.'})}\n\n"

                    def _generate_image_sync(prompt):
                        from llm_client import get_client
                        client = get_client(EMERGENT_KEY)
                        return client.images.generate(
                            model="gpt-image-1",
                            prompt=prompt,
                            n=1,
                            size="1024x1024",
                        )

                    # Run image generation in thread to avoid blocking event loop
                    img_resp = await asyncio.to_thread(_generate_image_sync, img_prompt)

                    if img_resp.data and img_resp.data[0].b64_json:
                        import base64 as b64
                        img_bytes = b64.b64decode(img_resp.data[0].b64_json)
                        img_id = str(uuid.uuid4())
                        yield f"data: {json.dumps({'type': 'status', 'content': 'Uploading image...'})}\n\n"
                        await put_object_async(f"ai-generated/{img_id}.png", img_bytes, "image/png")
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
                    full_response = re.sub(r'\[GENERATE_IMAGE:\s*.+?\]', '', full_response).strip()
                    err_str = str(e)
                    if "safety" in err_str.lower() or "rejected" in err_str.lower() or "content_policy" in err_str.lower():
                        full_response += "\n\n*The image couldn't be generated because it was flagged by the content safety filter. Try rephrasing your request or using a different subject.*"
                    else:
                        full_response += f"\n\n*Image generation failed. Please try again.*"

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
                    await put_object_async(f"ai-generated/{pdf_id}.pdf", pdf_bytes, "application/pdf")
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
                    await put_object_async(f"ai-generated/{docx_id}.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
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
                    await put_object_async(f"ai-generated/{xlsx_id}.xlsx", xlsx_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    generated_files.append({
                        "type": "xlsx", "file_id": xlsx_id, "filename": f"spreadsheet_{xlsx_id[:8]}.xlsx",
                        "content_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        "url": f"/api/ai-chat/files/{xlsx_id}"
                    })
                    await _store_generated_metadata(generated_files[-1], conv_id, user["id"], len(xlsx_bytes))
                    full_response = full_response.replace("[GENERATE_XLSX]", "").strip()
                except Exception as e:
                    logger.error(f"XLSX generation error: {e}")

        # Chart generation (all types via shared helper)
        _chart_configs = [
            ("GENERATE_PIE_CHART", generate_pie_chart, "pie_chart"),
            ("GENERATE_BAR_CHART", generate_bar_chart, "bar_chart"),
            ("GENERATE_LINE_CHART", generate_line_chart, "line_chart"),
            ("GENERATE_STACKED_BAR_CHART", generate_stacked_bar_chart, "stacked_chart"),
            ("GENERATE_RADAR_CHART", generate_radar_chart, "radar_chart"),
        ]
        for tag_name, gen_fn, prefix in _chart_configs:
            chart_data, full_response = _extract_chart_json(tag_name, full_response)
            if chart_data:
                can_gen, remaining = await _check_user_quota()
                if not can_gen:
                    full_response += f"\n\n*Storage quota exceeded ({remaining} remaining).*"
                else:
                    try:
                        label = tag_name.replace("GENERATE_", "").replace("_", " ").title()
                        yield f"data: {json.dumps({'type': 'status', 'content': f'Creating {label.lower()}...'})}\n\n"
                        chart_bytes = await asyncio.to_thread(gen_fn, chart_data)
                        yield f"data: {json.dumps({'type': 'status', 'content': 'Uploading chart...'})}\n\n"
                        chart_id = str(uuid.uuid4())
                        await put_object_async(f"ai-generated/{chart_id}.png", chart_bytes, "image/png")
                        generated_files.append({"type": "image", "file_id": chart_id, "filename": f"{prefix}_{chart_id[:8]}.png", "content_type": "image/png", "url": f"/api/ai-chat/files/{chart_id}"})
                        await _store_generated_metadata(generated_files[-1], conv_id, user["id"], len(chart_bytes))
                    except Exception as e:
                        logger.error(f"{prefix} generation error: {e}")

        assistant_msg["content"] = full_response
        assistant_msg["attachments"] = generated_files
        if sources:
            assistant_msg["sources"] = sources
        await db.ai_messages.insert_one(assistant_msg)
        await db.ai_conversations.update_one(
            {"id": conv_id},
            {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
        )

        done_data = {'type': 'done', 'message_id': assistant_msg_id, 'generated_files': generated_files}
        if sources:
            done_data['sources'] = sources
        yield f"data: {json.dumps(done_data)}\n\n"

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
                model="gpt-5.5",
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
async def export_conversation(conv_id: str, format: str = Query("md", pattern="^(md|pdf|docx)$"), user: dict = Depends(get_current_user)):
    return await export_conversation_handler(conv_id, format, user)


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
        result = put_object(storage_path, data, file.content_type or "application/octet-stream")
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
            data, ct = get_object(record["storage_path"])
            return Response(content=data, media_type=record.get("content_type", ct))
        except Exception as e:
            logger.error(f"Download failed: {e}")
            raise HTTPException(500, "File download failed")

    # Check AI-generated files metadata for direct path resolution
    gen_record = await db.ai_generated_files.find_one({"id": file_id}, {"_id": 0})
    if gen_record and gen_record.get("storage_path"):
        try:
            data, ct = get_object(gen_record["storage_path"])
            return Response(content=data, media_type=gen_record.get("content_type", ct))
        except Exception:
            pass

    # Fallback: probe object storage by common extensions
    for ext in [".png", ".pdf", ".docx", ".xlsx", ".jpg", ".jpeg", ""]:
        try:
            data, ct = get_object(f"ai-generated/{file_id}{ext}")
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
