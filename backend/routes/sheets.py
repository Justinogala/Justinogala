"""
Sheets API — AI-powered spreadsheet intelligence for Munal Workplace.
Provides CRUD for spreadsheets and AI generation capabilities.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime, timezone
from config import db
import uuid
import json
import os

router = APIRouter(prefix="/sheets", tags=["sheets"])

# ── Auth dependency (reuse from auth module) ──
from routes.auth import get_current_user

EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY", "")


# ── Models ──
class CreateSheetRequest(BaseModel):
    title: str = "Untitled Spreadsheet"
    workspace_id: Optional[str] = None

class UpdateSheetRequest(BaseModel):
    title: Optional[str] = None
    data: Optional[List[Any]] = None  # Fortune-Sheet data array
    
class AIGenerateRequest(BaseModel):
    prompt: str
    sheet_id: Optional[str] = None

class AIFormulaRequest(BaseModel):
    description: str
    context: Optional[str] = None  # surrounding cell values for context


# ── CRUD Endpoints ──

@router.post("")
async def create_sheet(req: CreateSheetRequest, user: dict = Depends(get_current_user)):
    sheet = {
        "id": str(uuid.uuid4()),
        "title": req.title,
        "workspace_id": req.workspace_id,
        "created_by": user["id"],
        "created_by_name": user.get("full_name", user.get("email", "")),
        "data": [{"name": "Sheet1", "celldata": [], "order": 0, "row": 50, "column": 26, "status": 1}],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.sheets.insert_one(sheet)
    sheet.pop("_id", None)
    return sheet


@router.get("")
async def list_sheets(
    workspace_id: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {"created_by": user["id"]}
    if workspace_id:
        query["workspace_id"] = workspace_id
    sheets = await db.sheets.find(query, {"_id": 0, "data": 0}).sort("updated_at", -1).to_list(200)
    return sheets


@router.get("/{sheet_id}")
async def get_sheet(sheet_id: str, user: dict = Depends(get_current_user)):
    sheet = await db.sheets.find_one({"id": sheet_id, "created_by": user["id"]}, {"_id": 0})
    if not sheet:
        raise HTTPException(404, "Sheet not found")
    return sheet


@router.put("/{sheet_id}")
async def update_sheet(sheet_id: str, req: UpdateSheetRequest, user: dict = Depends(get_current_user)):
    update = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if req.title is not None:
        update["title"] = req.title
    if req.data is not None:
        update["data"] = req.data
    result = await db.sheets.update_one(
        {"id": sheet_id, "created_by": user["id"]},
        {"$set": update}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Sheet not found")
    return {"status": "ok"}


@router.delete("/{sheet_id}")
async def delete_sheet(sheet_id: str, user: dict = Depends(get_current_user)):
    result = await db.sheets.delete_one({"id": sheet_id, "created_by": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(404, "Sheet not found")
    return {"status": "deleted"}


@router.post("/{sheet_id}/duplicate")
async def duplicate_sheet(sheet_id: str, user: dict = Depends(get_current_user)):
    original = await db.sheets.find_one({"id": sheet_id, "created_by": user["id"]}, {"_id": 0})
    if not original:
        raise HTTPException(404, "Sheet not found")
    new_sheet = {
        **original,
        "id": str(uuid.uuid4()),
        "title": f"{original['title']} (Copy)",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.sheets.insert_one(new_sheet)
    new_sheet.pop("_id", None)
    return new_sheet


# ── AI Endpoints ──

@router.post("/ai/generate")
async def ai_generate_sheet(req: AIGenerateRequest, user: dict = Depends(get_current_user)):
    """Generate a spreadsheet from a natural language prompt."""
    if not EMERGENT_KEY:
        raise HTTPException(500, "AI service not configured")

    from llm_client import chat_completion

    system = """You are a spreadsheet generator for a business platform. When given a prompt, generate structured spreadsheet data.

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "title": "Sheet Title",
  "columns": ["Column A Header", "Column B Header", ...],
  "rows": [
    ["row1_val1", "row1_val2", ...],
    ["row2_val1", "row2_val2", ...]
  ],
  "column_widths": [120, 120, ...],
  "formulas": [
    {"r": 10, "c": 1, "f": "=SUM(B2:B10)"}
  ]
}

Rules:
- Generate 5-20 realistic sample rows with realistic data
- Include formulas where appropriate (SUM, AVERAGE, COUNT, etc.)
- Column widths should reflect content (narrow for dates/numbers, wider for text)
- Use business-appropriate formatting
- Numbers should be numbers, not strings
- Dates should be formatted as YYYY-MM-DD"""

    try:
        result = chat_completion(
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": req.prompt},
            ],
            model="gpt-5.2",
            api_key=EMERGENT_KEY,
        )
        raw = result.choices[0].message.content.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

        ai_data = json.loads(raw)

        # Convert AI output to Fortune-Sheet celldata format
        celldata = []
        columns = ai_data.get("columns", [])
        rows = ai_data.get("rows", [])
        col_widths = ai_data.get("column_widths", [120] * len(columns))

        # Header row (bold, with background)
        for ci, col in enumerate(columns):
            celldata.append({
                "r": 0, "c": ci,
                "v": {
                    "v": col, "m": str(col), "ct": {"fa": "General", "t": "g"},
                    "bl": 1,  # bold
                    "bg": "#f0f4ff",
                    "fc": "#1a1a2e",
                }
            })

        # Data rows
        for ri, row in enumerate(rows):
            for ci, val in enumerate(row):
                cell = {"r": ri + 1, "c": ci, "v": {}}
                if isinstance(val, (int, float)):
                    cell["v"] = {"v": val, "m": str(val), "ct": {"fa": "General", "t": "n"}}
                else:
                    cell["v"] = {"v": str(val), "m": str(val), "ct": {"fa": "General", "t": "g"}}
                celldata.append(cell)

        # Formulas
        for f in ai_data.get("formulas", []):
            celldata.append({
                "r": f["r"], "c": f["c"],
                "v": {"f": f["f"], "v": 0, "m": "0", "ct": {"fa": "General", "t": "n"}, "bl": 1, "bg": "#fffde7"}
            })

        # Build column config
        col_config = {str(i): w for i, w in enumerate(col_widths)}

        sheet_data = [{
            "name": "Sheet1",
            "celldata": celldata,
            "order": 0,
            "row": max(len(rows) + 5, 50),
            "column": max(len(columns) + 2, 26),
            "status": 1,
            "config": {
                "columnlen": col_config,
                "rowhidden": {},
                "colhidden": {},
            }
        }]

        title = ai_data.get("title", "AI Generated Sheet")

        # Save if sheet_id provided, else create new
        if req.sheet_id:
            await db.sheets.update_one(
                {"id": req.sheet_id, "created_by": user["id"]},
                {"$set": {"data": sheet_data, "title": title, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            return {"sheet_id": req.sheet_id, "title": title, "data": sheet_data}
        else:
            sheet = {
                "id": str(uuid.uuid4()),
                "title": title,
                "workspace_id": None,
                "created_by": user["id"],
                "created_by_name": user.get("full_name", user.get("email", "")),
                "data": sheet_data,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.sheets.insert_one(sheet)
            sheet.pop("_id", None)
            return sheet

    except json.JSONDecodeError:
        raise HTTPException(422, "AI returned invalid data. Please try rephrasing your prompt.")
    except Exception as e:
        raise HTTPException(500, f"AI generation failed: {str(e)}")


@router.post("/ai/formula")
async def ai_formula(req: AIFormulaRequest, user: dict = Depends(get_current_user)):
    """Convert natural language to spreadsheet formula."""
    if not EMERGENT_KEY:
        raise HTTPException(500, "AI service not configured")

    from llm_client import chat_completion

    system = """You are a spreadsheet formula expert. Convert natural language descriptions to spreadsheet formulas.
Return ONLY the formula string starting with '='. No explanation, no markdown.
Use standard Excel/Sheets formula syntax (SUM, AVERAGE, IF, VLOOKUP, COUNTIF, etc.).
Column references use letters (A, B, C...), row references use numbers (1, 2, 3...)."""

    context_msg = ""
    if req.context:
        context_msg = f"\n\nContext of surrounding cells:\n{req.context}"

    result = chat_completion(
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": f"{req.description}{context_msg}"},
        ],
        model="gpt-5.2",
        api_key=EMERGENT_KEY,
    )
    formula = result.choices[0].message.content.strip()
    if not formula.startswith("="):
        formula = "=" + formula
    return {"formula": formula}
