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

Be concise, accurate, and helpful. Use markdown formatting when appropriate (headers, lists, code blocks, bold, etc.). When writing code, always specify the language for syntax highlighting."""

# ============== Conversations CRUD ==============

@router.post("/conversations")
async def create_conversation(user: dict = Depends(get_current_user)):
    conv = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "title": "New Chat",
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
    ).sort("updated_at", -1)
    return await cursor.to_list(length=100)


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
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        full_response = ""
        try:
            chat = LlmChat(
                api_key=EMERGENT_KEY,
                session_id=f"munal-aichat-{conv_id}-{assistant_msg_id}",
                system_message=SYSTEM_PROMPT,
            )
            chat.with_model("openai", "gpt-5.2")

            # Build context from history (last 20 messages)
            context_messages = history[-20:]
            context_text = ""
            for msg in context_messages[:-1]:
                role_label = "User" if msg["role"] == "user" else "Assistant"
                context_text += f"{role_label}: {msg['content']}\n\n"

            current_message = user_text
            if attachments:
                file_desc = ", ".join([a.get("filename", "file") for a in attachments])
                current_message += f"\n\n[Attached files: {file_desc}]"

            if context_text:
                prompt = f"Previous conversation:\n{context_text}\nUser: {current_message}"
            else:
                prompt = current_message

            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            full_response = response

            # Stream in chunks to simulate streaming
            words = full_response.split(" ")
            chunk_size = 3
            for i in range(0, len(words), chunk_size):
                chunk = " ".join(words[i:i+chunk_size])
                if i > 0:
                    chunk = " " + chunk
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
                await asyncio.sleep(0.02)

        except Exception as e:
            logger.error(f"AI Chat error: {e}")
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
    record = await db.ai_chat_files.find_one({"id": file_id, "user_id": user["id"]}, {"_id": 0})
    if not record:
        raise HTTPException(404, "File not found")
    try:
        data, ct = _get_object(record["storage_path"])
        return Response(content=data, media_type=record.get("content_type", ct))
    except Exception as e:
        logger.error(f"Download failed: {e}")
        raise HTTPException(500, "File download failed")


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
        from emergentintegrations.llm.openai import OpenAISpeechToText
        stt = OpenAISpeechToText(api_key=EMERGENT_KEY)

        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            tmp.write(data)
            tmp_path = tmp.name

        with open(tmp_path, "rb") as audio_file:
            response = await stt.transcribe(
                file=audio_file,
                model="whisper-1",
                response_format="json",
                language="en"
            )

        os.unlink(tmp_path)
        return {"text": response.text}

    except Exception as e:
        logger.error(f"Voice transcription failed: {e}")
        raise HTTPException(500, f"Transcription failed: {str(e)}")
