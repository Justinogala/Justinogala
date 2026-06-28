"""
Stripe payment routes for paid events.
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from datetime import datetime, timezone
import os
import uuid

from dotenv import load_dotenv
load_dotenv()

from config import db, logger

router = APIRouter(prefix="/events/payments", tags=["Event Payments"])


async def get_stripe_key():
    """Get Stripe API key from admin settings"""
    settings = await db.admin_settings.find_one({"category": "stripe"})
    if settings and settings.get("api_key"):
        return settings["api_key"]
    return os.environ.get("STRIPE_API_KEY", "")


class CheckoutRequest(BaseModel):
    event_id: str
    email: str
    name: str


@router.post("/create-checkout")
async def create_checkout_session(req: CheckoutRequest):
    """Create a Stripe checkout session for a paid event"""
    event = await db.events.find_one({"id": req.event_id, "deleted": {"$ne": True}})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    price_str = event.get("price", "Free")
    if price_str == "Free" or not price_str:
        raise HTTPException(status_code=400, detail="This event is free, no payment required")

    # Parse price (remove $ sign, convert to cents)
    try:
        amount = int(float(price_str.replace("$", "").replace(",", "").strip()) * 100)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event price")

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid payment amount")

    frontend_url = os.environ.get("FRONTEND_URL", "https://munal.ai")
    payment_id = str(uuid.uuid4())

    try:
        import stripe
        stripe.api_key = await get_stripe_key()
        if not stripe.api_key:
            raise HTTPException(status_code=500, detail="Stripe is not configured")

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": event["title"],
                        "description": f"Munal AI Academy & Events - {event.get('event_format', 'Event')}",
                    },
                    "unit_amount": amount,
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"{frontend_url}/events/{req.event_id}?payment=success&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{frontend_url}/events/{req.event_id}?payment=cancelled",
            customer_email=req.email,
            metadata={
                "event_id": req.event_id,
                "payment_id": payment_id,
                "applicant_name": req.name,
            }
        )

        # Store payment record
        payment_doc = {
            "id": payment_id,
            "event_id": req.event_id,
            "email": req.email,
            "name": req.name,
            "amount": amount,
            "currency": "usd",
            "stripe_session_id": session.id,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.event_payments.insert_one(payment_doc)

        logger.info(f"Checkout session created for event {req.event_id}: {session.id}")
        return {"success": True, "checkout_url": session.url, "session_id": session.id, "payment_id": payment_id}

    except Exception as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=500, detail=f"Payment error: {str(e)}")


@router.get("/verify/{session_id}")
async def verify_payment(session_id: str):
    """Verify a payment session status"""
    try:
        import stripe
        stripe.api_key = await get_stripe_key()
        session = stripe.checkout.Session.retrieve(session_id)
        payment = await db.event_payments.find_one({"stripe_session_id": session_id})

        if payment and session.payment_status == "paid":
            await db.event_payments.update_one(
                {"stripe_session_id": session_id},
                {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}}
            )

        return {
            "status": session.payment_status,
            "amount": session.amount_total,
            "email": session.customer_email,
            "event_id": payment.get("event_id") if payment else None
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/event/{event_id}/revenue")
async def get_event_revenue(event_id: str):
    """Get revenue stats for an event"""
    payments = await db.event_payments.find({"event_id": event_id, "status": "paid"}, {"_id": 0}).to_list(10000)
    total_revenue = sum(p.get("amount", 0) for p in payments) / 100  # cents to dollars
    return {
        "event_id": event_id,
        "total_revenue": total_revenue,
        "total_payments": len(payments),
        "currency": "usd"
    }
