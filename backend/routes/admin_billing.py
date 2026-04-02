"""
Admin Billing Routes — coupons, tax rates.
Split from admin.py for maintainability.
"""
from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
from config import db, logger
import uuid

router = APIRouter(prefix="/admin", tags=["Admin Billing"])


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.headers.get("x-real-ip") or (request.client.host if request.client else "unknown")

async def _audit(action, category="billing", ip=None):
    doc = {
        "id": str(uuid.uuid4()), "action": action, "category": category, "severity": "info",
        "details": {}, "ip_address": ip, "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await db.audit_logs.insert_one(doc)


class CouponCreate(BaseModel):
    code: str
    discount_type: str = "percentage"
    discount_value: float
    max_uses: Optional[int] = None
    expires_at: Optional[datetime] = None
    min_purchase: Optional[float] = None
    applicable_packages: List[str] = []
    description: Optional[str] = None

class TaxRateCreate(BaseModel):
    name: str
    rate: float
    country: str
    region: Optional[str] = None
    tax_type: str = "vat"


# ── Coupons ──

@router.get("/coupons")
async def get_coupons(active_only: bool = False):
    query = {}
    if active_only:
        query["is_active"] = True
    coupons = await db.coupons.find(query, {"_id": 0}).to_list(100)
    return {"coupons": coupons, "count": len(coupons)}


@router.post("/coupons")
async def create_coupon(coupon: CouponCreate, request: Request):
    existing = await db.coupons.find_one({"code": coupon.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    coupon_doc = {
        "id": str(uuid.uuid4()),
        "code": coupon.code.upper(),
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "max_uses": coupon.max_uses,
        "current_uses": 0,
        "expires_at": coupon.expires_at.isoformat() if coupon.expires_at else None,
        "min_purchase": coupon.min_purchase,
        "applicable_packages": coupon.applicable_packages,
        "description": coupon.description,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.coupons.insert_one(coupon_doc)
    await _audit(f"Created coupon: {coupon.code}", category="coupons", ip=get_client_ip(request))
    return {"success": True, "coupon": {k: v for k, v in coupon_doc.items() if k != "_id"}}


@router.delete("/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, request: Request):
    result = await db.coupons.delete_one({"id": coupon_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    await _audit(f"Deleted coupon: {coupon_id}", category="coupons", ip=get_client_ip(request))
    return {"success": True, "message": "Coupon deleted"}


# ── Tax Rates ──

@router.get("/tax-rates")
async def get_tax_rates():
    rates = await db.tax_rates.find({}, {"_id": 0}).to_list(100)
    return {"tax_rates": rates, "count": len(rates)}


@router.post("/tax-rates")
async def create_tax_rate(tax_rate: TaxRateCreate, request: Request):
    rate_doc = {
        "id": str(uuid.uuid4()),
        "name": tax_rate.name,
        "rate": tax_rate.rate,
        "country": tax_rate.country,
        "region": tax_rate.region,
        "tax_type": tax_rate.tax_type,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.tax_rates.insert_one(rate_doc)
    await _audit(f"Created tax rate: {tax_rate.name}", category="tax_rates", ip=get_client_ip(request))
    return {"success": True, "tax_rate": {k: v for k, v in rate_doc.items() if k != "_id"}}


@router.delete("/tax-rates/{rate_id}")
async def delete_tax_rate(rate_id: str, request: Request):
    result = await db.tax_rates.delete_one({"id": rate_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tax rate not found")
    await _audit(f"Deleted tax rate: {rate_id}", category="tax_rates", ip=get_client_ip(request))
    return {"success": True, "message": "Tax rate deleted"}
