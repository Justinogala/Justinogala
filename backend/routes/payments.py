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



# ============== Plans Management ==============

class PlanCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price_monthly: float
    price_annual: float
    features: list
    limits: Optional[Dict] = None
    is_active: bool = True
    is_popular: bool = False

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_monthly: Optional[float] = None
    price_annual: Optional[float] = None
    features: Optional[list] = None
    limits: Optional[Dict] = None
    is_active: Optional[bool] = None
    is_popular: Optional[bool] = None


@router.get("/plans")
async def get_plans():
    """Get all subscription plans (public endpoint)"""
    try:
        # First check if plans exist in database
        plans = await db.subscription_plans.find({}, {"_id": 0}).sort("price_monthly", 1).to_list(100)
        
        if not plans:
            # Seed default plans if none exist
            default_plans = [
                {
                    "id": "plan_free",
                    "name": "Free",
                    "description": "Perfect for individuals getting started",
                    "price_monthly": 0,
                    "price_annual": 0,
                    "features": [
                        "5 video meetings per month",
                        "30 minutes AI transcription",
                        "1 GB secure cloud storage",
                        "Basic AI-powered transcription",
                        "Instant video meetings with screen share",
                        "1-on-1 team chat messaging",
                        "Personal calendar & scheduling",
                        "Basic meeting summaries",
                        "Mobile responsive access",
                        "Email support"
                    ],
                    "limits": {
                        "meetings": 5,
                        "transcription_minutes": 30,
                        "storage_gb": 1,
                        "workspaces": 1,
                        "team_members": 1
                    },
                    "is_active": True,
                    "is_popular": False,
                    "subscribers": 0,
                    "created_at": datetime.now(timezone.utc).isoformat()
                },
                {
                    "id": "plan_pro",
                    "name": "Pro",
                    "description": "Best for professionals & growing teams",
                    "price_monthly": 29,
                    "price_annual": 290,
                    "features": [
                        "100 video meetings per month",
                        "500 minutes AI transcription",
                        "10 GB secure cloud storage",
                        "Advanced AI transcription with speaker ID",
                        "HD video meetings with recording",
                        "Screen sharing & virtual backgrounds",
                        "Unlimited team chat with file sharing",
                        "Voice chat channels for quick syncs",
                        "Text-to-audio conversion (AI voices)",
                        "Up to 5 team workspaces",
                        "Up to 10 team members per workspace",
                        "Full calendar with Jizira integration",
                        "Meeting recording & playback",
                        "Advanced AI summaries & action items",
                        "Smart search across all content",
                        "Basic analytics dashboard",
                        "Priority email & chat support",
                        "Export to PDF, DOCX, TXT formats",
                        "Custom meeting backgrounds",
                        "Meeting reminders & notifications"
                    ],
                    "limits": {
                        "meetings": 100,
                        "transcription_minutes": 500,
                        "storage_gb": 10,
                        "workspaces": 5,
                        "team_members": 10
                    },
                    "is_active": True,
                    "is_popular": True,
                    "subscribers": 0,
                    "created_at": datetime.now(timezone.utc).isoformat()
                },
                {
                    "id": "plan_enterprise",
                    "name": "Enterprise",
                    "description": "For large organizations & enterprises",
                    "price_monthly": 99,
                    "price_annual": 990,
                    "features": [
                        "Unlimited video meetings",
                        "Unlimited AI transcription minutes",
                        "100 GB secure cloud storage (expandable)",
                        "Everything in Pro plan included",
                        "Unlimited team workspaces",
                        "Unlimited team members",
                        "Full admin dashboard & controls",
                        "User management & role-based access",
                        "Cloud storage config (AWS S3, GCS, Cloudflare R2)",
                        "Data migration & backup tools",
                        "Advanced security & compliance",
                        "SSO & SAML authentication ready",
                        "Custom branding options",
                        "Advanced analytics & reporting",
                        "AI chat assistant for meetings",
                        "Bulk transcription processing",
                        "API access for integrations",
                        "Webhook notifications",
                        "24/7 dedicated support manager",
                        "Phone & video support calls",
                        "Custom onboarding & training",
                        "SLA guarantee (99.9% uptime)",
                        "Priority feature requests",
                        "Quarterly business reviews"
                    ],
                    "limits": {
                        "meetings": -1,
                        "transcription_minutes": -1,
                        "storage_gb": 100,
                        "workspaces": -1,
                        "team_members": -1
                    },
                    "is_active": True,
                    "is_popular": False,
                    "subscribers": 0,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            ]
            await db.subscription_plans.insert_many(default_plans)
            plans = default_plans
        
        return {"plans": plans}
    except Exception as e:
        logger.error(f"Error fetching plans: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/plans")
async def create_plan(plan: PlanCreate):
    """Create a new subscription plan (admin only)"""
    try:
        plan_id = f"plan_{plan.name.lower().replace(' ', '_')}"
        
        plan_doc = {
            "id": plan_id,
            "name": plan.name,
            "description": plan.description,
            "price_monthly": plan.price_monthly,
            "price_annual": plan.price_annual,
            "features": plan.features,
            "limits": plan.limits or {},
            "is_active": plan.is_active,
            "is_popular": plan.is_popular,
            "subscribers": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.subscription_plans.insert_one(plan_doc)
        plan_doc.pop("_id", None)
        
        return {"success": True, "plan": plan_doc}
    except Exception as e:
        logger.error(f"Error creating plan: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/plans/{plan_id}")
async def update_plan(plan_id: str, plan: PlanUpdate):
    """Update a subscription plan (admin only)"""
    try:
        update_data = {k: v for k, v in plan.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # If setting as popular, unset all others
        if plan.is_popular:
            await db.subscription_plans.update_many({}, {"$set": {"is_popular": False}})
        
        result = await db.subscription_plans.update_one(
            {"id": plan_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        updated = await db.subscription_plans.find_one({"id": plan_id}, {"_id": 0})
        return {"success": True, "plan": updated}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating plan: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/plans/{plan_id}")
async def delete_plan(plan_id: str):
    """Delete a subscription plan (admin only)"""
    try:
        result = await db.subscription_plans.delete_one({"id": plan_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        return {"success": True, "message": "Plan deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting plan: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{user_id}/subscription")
async def get_user_subscription(user_id: str):
    """Get user's current subscription and usage"""
    try:
        # Get user's subscription
        subscription = await db.subscriptions.find_one(
            {"user_id": user_id, "status": "active"},
            {"_id": 0}
        )
        
        # Get user's usage stats
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        
        # Calculate usage (mock data for now - would be calculated from actual usage)
        usage = {
            "meetings": {"used": 3, "limit": 5},
            "transcription_minutes": {"used": 15, "limit": 30},
            "storage_gb": {"used": 0.2, "limit": 1},
            "workspaces": {"used": 1, "limit": 1},
            "team_members": {"used": 1, "limit": 1}
        }
        
        # Get plan details if subscribed
        plan = None
        if subscription:
            plan = await db.subscription_plans.find_one(
                {"id": subscription.get("plan_id")},
                {"_id": 0}
            )
            # Update limits based on plan
            if plan and plan.get("limits"):
                for key, limit in plan["limits"].items():
                    if key in usage:
                        usage[key]["limit"] = limit if limit > 0 else "Unlimited"
        
        return {
            "subscription": subscription,
            "plan": plan or {"name": "Free", "price_monthly": 0},
            "usage": usage,
            "user_email": user.get("email") if user else None
        }
    except Exception as e:
        logger.error(f"Error fetching user subscription: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/subscriptions")
async def get_all_subscriptions():
    """Get all subscriptions (admin only)"""
    try:
        subscriptions = await db.subscriptions.find({}, {"_id": 0}).to_list(1000)
        
        # Get plan subscriber counts
        plans = await db.subscription_plans.find({}, {"_id": 0}).to_list(100)
        plan_stats = {}
        
        for plan in plans:
            count = await db.subscriptions.count_documents({
                "plan_id": plan["id"],
                "status": "active"
            })
            plan_stats[plan["id"]] = count
        
        # Calculate MRR
        total_mrr = 0
        for sub in subscriptions:
            if sub.get("status") == "active":
                plan = next((p for p in plans if p["id"] == sub.get("plan_id")), None)
                if plan:
                    total_mrr += plan.get("price_monthly", 0)
        
        return {
            "subscriptions": subscriptions,
            "plan_stats": plan_stats,
            "total_mrr": total_mrr,
            "total_active": len([s for s in subscriptions if s.get("status") == "active"])
        }
    except Exception as e:
        logger.error(f"Error fetching subscriptions: {e}")
        raise HTTPException(status_code=500, detail=str(e))
