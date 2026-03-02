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
async def get_stripe_prices(billing_period: str = "monthly"):
    """Get Stripe price IDs from admin settings"""
    settings = await db.admin_settings.find_one({"category": "stripe_prices"})
    if settings:
        if billing_period == "yearly":
            return {
                "pro": settings.get("pro_yearly_price_id", "price_pro_yearly_placeholder"),
                "business": settings.get("business_yearly_price_id", "price_business_yearly_placeholder"),
                "enterprise": settings.get("enterprise_yearly_price_id", "price_enterprise_yearly_placeholder")
            }
        else:
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
    billing_period: str = "monthly"  # "monthly" or "yearly"
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
        import stripe
        
        # Validate plan
        valid_plans = ["pro", "business", "enterprise"]
        if request.plan_id not in valid_plans:
            raise HTTPException(status_code=400, detail=f"Invalid plan. Must be one of: {valid_plans}")
        
        # Validate billing period
        valid_periods = ["monthly", "yearly"]
        if request.billing_period not in valid_periods:
            raise HTTPException(status_code=400, detail=f"Invalid billing period. Must be one of: {valid_periods}")
        
        # Get Stripe API key
        api_key = await get_stripe_api_key()
        if not api_key or api_key == "sk_test_emergent":
            raise HTTPException(status_code=400, detail="Stripe API key not configured. Please configure in Admin > Stripe Settings.")
        
        stripe.api_key = api_key
        
        # Get price IDs based on billing period
        prices = await get_stripe_prices(request.billing_period)
        price_id = prices.get(request.plan_id)
        
        if not price_id or "placeholder" in price_id:
            raise HTTPException(
                status_code=400, 
                detail=f"Stripe {request.billing_period} price IDs not configured. Please configure in Admin > Stripe Settings."
            )
        
        # Build success and cancel URLs
        success_url = f"{request.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{request.origin_url}/pricing"
        
        # Create checkout session with SUBSCRIPTION mode for recurring prices
        session = stripe.checkout.Session.create(
            mode='subscription',
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "plan_id": request.plan_id,
                "user_id": request.user_id or "",
                "user_email": request.user_email or ""
            },
            customer_email=request.user_email if request.user_email else None,
        )
        
        # Create payment transaction record
        transaction = {
            "session_id": session.id,
            "plan_id": request.plan_id,
            "user_id": request.user_id,
            "user_email": request.user_email,
            "status": "pending",
            "payment_status": "initiated",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(transaction)
        
        logger.info(f"Checkout session created: {session.id} for plan {request.plan_id}")
        
        return CheckoutResponse(url=session.url, session_id=session.id)
        
    except HTTPException:
        raise
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str):
    """Get payment status for a checkout session and activate subscription if paid"""
    import stripe
    
    try:
        api_key = await get_stripe_api_key()
        stripe.api_key = api_key
        
        # Retrieve checkout session from Stripe
        session = stripe.checkout.Session.retrieve(session_id)
        
        payment_status = session.payment_status
        status = session.status
        amount_total = session.amount_total
        currency = session.currency
        subscription_id = session.subscription
        customer_email = session.customer_email
        metadata = session.metadata or {}
        
        # Update transaction in database
        update_data = {
            "status": status,
            "payment_status": payment_status,
            "amount_total": amount_total,
            "currency": currency,
            "subscription_id": subscription_id,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Check if already processed to prevent duplicate activations
        existing = await db.payment_transactions.find_one({"session_id": session_id})
        
        if existing and existing.get("payment_status") != "paid" and payment_status == "paid":
            # First time marking as paid - update user subscription
            user_id = existing.get("user_id") or metadata.get("user_id")
            plan_id = existing.get("plan_id") or metadata.get("plan_id")
            
            if user_id and plan_id:
                # Update user's subscription plan
                result = await db.users.update_one(
                    {"id": user_id},
                    {
                        "$set": {
                            "subscription_plan": plan_id,
                            "subscription_status": "active",
                            "subscription_id": subscription_id,
                            "subscription_updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                if result.modified_count > 0:
                    update_data["subscription_activated"] = True
                    logger.info(f"Subscription activated for user {user_id}: {plan_id}")
                else:
                    # Try by email
                    if customer_email:
                        result = await db.users.update_one(
                            {"email": customer_email},
                            {
                                "$set": {
                                    "subscription_plan": plan_id,
                                    "subscription_status": "active",
                                    "subscription_id": subscription_id,
                                    "subscription_updated_at": datetime.now(timezone.utc).isoformat()
                                }
                            }
                        )
                        if result.modified_count > 0:
                            update_data["subscription_activated"] = True
                            logger.info(f"Subscription activated by email {customer_email}: {plan_id}")
        
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": update_data}
        )
        
        # Get plan name for response
        plan_id = existing.get("plan_id") if existing else metadata.get("plan_id")
        plan_name = plan_id.capitalize() if plan_id else "Unknown"
        
        return {
            "success": True,
            "session_id": session_id,
            "status": status,
            "payment_status": payment_status,
            "amount_total": amount_total,
            "currency": currency,
            "plan_name": plan_name,
            "subscription_activated": update_data.get("subscription_activated", existing.get("subscription_activated", False) if existing else False)
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error getting payment status: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Payment status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@webhook_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events for subscription payments"""
    import stripe
    
    try:
        api_key = await get_stripe_api_key()
        stripe.api_key = api_key
        
        # Get webhook secret from admin settings (optional but recommended)
        webhook_settings = await db.admin_settings.find_one({"category": "stripe_webhook"})
        webhook_secret = webhook_settings.get("secret") if webhook_settings else None
        
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        # Verify webhook signature if secret is configured
        if webhook_secret and signature:
            try:
                event = stripe.Webhook.construct_event(body, signature, webhook_secret)
            except stripe.error.SignatureVerificationError as e:
                logger.error(f"Webhook signature verification failed: {e}")
                raise HTTPException(status_code=400, detail="Invalid signature")
        else:
            # Parse event without verification (for development/testing)
            import json
            event = json.loads(body)
        
        event_type = event.get("type", "")
        logger.info(f"Webhook received: {event_type}")
        
        # Handle checkout.session.completed event
        if event_type == "checkout.session.completed":
            session = event.get("data", {}).get("object", {})
            session_id = session.get("id")
            payment_status = session.get("payment_status")
            subscription_id = session.get("subscription")
            customer_email = session.get("customer_email")
            metadata = session.get("metadata", {})
            
            logger.info(f"Checkout completed: session={session_id}, status={payment_status}")
            
            # Get transaction from our database
            existing = await db.payment_transactions.find_one({"session_id": session_id})
            
            if existing:
                user_id = existing.get("user_id") or metadata.get("user_id")
                plan_id = existing.get("plan_id") or metadata.get("plan_id")
                
                update_data = {
                    "webhook_event": event_type,
                    "payment_status": payment_status,
                    "subscription_id": subscription_id,
                    "customer_email": customer_email,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                
                # Activate subscription if payment is successful
                if payment_status == "paid" and not existing.get("subscription_activated"):
                    if user_id and plan_id:
                        # Update user's subscription
                        result = await db.users.update_one(
                            {"id": user_id},
                            {
                                "$set": {
                                    "subscription_plan": plan_id,
                                    "subscription_status": "active",
                                    "subscription_id": subscription_id,
                                    "subscription_updated_at": datetime.now(timezone.utc).isoformat()
                                }
                            }
                        )
                        
                        if result.modified_count > 0:
                            update_data["subscription_activated"] = True
                            logger.info(f"Subscription activated for user {user_id}: plan={plan_id}")
                        else:
                            # Try updating by email if user_id didn't match
                            if customer_email:
                                result = await db.users.update_one(
                                    {"email": customer_email},
                                    {
                                        "$set": {
                                            "subscription_plan": plan_id,
                                            "subscription_status": "active",
                                            "subscription_id": subscription_id,
                                            "subscription_updated_at": datetime.now(timezone.utc).isoformat()
                                        }
                                    }
                                )
                                if result.modified_count > 0:
                                    update_data["subscription_activated"] = True
                                    logger.info(f"Subscription activated by email {customer_email}: plan={plan_id}")
                
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": update_data}
                )
            else:
                logger.warning(f"No transaction found for session {session_id}")
        
        # Handle subscription updated events
        elif event_type in ["customer.subscription.updated", "customer.subscription.deleted"]:
            subscription = event.get("data", {}).get("object", {})
            subscription_id = subscription.get("id")
            status = subscription.get("status")  # active, canceled, past_due, etc.
            
            logger.info(f"Subscription {event_type}: {subscription_id}, status={status}")
            
            # Update user subscription status
            if subscription_id:
                new_status = "active" if status == "active" else status
                await db.users.update_one(
                    {"subscription_id": subscription_id},
                    {"$set": {"subscription_status": new_status}}
                )
        
        # Handle invoice payment events
        elif event_type == "invoice.payment_succeeded":
            invoice = event.get("data", {}).get("object", {})
            subscription_id = invoice.get("subscription")
            logger.info(f"Invoice payment succeeded for subscription {subscription_id}")
        
        elif event_type == "invoice.payment_failed":
            invoice = event.get("data", {}).get("object", {})
            subscription_id = invoice.get("subscription")
            logger.warning(f"Invoice payment failed for subscription {subscription_id}")
            
            if subscription_id:
                await db.users.update_one(
                    {"subscription_id": subscription_id},
                    {"$set": {"subscription_status": "past_due"}}
                )
        
        return {"success": True, "event": event_type}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Admin Stripe Settings ==============

class StripeSettingsUpdate(BaseModel):
    api_key: Optional[str] = None
    webhook_secret: Optional[str] = None
    # Monthly prices
    pro_price_id: Optional[str] = None
    business_price_id: Optional[str] = None
    enterprise_price_id: Optional[str] = None
    # Yearly prices
    pro_yearly_price_id: Optional[str] = None
    business_yearly_price_id: Optional[str] = None
    enterprise_yearly_price_id: Optional[str] = None


@router.get("/admin/stripe-settings")
async def get_stripe_settings():
    """Get Stripe settings (API key masked)"""
    try:
        stripe_settings = await db.admin_settings.find_one({"category": "stripe"})
        price_settings = await db.admin_settings.find_one({"category": "stripe_prices"})
        webhook_settings = await db.admin_settings.find_one({"category": "stripe_webhook"})
        
        api_key = stripe_settings.get("api_key", "") if stripe_settings else ""
        masked_key = f"{api_key[:7]}...{api_key[-4:]}" if len(api_key) > 12 else ""
        
        webhook_secret = webhook_settings.get("secret", "") if webhook_settings else ""
        webhook_configured = bool(webhook_secret and webhook_secret.startswith("whsec_"))
        
        return {
            "success": True,
            "configured": bool(api_key and not api_key.startswith("sk_test_emergent")),
            "api_key_preview": masked_key if api_key else None,
            "webhook_configured": webhook_configured,
            "prices": {
                "pro": price_settings.get("pro_price_id", "") if price_settings else "",
                "business": price_settings.get("business_price_id", "") if price_settings else "",
                "enterprise": price_settings.get("enterprise_price_id", "") if price_settings else ""
            },
            "yearly_prices": {
                "pro": price_settings.get("pro_yearly_price_id", "") if price_settings else "",
                "business": price_settings.get("business_yearly_price_id", "") if price_settings else "",
                "enterprise": price_settings.get("enterprise_yearly_price_id", "") if price_settings else ""
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
        
        # Update webhook secret if provided
        if request.webhook_secret:
            await db.admin_settings.update_one(
                {"category": "stripe_webhook"},
                {
                    "$set": {
                        "category": "stripe_webhook",
                        "secret": request.webhook_secret,
                        "updated_at": now
                    }
                },
                upsert=True
            )
        
        # Update price IDs if any provided
        price_update = {}
        # Monthly prices
        if request.pro_price_id:
            price_update["pro_price_id"] = request.pro_price_id
        if request.business_price_id:
            price_update["business_price_id"] = request.business_price_id
        if request.enterprise_price_id:
            price_update["enterprise_price_id"] = request.enterprise_price_id
        # Yearly prices
        if request.pro_yearly_price_id:
            price_update["pro_yearly_price_id"] = request.pro_yearly_price_id
        if request.business_yearly_price_id:
            price_update["business_yearly_price_id"] = request.business_yearly_price_id
        if request.enterprise_yearly_price_id:
            price_update["enterprise_yearly_price_id"] = request.enterprise_yearly_price_id
        
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


# ============== Plans Endpoints ==============

# Default plans configuration - 4-tier structure
DEFAULT_PLANS = [
    {
        "id": "free",
        "name": "Free",
        "description": "Perfect for individuals getting started",
        "price_monthly": 0,
        "price_annual": 0,
        "is_popular": False,
        "features": [
            "5 video meetings per month",
            "30 minutes AI transcription",
            "1 GB secure cloud storage",
            "Basic AI-powered transcription",
            "Instant video meetings with screen share",
            "Team chat messaging",
            "Calendar & scheduling",
            "Text-to-Audio conversion (basic)",
            "Email support"
        ],
        "limits": {
            "meetings_per_month": 5,
            "transcription_minutes": 30,
            "storage_gb": 1,
            "workspaces": 1,
            "team_members": 1,
            "video_duration_seconds": 4
        }
    },
    {
        "id": "pro",
        "name": "Pro",
        "description": "Best for professionals & growing teams",
        "price_monthly": 19,
        "price_annual": 190,
        "is_popular": True,
        "features": [
            "50 video meetings per month",
            "300 minutes AI transcription",
            "5 GB secure cloud storage",
            "AI-powered transcription",
            "HD video meetings with recording",
            "Team chat messaging",
            "Voice chat channels",
            "Text-to-Audio conversion",
            "Priority email support",
            "Speaker identification",
            "3 team workspaces",
            "Up to 5 team members",
            "Text-to-Video (up to 8s)"
        ],
        "limits": {
            "meetings_per_month": 50,
            "transcription_minutes": 300,
            "storage_gb": 5,
            "workspaces": 3,
            "team_members": 5,
            "video_duration_seconds": 8
        }
    },
    {
        "id": "business",
        "name": "Business",
        "description": "For growing teams and startups",
        "price_monthly": 39,
        "price_annual": 390,
        "is_popular": False,
        "features": [
            "150 video meetings per month",
            "1000 minutes AI transcription",
            "25 GB secure cloud storage",
            "Advanced AI transcription with speaker ID",
            "HD video meetings with recording",
            "Screen sharing & collaboration",
            "Unlimited team chat",
            "Voice chat channels",
            "Priority support",
            "AI meeting summaries",
            "10 team workspaces",
            "Up to 25 team members",
            "Text-to-Video (up to 24s)",
            "Extended multi-clip video",
            "Admin dashboard",
            "Advanced analytics",
            "Custom integrations"
        ],
        "limits": {
            "meetings_per_month": 150,
            "transcription_minutes": 1000,
            "storage_gb": 25,
            "workspaces": 10,
            "team_members": 25,
            "video_duration_seconds": 24
        }
    },
    {
        "id": "enterprise",
        "name": "Enterprise",
        "description": "For large organizations",
        "price_monthly": 79,
        "price_annual": 790,
        "is_popular": False,
        "features": [
            "Unlimited video meetings",
            "Unlimited AI transcription",
            "100 GB secure cloud storage",
            "Enterprise-grade AI transcription",
            "4K video meetings with recording",
            "Screen sharing & virtual backgrounds",
            "Unlimited team chat",
            "Voice chat channels",
            "24/7 dedicated support",
            "AI meeting summaries & insights",
            "Unlimited workspaces",
            "Unlimited team members",
            "Text-to-Video (up to 60s)",
            "Extended multi-clip video",
            "Full admin dashboard",
            "Cloud provider configuration",
            "Custom branding",
            "SSO/SAML integration",
            "Dedicated account manager",
            "SLA guarantee",
            "API access"
        ],
        "limits": {
            "meetings_per_month": -1,
            "transcription_minutes": -1,
            "storage_gb": 100,
            "workspaces": -1,
            "team_members": -1,
            "video_duration_seconds": 60
        }
    }
]


@router.get("/payments/plans")
async def get_plans():
    """Get all subscription plans"""
    try:
        # Try to get plans from database (if admin customized)
        db_plans = await db.plans.find({}, {"_id": 0}).to_list(10)
        
        if db_plans and len(db_plans) >= 4:
            return {"success": True, "plans": db_plans}
        
        # If no DB plans, initialize them from defaults
        if not db_plans or len(db_plans) < 4:
            for plan in DEFAULT_PLANS:
                # Add default is_active status
                plan_with_status = {**plan, "is_active": True}
                await db.plans.update_one(
                    {"id": plan["id"]},
                    {"$set": plan_with_status},
                    upsert=True
                )
            # Fetch again
            db_plans = await db.plans.find({}, {"_id": 0}).to_list(10)
            if db_plans:
                return {"success": True, "plans": db_plans}
        
        # Return default plans with is_active
        plans_with_status = [{**p, "is_active": True} for p in DEFAULT_PLANS]
        return {"success": True, "plans": plans_with_status}
    except Exception as e:
        logger.error(f"Error getting plans: {e}")
        plans_with_status = [{**p, "is_active": True} for p in DEFAULT_PLANS]
        return {"success": True, "plans": plans_with_status}


@router.get("/payments/user/{user_id}/subscription")
async def get_user_subscription(user_id: str):
    """Get user's subscription status and usage"""
    try:
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        
        if not user:
            return {
                "success": True,
                "subscription": None,
                "plan": DEFAULT_PLANS[0],
                "usage": {
                    "meetings": {"used": 0, "limit": 5},
                    "transcription_minutes": {"used": 0, "limit": 30},
                    "storage_gb": {"used": 0, "limit": 1},
                    "workspaces": {"used": 1, "limit": 1},
                    "team_members": {"used": 1, "limit": 1}
                }
            }
        
        # Get user's plan
        plan_id = user.get("subscription_plan", "free")
        plan = next((p for p in DEFAULT_PLANS if p["id"] == plan_id), DEFAULT_PLANS[0])
        
        # Get usage from usage_metrics collection
        usage_doc = await db.usage_metrics.find_one({"user_id": user_id}, {"_id": 0})
        
        limits = plan.get("limits", {})
        usage = {
            "meetings": {
                "used": usage_doc.get("meetings_used", 0) if usage_doc else 0,
                "limit": limits.get("meetings_per_month", 5)
            },
            "transcription_minutes": {
                "used": usage_doc.get("transcription_minutes_used", 0) if usage_doc else 0,
                "limit": limits.get("transcription_minutes", 30)
            },
            "storage_gb": {
                "used": usage_doc.get("storage_gb_used", 0) if usage_doc else 0,
                "limit": limits.get("storage_gb", 1)
            },
            "workspaces": {
                "used": usage_doc.get("workspaces_used", 1) if usage_doc else 1,
                "limit": limits.get("workspaces", 1)
            },
            "team_members": {
                "used": usage_doc.get("team_members_used", 1) if usage_doc else 1,
                "limit": limits.get("team_members", 1)
            }
        }
        
        subscription = {
            "plan_id": plan_id,
            "status": user.get("subscription_status", "active"),
            "renewal_date": user.get("subscription_updated_at")
        }
        
        return {
            "success": True,
            "subscription": subscription,
            "plan": plan,
            "usage": usage
        }
    except Exception as e:
        logger.error(f"Error getting user subscription: {e}")
        return {
            "success": False,
            "subscription": None,
            "plan": DEFAULT_PLANS[0],
            "usage": {
                "meetings": {"used": 0, "limit": 5},
                "transcription_minutes": {"used": 0, "limit": 30},
                "storage_gb": {"used": 0, "limit": 1},
                "workspaces": {"used": 1, "limit": 1},
                "team_members": {"used": 1, "limit": 1}
            }
        }


@router.post("/admin/plans")
async def update_plans(plans: list):
    """Admin: Update subscription plans in database"""
    try:
        # Clear existing plans
        await db.plans.delete_many({})
        
        # Insert new plans
        for plan in plans:
            await db.plans.insert_one(plan)
        
        return {"success": True, "message": f"Updated {len(plans)} plans"}
    except Exception as e:
        logger.error(f"Error updating plans: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_monthly: Optional[float] = None
    price_annual: Optional[float] = None
    features: Optional[list] = None
    is_active: Optional[bool] = None
    is_popular: Optional[bool] = None


@router.put("/payments/plans/{plan_id}")
async def update_plan(plan_id: str, request: PlanUpdate):
    """Update a specific plan's settings"""
    try:
        # First check if plan exists in database
        existing_plan = await db.plans.find_one({"id": plan_id})
        
        if not existing_plan:
            # Initialize plans in DB from defaults if not present
            db_plans = await db.plans.find({}, {"_id": 0}).to_list(10)
            if not db_plans or len(db_plans) < 4:
                # Insert default plans into database
                for plan in DEFAULT_PLANS:
                    await db.plans.update_one(
                        {"id": plan["id"]},
                        {"$set": plan},
                        upsert=True
                    )
        
        # Build update dict from non-None values
        update_data = {}
        if request.name is not None:
            update_data["name"] = request.name
        if request.description is not None:
            update_data["description"] = request.description
        if request.price_monthly is not None:
            update_data["price_monthly"] = request.price_monthly
        if request.price_annual is not None:
            update_data["price_annual"] = request.price_annual
        if request.features is not None:
            update_data["features"] = request.features
        if request.is_active is not None:
            update_data["is_active"] = request.is_active
        if request.is_popular is not None:
            update_data["is_popular"] = request.is_popular
            # If setting this plan as popular, unset others
            if request.is_popular:
                await db.plans.update_many(
                    {"id": {"$ne": plan_id}},
                    {"$set": {"is_popular": False}}
                )
        
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Update the plan
        result = await db.plans.update_one(
            {"id": plan_id},
            {"$set": update_data}
        )
        
        if result.modified_count > 0 or result.matched_count > 0:
            updated_plan = await db.plans.find_one({"id": plan_id}, {"_id": 0})
            logger.info(f"Plan {plan_id} updated: {update_data}")
            return {"success": True, "plan": updated_plan}
        else:
            raise HTTPException(status_code=404, detail=f"Plan {plan_id} not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating plan {plan_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/payments/plans")
async def create_plan(request: PlanUpdate):
    """Create a new subscription plan"""
    try:
        if not request.name:
            raise HTTPException(status_code=400, detail="Plan name is required")
        
        # Generate plan ID from name
        plan_id = request.name.lower().replace(" ", "_")
        
        # Check if plan already exists
        existing = await db.plans.find_one({"id": plan_id})
        if existing:
            raise HTTPException(status_code=400, detail=f"Plan '{request.name}' already exists")
        
        new_plan = {
            "id": plan_id,
            "name": request.name,
            "description": request.description or "",
            "price_monthly": request.price_monthly or 0,
            "price_annual": request.price_annual or 0,
            "features": request.features or [],
            "is_active": request.is_active if request.is_active is not None else True,
            "is_popular": request.is_popular or False,
            "limits": {},
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.plans.insert_one(new_plan)
        
        # Remove _id before returning
        new_plan.pop("_id", None)
        
        logger.info(f"New plan created: {plan_id}")
        return {"success": True, "plan": new_plan}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating plan: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/payments/plans/{plan_id}")
async def delete_plan(plan_id: str):
    """Delete a subscription plan"""
    try:
        # Don't allow deleting default plans
        default_ids = ["free", "pro", "business", "enterprise"]
        if plan_id in default_ids:
            raise HTTPException(status_code=400, detail="Cannot delete default plans")
        
        result = await db.plans.delete_one({"id": plan_id})
        
        if result.deleted_count > 0:
            logger.info(f"Plan deleted: {plan_id}")
            return {"success": True, "message": f"Plan {plan_id} deleted"}
        else:
            raise HTTPException(status_code=404, detail=f"Plan {plan_id} not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting plan {plan_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/payments/admin/subscriptions")
async def get_subscription_stats():
    """Get subscription statistics for admin dashboard"""
    try:
        # Count subscribers per plan
        plan_stats = {}
        total_mrr = 0
        total_active = 0
        
        # Get all users with subscriptions
        pipeline = [
            {"$match": {"subscription_plan": {"$exists": True, "$ne": "free"}}},
            {"$group": {
                "_id": "$subscription_plan",
                "count": {"$sum": 1}
            }}
        ]
        
        async for stat in db.users.aggregate(pipeline):
            plan_id = stat["_id"]
            count = stat["count"]
            plan_stats[plan_id] = count
            total_active += count
            
            # Calculate MRR
            plan = next((p for p in DEFAULT_PLANS if p["id"] == plan_id), None)
            if plan:
                total_mrr += plan["price_monthly"] * count
        
        return {
            "success": True,
            "total_mrr": total_mrr,
            "total_active": total_active,
            "plan_stats": plan_stats
        }
        
    except Exception as e:
        logger.error(f"Error getting subscription stats: {e}")
        return {
            "success": True,
            "total_mrr": 0,
            "total_active": 0,
            "plan_stats": {}
        }

