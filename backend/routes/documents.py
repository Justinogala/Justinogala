"""
Documents routes - CRUD for rich text documents.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timezone
from typing import Optional
import uuid
import jwt

from config import db, JWT_SECRET_KEY, JWT_ALGORITHM, logger

router = APIRouter(prefix="/documents", tags=["Documents"])
security = HTTPBearer(auto_error=False)


def _get_user_id(creds: HTTPAuthorizationCredentials):
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload.get("user_id") or payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("")
async def list_documents(
    search: Optional[str] = Query(None),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """List all documents for the current user"""
    user_id = _get_user_id(credentials)
    query = {"user_id": user_id, "deleted": {"$ne": True}}
    if search:
        query["title"] = {"$regex": search, "$options": "i"}

    docs = await db.documents.find(query, {"_id": 0}).sort("updated_at", -1).to_list(200)
    return docs


@router.post("")
async def create_document(
    body: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Create a new document"""
    user_id = _get_user_id(credentials)
    doc_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    doc = {
        "id": doc_id,
        "user_id": user_id,
        "title": body.get("title", "Untitled Document"),
        "content": body.get("content", ""),
        "template": body.get("template"),
        "word_count": len((body.get("content", "")).split()),
        "created_at": now,
        "updated_at": now,
        "deleted": False,
    }
    await db.documents.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/{doc_id}")
async def get_document(
    doc_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get a single document"""
    user_id = _get_user_id(credentials)
    doc = await db.documents.find_one({"id": doc_id, "user_id": user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.put("/{doc_id}")
async def update_document(
    doc_id: str,
    body: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Update a document"""
    user_id = _get_user_id(credentials)
    existing = await db.documents.find_one({"id": doc_id, "user_id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Document not found")

    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if "title" in body:
        update_data["title"] = body["title"]
    if "content" in body:
        update_data["content"] = body["content"]
        update_data["word_count"] = len(body["content"].split())

    await db.documents.update_one({"id": doc_id}, {"$set": update_data})
    updated = await db.documents.find_one({"id": doc_id}, {"_id": 0})
    return updated


@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Soft-delete a document"""
    user_id = _get_user_id(credentials)
    result = await db.documents.update_one(
        {"id": doc_id, "user_id": user_id},
        {"$set": {"deleted": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"success": True}


@router.post("/{doc_id}/duplicate")
async def duplicate_document(
    doc_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Duplicate a document"""
    user_id = _get_user_id(credentials)
    original = await db.documents.find_one({"id": doc_id, "user_id": user_id}, {"_id": 0})
    if not original:
        raise HTTPException(status_code=404, detail="Document not found")

    new_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    new_doc = {
        **original,
        "id": new_id,
        "title": f"{original['title']} (Copy)",
        "created_at": now,
        "updated_at": now,
    }
    await db.documents.insert_one(new_doc)
    new_doc.pop("_id", None)
    return new_doc
