"""
Academy Subscriptions — Stripe recurring subscriptions for Pro/Enterprise plans.
Uses emergentintegrations Stripe checkout for payment processing.
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone
from pydantic import BaseModel
import uuid
import os

from config import db, logger
from routes.auth_helpers import get_current_user

router = APIRouter(prefix="/academy/subscriptions", tags=["Academy Subscriptions"])

# Subscription plans defined server-side (never trust frontend amounts)
PLANS = {
    "free": {"name": "Free", "price": 0, "features": ["5 free courses", "Community access", "Event browsing"]},
    "pro": {"name": "Pro", "price": 29.00, "features": ["All courses", "Premium content", "Livestream access", "Certificates", "Priority support"]},
    "enterprise": {"name": "Enterprise", "price": 99.00, "features": ["Everything in Pro", "Team seats (up to 25)", "Custom learning paths", "API access", "Dedicated support", "Analytics dashboard"]},
}


class SubscribeRequest(BaseModel):
    plan: str
    origin_url: str


class CancelRequest(BaseModel):
    reason: str = ""


@router.get("/plans")
async def get_plans():
    """Get available subscription plans"""
    return {"plans": PLANS}


@router.get("/status")
async def get_subscription_status(user=Depends(get_current_user)):
    """Get current user's subscription status"""
    user_id = user.get("id")
    sub = await db.subscriptions.find_one(
        {"user_id": user_id, "status": "active"},
        {"_id": 0}
    )
    if sub:
        return {
            "active": True,
            "plan": sub.get("plan"),
            "current_period_end": sub.get("current_period_end"),
            "created_at": sub.get("created_at"),
        }
    return {"active": False, "plan": "free"}


@router.post("/checkout")
async def create_subscription_checkout(req: SubscribeRequest, request: Request, user=Depends(get_current_user)):
    """Create a Stripe checkout session for subscription"""
    if req.plan not in ("pro", "enterprise"):
        raise HTTPException(status_code=400, detail="Invalid plan. Choose 'pro' or 'enterprise'.")

    plan = PLANS[req.plan]
    amount = plan["price"]
    user_id = user.get("id")
    user_email = user.get("email", "")

    # Check if already subscribed
    existing = await db.subscriptions.find_one({"user_id": user_id, "status": "active"})
    if existing and existing.get("plan") == req.plan:
        raise HTTPException(status_code=400, detail=f"Already subscribed to {req.plan} plan")

    api_key = os.environ.get("STRIPE_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="Payment not configured")

    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest

    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)

    origin = req.origin_url.rstrip("/")
    success_url = f"{origin}/academy/subscription?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/academy/subscription?payment=cancelled"

    payment_id = str(uuid.uuid4())
    metadata = {
        "type": "subscription",
        "plan": req.plan,
        "user_id": user_id,
        "user_email": user_email,
        "payment_id": payment_id,
    }

    checkout_req = CheckoutSessionRequest(
        amount=amount,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )

    session = await stripe_checkout.create_checkout_session(checkout_req)

    # Create payment transaction record
    tx = {
        "id": payment_id,
        "user_id": user_id,
        "user_email": user_email,
        "type": "subscription",
        "plan": req.plan,
        "amount": amount,
        "currency": "usd",
        "stripe_session_id": session.session_id,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.payment_transactions.insert_one(tx)

    logger.info(f"Subscription checkout created for {user_email} - {req.plan}: {session.session_id}")
    return {"success": True, "checkout_url": session.url, "session_id": session.session_id}


@router.get("/checkout/status/{session_id}")
async def check_payment_status(session_id: str, user=Depends(get_current_user)):
    """Check subscription payment status and activate if paid"""
    api_key = os.environ.get("STRIPE_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="Payment not configured")

    from emergentintegrations.payments.stripe.checkout import StripeCheckout

    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")

    status_resp = await stripe_checkout.get_checkout_status(session_id)

    # Update transaction
    tx = await db.payment_transactions.find_one({"stripe_session_id": session_id})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Prevent duplicate processing
    if tx.get("status") == "completed":
        sub = await db.subscriptions.find_one({"user_id": tx["user_id"], "status": "active"}, {"_id": 0, "plan": 1})
        return {"status": "paid", "plan": sub.get("plan") if sub else tx.get("plan"), "already_processed": True}

    if status_resp.payment_status == "paid":
        # Update transaction
        await db.payment_transactions.update_one(
            {"stripe_session_id": session_id, "status": {"$ne": "completed"}},
            {"$set": {"status": "completed", "paid_at": datetime.now(timezone.utc).isoformat()}}
        )

        # Deactivate old subscription if any
        await db.subscriptions.update_many(
            {"user_id": tx["user_id"], "status": "active"},
            {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}}
        )

        # Create new subscription
        from datetime import timedelta
        sub_doc = {
            "id": str(uuid.uuid4()),
            "user_id": tx["user_id"],
            "user_email": tx.get("user_email"),
            "plan": tx["plan"],
            "status": "active",
            "stripe_session_id": session_id,
            "amount": tx["amount"],
            "current_period_start": datetime.now(timezone.utc).isoformat(),
            "current_period_end": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.subscriptions.insert_one(sub_doc)

        # Update user record with plan
        await db.users.update_one(
            {"id": tx["user_id"]},
            {"$set": {"plan": tx["plan"].capitalize(), "subscription_active": True}}
        )

        logger.info(f"Subscription activated: {tx['user_email']} -> {tx['plan']}")
        return {"status": "paid", "plan": tx["plan"]}

    return {
        "status": status_resp.payment_status,
        "plan": tx.get("plan"),
    }


@router.post("/cancel")
async def cancel_subscription(req: CancelRequest, user=Depends(get_current_user)):
    """Cancel active subscription"""
    user_id = user.get("id")
    sub = await db.subscriptions.find_one({"user_id": user_id, "status": "active"})
    if not sub:
        raise HTTPException(status_code=400, detail="No active subscription")

    await db.subscriptions.update_one(
        {"id": sub["id"]},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat(), "cancel_reason": req.reason}}
    )
    await db.users.update_one({"id": user_id}, {"$set": {"plan": "Free", "subscription_active": False}})

    logger.info(f"Subscription cancelled: {user.get('email')} - {sub.get('plan')}")
    return {"success": True, "message": "Subscription cancelled. Access continues until period end."}


# ============== Admin ==============

@router.get("/admin/all")
async def admin_list_subscriptions(user=Depends(get_current_user)):
    """List all subscriptions (admin only)"""
    role = (user.get("role") or "").lower().replace(" ", "_")
    if role not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    subs = await db.subscriptions.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    stats = {"active": 0, "cancelled": 0, "total_revenue": 0}
    for s in subs:
        if s.get("status") == "active":
            stats["active"] += 1
        else:
            stats["cancelled"] += 1
        stats["total_revenue"] += s.get("amount", 0)

    return {"subscriptions": subs, "stats": stats}
