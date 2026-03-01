"""
Payment routes - Stripe integration, subscriptions.
"""
from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
from typing import Optional, Dict
from pydantic import BaseModel
import uuid
import os

from config import db, logger

router = APIRouter(prefix="/payments", tags=["Payments"])

# Stripe configuration
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', '')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')

# Subscription packages
SUBSCRIPTION_PACKAGES = {
    "free": {"name": "Free", "price": 0.00, "features": ["5 meetings/month", "1 GB storage", "30 min transcription"]},
    "pro_monthly": {"name": "Pro Monthly", "price": 29.00, "features": ["100 meetings/month", "10 GB storage", "500 min transcription", "Priority support"]},
    "pro_annual": {"name": "Pro Annual", "price": 290.00, "features": ["100 meetings/month", "10 GB storage", "500 min transcription", "Priority support", "2 months free"]},
    "enterprise_monthly": {"name": "Enterprise Monthly", "price": 99.00, "features": ["Unlimited meetings", "100 GB storage", "Unlimited transcription", "24/7 support", "SSO"]},
    "enterprise_annual": {"name": "Enterprise Annual", "price": 990.00, "features": ["Unlimited meetings", "100 GB storage", "Unlimited transcription", "24/7 support", "SSO", "2 months free"]}
}


# ============== Models ==============

class CheckoutRequest(BaseModel):
    package_id: str
    origin_url: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None


# ============== Routes ==============

@router.get("/packages")
async def get_packages():
    """Get available subscription packages"""
    return {"packages": SUBSCRIPTION_PACKAGES}


@router.post("/checkout")
async def create_checkout_session(request: CheckoutRequest):
    """Create a Stripe checkout session"""
    try:
        if not STRIPE_SECRET_KEY:
            raise HTTPException(status_code=500, detail="Stripe not configured")
        
        import stripe
        stripe.api_key = STRIPE_SECRET_KEY
        
        package = SUBSCRIPTION_PACKAGES.get(request.package_id)
        if not package:
            raise HTTPException(status_code=400, detail="Invalid package")
        
        if package["price"] == 0:
            return {"success": True, "message": "Free plan - no payment required"}
        
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "unit_amount": int(package["price"] * 100),
                    "product_data": {
                        "name": package["name"],
                        "description": ", ".join(package["features"][:3])
                    }
                },
                "quantity": 1
            }],
            mode="payment",
            success_url=f"{request.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{request.origin_url}/payment/cancel",
            customer_email=request.user_email,
            metadata={
                "user_id": request.user_id,
                "package_id": request.package_id
            }
        )
        
        # Save transaction
        transaction = {
            "id": str(uuid.uuid4()),
            "session_id": session.id,
            "user_id": request.user_id,
            "user_email": request.user_email,
            "package_id": request.package_id,
            "package_name": package["name"],
            "amount": package["price"],
            "currency": "usd",
            "payment_status": "pending",
            "status": "initiated",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(transaction)
        
        return {"success": True, "session_id": session.id, "url": session.url}
    except Exception as e:
        logger.error(f"Checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{session_id}")
async def get_payment_status(session_id: str):
    """Get payment status by session ID"""
    transaction = await db.payment_transactions.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return transaction


@router.get("/transactions")
async def get_user_transactions(user_id: str, limit: int = 50):
    """Get transactions for a user"""
    transactions = await db.payment_transactions.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"transactions": transactions, "count": len(transactions)}


@router.get("/transactions/all")
async def get_all_transactions(limit: int = 100, offset: int = 0):
    """Get all transactions (admin)"""
    transactions = await db.payment_transactions.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    
    total = await db.payment_transactions.count_documents({})
    
    return {"transactions": transactions, "total": total, "limit": limit, "offset": offset}


# Webhook endpoint for Stripe
webhook_router = APIRouter(tags=["Webhooks"])

@webhook_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    try:
        if not STRIPE_SECRET_KEY or not STRIPE_WEBHOOK_SECRET:
            raise HTTPException(status_code=500, detail="Stripe not configured")
        
        import stripe
        stripe.api_key = STRIPE_SECRET_KEY
        
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")
        
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        except Exception as e:
            logger.error(f"Webhook signature error: {e}")
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            
            await db.payment_transactions.update_one(
                {"session_id": session["id"]},
                {
                    "$set": {
                        "payment_status": "paid",
                        "status": "completed",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            # Update user plan
            metadata = session.get("metadata", {})
            if metadata.get("user_id") and metadata.get("package_id"):
                await db.users.update_one(
                    {"id": metadata["user_id"]},
                    {"$set": {"plan": metadata["package_id"]}}
                )
            
            logger.info(f"Payment completed: {session['id']}")
        
        elif event["type"] == "checkout.session.expired":
            session = event["data"]["object"]
            
            await db.payment_transactions.update_one(
                {"session_id": session["id"]},
                {
                    "$set": {
                        "payment_status": "expired",
                        "status": "expired",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
        
        return {"received": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
