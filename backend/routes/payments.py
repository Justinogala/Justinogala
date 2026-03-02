"""
Stripe Payment Routes
Handles subscription checkout, payment status, and webhooks
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime, timezone
import os
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
webhook_router = APIRouter()  # Separate router for webhook (no /api prefix needed)

# Database connection
from config import db

# Get Stripe API key from environment or admin settings
async def get_stripe_api_key():
    """Get Stripe API key from admin settings or environment"""
    settings = await db.admin_settings.find_one({"category": "stripe"})
    if settings and settings.get("api_key"):
        return settings["api_key"]
    return os.environ.get("STRIPE_API_KEY", "sk_test_emergent")

# Get Stripe price IDs from admin settings
async def get_stripe_prices():
    """Get Stripe price IDs from admin settings"""
    settings = await db.admin_settings.find_one({"category": "stripe_prices"})
    if settings:
        return {
            "pro": settings.get("pro_price_id", "price_pro_placeholder"),
            "business": settings.get("business_price_id", "price_business_placeholder"),
            "enterprise": settings.get("enterprise_price_id", "price_enterprise_placeholder")
        }
    return {
        "pro": "price_pro_placeholder",
        "business": "price_business_placeholder",
        "enterprise": "price_enterprise_placeholder"
    }


class CheckoutRequest(BaseModel):
    plan_id: str  # "pro", "business", "enterprise"
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    origin_url: str  # Frontend origin for success/cancel URLs


class CheckoutResponse(BaseModel):
    url: str
    session_id: str


@router.post("/payments/checkout")
async def create_checkout_session(request: CheckoutRequest):
    """Create a Stripe checkout session for subscription"""
    try:
        from emergentintegrations.payments.stripe.checkout import (
            StripeCheckout, CheckoutSessionRequest
        )
        
        # Validate plan
        valid_plans = ["pro", "business", "enterprise"]
        if request.plan_id not in valid_plans:
            raise HTTPException(status_code=400, detail=f"Invalid plan. Must be one of: {valid_plans}")
        
        # Get Stripe API key
        api_key = await get_stripe_api_key()
        if not api_key or api_key == "sk_test_emergent":
            # Check if it's a placeholder
            logger.warning("Using test/placeholder Stripe key")
        
        # Get price IDs
        prices = await get_stripe_prices()
        price_id = prices.get(request.plan_id)
        
        if not price_id or "placeholder" in price_id:
            raise HTTPException(
                status_code=400, 
                detail="Stripe price IDs not configured. Please configure in Admin > Stripe Settings."
            )
        
        # Build success and cancel URLs
        success_url = f"{request.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{request.origin_url}/pricing"
        
        # Initialize Stripe checkout
        webhook_url = f"{request.origin_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
        
        # Create checkout session
        checkout_request = CheckoutSessionRequest(
            stripe_price_id=price_id,
            quantity=1,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "plan_id": request.plan_id,
                "user_id": request.user_id or "",
                "user_email": request.user_email or ""
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        transaction = {
            "session_id": session.session_id,
            "plan_id": request.plan_id,
            "user_id": request.user_id,
            "user_email": request.user_email,
            "status": "pending",
            "payment_status": "initiated",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(transaction)
        
        logger.info(f"Checkout session created: {session.session_id} for plan {request.plan_id}")
        
        return CheckoutResponse(url=session.url, session_id=session.session_id)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str):
    """Get payment status for a checkout session"""
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        
        api_key = await get_stripe_api_key()
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
        
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction in database
        update_data = {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Check if already processed to prevent duplicate credit additions
        existing = await db.payment_transactions.find_one({"session_id": session_id})
        
        if existing and existing.get("payment_status") != "paid" and status.payment_status == "paid":
            # First time marking as paid - update user subscription
            user_id = existing.get("user_id")
            plan_id = existing.get("plan_id")
            
            if user_id and plan_id:
                # Update user's subscription plan
                await db.users.update_one(
                    {"id": user_id},
                    {
                        "$set": {
                            "subscription_plan": plan_id,
                            "subscription_status": "active",
                            "subscription_updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                update_data["subscription_activated"] = True
                logger.info(f"Subscription activated for user {user_id}: {plan_id}")
        
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": update_data}
        )
        
        return {
            "success": True,
            "session_id": session_id,
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency
        }
        
    except Exception as e:
        logger.error(f"Payment status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@webhook_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        
        api_key = await get_stripe_api_key()
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
        
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        logger.info(f"Webhook received: {webhook_response.event_type} - {webhook_response.session_id}")
        
        # Update transaction based on webhook event
        if webhook_response.session_id:
            update_data = {
                "webhook_event": webhook_response.event_type,
                "payment_status": webhook_response.payment_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Handle successful payment
            if webhook_response.payment_status == "paid":
                existing = await db.payment_transactions.find_one({"session_id": webhook_response.session_id})
                
                if existing and not existing.get("subscription_activated"):
                    user_id = existing.get("user_id")
                    plan_id = existing.get("plan_id")
                    
                    if user_id and plan_id:
                        await db.users.update_one(
                            {"id": user_id},
                            {
                                "$set": {
                                    "subscription_plan": plan_id,
                                    "subscription_status": "active",
                                    "subscription_updated_at": datetime.now(timezone.utc).isoformat()
                                }
                            }
                        )
                        update_data["subscription_activated"] = True
            
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": update_data}
            )
        
        return {"success": True, "event": webhook_response.event_type}
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Admin Stripe Settings ==============

class StripeSettingsUpdate(BaseModel):
    api_key: Optional[str] = None
    pro_price_id: Optional[str] = None
    business_price_id: Optional[str] = None
    enterprise_price_id: Optional[str] = None


@router.get("/admin/stripe-settings")
async def get_stripe_settings():
    """Get Stripe settings (API key masked)"""
    try:
        stripe_settings = await db.admin_settings.find_one({"category": "stripe"})
        price_settings = await db.admin_settings.find_one({"category": "stripe_prices"})
        
        api_key = stripe_settings.get("api_key", "") if stripe_settings else ""
        masked_key = f"{api_key[:7]}...{api_key[-4:]}" if len(api_key) > 12 else ""
        
        return {
            "success": True,
            "configured": bool(api_key and not api_key.startswith("sk_test_emergent")),
            "api_key_preview": masked_key if api_key else None,
            "prices": {
                "pro": price_settings.get("pro_price_id", "") if price_settings else "",
                "business": price_settings.get("business_price_id", "") if price_settings else "",
                "enterprise": price_settings.get("enterprise_price_id", "") if price_settings else ""
            },
            "updated_at": stripe_settings.get("updated_at") if stripe_settings else None
        }
    except Exception as e:
        logger.error(f"Error getting Stripe settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/stripe-settings")
async def update_stripe_settings(request: StripeSettingsUpdate):
    """Update Stripe settings"""
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        # Update API key if provided
        if request.api_key:
            await db.admin_settings.update_one(
                {"category": "stripe"},
                {
                    "$set": {
                        "category": "stripe",
                        "api_key": request.api_key,
                        "updated_at": now
                    }
                },
                upsert=True
            )
        
        # Update price IDs if any provided
        price_update = {}
        if request.pro_price_id:
            price_update["pro_price_id"] = request.pro_price_id
        if request.business_price_id:
            price_update["business_price_id"] = request.business_price_id
        if request.enterprise_price_id:
            price_update["enterprise_price_id"] = request.enterprise_price_id
        
        if price_update:
            price_update["category"] = "stripe_prices"
            price_update["updated_at"] = now
            await db.admin_settings.update_one(
                {"category": "stripe_prices"},
                {"$set": price_update},
                upsert=True
            )
        
        return {"success": True, "message": "Stripe settings updated"}
        
    except Exception as e:
        logger.error(f"Error updating Stripe settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/payment-transactions")
async def get_payment_transactions(limit: int = 50):
    """Get recent payment transactions"""
    try:
        transactions = await db.payment_transactions.find(
            {},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return {"success": True, "transactions": transactions, "count": len(transactions)}
    except Exception as e:
        logger.error(f"Error getting transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))
