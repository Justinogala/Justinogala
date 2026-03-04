"""
Team/Workspace Billing Routes
Handles billing for workspace teams - allows workspace owners to pay for their team members
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone
from config import db, logger
import uuid
import os

router = APIRouter(prefix="/team-billing", tags=["Team Billing"])


# ============== Models ==============

class TeamBillingPlan(BaseModel):
    id: str
    name: str
    price_per_seat_monthly: float
    price_per_seat_yearly: float
    min_seats: int = 1
    max_seats: int = -1  # -1 = unlimited
    features: List[str] = []
    is_active: bool = True


class TeamSubscription(BaseModel):
    id: str
    workspace_id: str
    owner_id: str
    plan_id: str
    billing_period: str  # "monthly" or "yearly"
    seats: int
    price_per_seat: float
    total_price: float
    status: str  # "active", "cancelled", "past_due", "trialing"
    stripe_subscription_id: Optional[str] = None
    current_period_start: str
    current_period_end: str
    created_at: str
    updated_at: str


class CreateTeamSubscriptionRequest(BaseModel):
    workspace_id: str
    owner_id: str
    plan_id: str
    billing_period: str = "monthly"
    seats: int = 5
    origin_url: str


class UpdateSeatsRequest(BaseModel):
    seats: int


# ============== Default Team Plans ==============

DEFAULT_TEAM_PLANS = [
    {
        "id": "team_starter",
        "name": "Team Starter",
        "price_per_seat_monthly": 8,
        "price_per_seat_yearly": 80,  # ~17% discount
        "min_seats": 3,
        "max_seats": 10,
        "features": [
            "Shared workspace",
            "Team messaging",
            "Basic shift management",
            "5GB shared storage",
            "Email support"
        ],
        "is_active": True
    },
    {
        "id": "team_professional",
        "name": "Team Professional",
        "price_per_seat_monthly": 15,
        "price_per_seat_yearly": 150,  # ~17% discount
        "min_seats": 5,
        "max_seats": 50,
        "features": [
            "Everything in Starter",
            "Advanced shift scheduling",
            "Time tracking & timesheets",
            "25GB shared storage",
            "Priority support",
            "Custom integrations"
        ],
        "is_active": True
    },
    {
        "id": "team_enterprise",
        "name": "Team Enterprise",
        "price_per_seat_monthly": 25,
        "price_per_seat_yearly": 250,  # ~17% discount
        "min_seats": 10,
        "max_seats": -1,
        "features": [
            "Everything in Professional",
            "Unlimited storage",
            "Advanced analytics",
            "SSO integration",
            "Dedicated account manager",
            "Custom SLA",
            "API access"
        ],
        "is_active": True
    }
]


# ============== Helper Functions ==============

async def get_stripe_api_key():
    """Get Stripe API key"""
    settings = await db.admin_settings.find_one({"category": "stripe"})
    if settings and settings.get("api_key"):
        return settings["api_key"]
    return os.environ.get("STRIPE_API_KEY", "")


async def get_team_plan(plan_id: str) -> Optional[Dict]:
    """Get team billing plan by ID"""
    # First check database for custom plans
    plan = await db.team_billing_plans.find_one({"id": plan_id}, {"_id": 0})
    if plan:
        return plan
    
    # Fall back to default plans
    for plan in DEFAULT_TEAM_PLANS:
        if plan["id"] == plan_id:
            return plan
    
    return None


def calculate_annual_savings(monthly_price: float, yearly_price: float, seats: int) -> Dict:
    """Calculate savings for annual billing"""
    monthly_total = monthly_price * seats * 12
    yearly_total = yearly_price * seats
    savings = monthly_total - yearly_total
    savings_percentage = (savings / monthly_total) * 100 if monthly_total > 0 else 0
    
    return {
        "monthly_total_yearly": monthly_total,
        "yearly_total": yearly_total,
        "savings": savings,
        "savings_percentage": round(savings_percentage, 1)
    }


# ============== API Routes ==============

@router.get("/plans")
async def get_team_billing_plans():
    """Get all available team billing plans"""
    # Check for custom plans in database
    custom_plans = await db.team_billing_plans.find(
        {"is_active": True},
        {"_id": 0}
    ).to_list(100)
    
    if custom_plans:
        plans = custom_plans
    else:
        plans = DEFAULT_TEAM_PLANS
    
    # Add savings calculation for each plan
    for plan in plans:
        plan["annual_savings"] = calculate_annual_savings(
            plan["price_per_seat_monthly"],
            plan["price_per_seat_yearly"],
            5  # Default 5 seats for calculation
        )
    
    return {"success": True, "plans": plans}


@router.get("/plans/{plan_id}")
async def get_team_plan_details(plan_id: str):
    """Get details for a specific team plan"""
    plan = await get_team_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    return {"success": True, "plan": plan}


@router.post("/calculate-price")
async def calculate_team_price(plan_id: str, seats: int, billing_period: str = "monthly"):
    """Calculate price for a team subscription"""
    plan = await get_team_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Validate seats
    if seats < plan.get("min_seats", 1):
        raise HTTPException(
            status_code=400, 
            detail=f"Minimum {plan['min_seats']} seats required for this plan"
        )
    
    max_seats = plan.get("max_seats", -1)
    if max_seats != -1 and seats > max_seats:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {max_seats} seats allowed for this plan"
        )
    
    # Calculate prices
    if billing_period == "yearly":
        price_per_seat = plan["price_per_seat_yearly"]
        total_price = price_per_seat * seats
        monthly_equivalent = total_price / 12
    else:
        price_per_seat = plan["price_per_seat_monthly"]
        total_price = price_per_seat * seats
        monthly_equivalent = total_price
    
    # Calculate annual savings
    savings = calculate_annual_savings(
        plan["price_per_seat_monthly"],
        plan["price_per_seat_yearly"],
        seats
    )
    
    return {
        "success": True,
        "calculation": {
            "plan_id": plan_id,
            "plan_name": plan["name"],
            "seats": seats,
            "billing_period": billing_period,
            "price_per_seat": price_per_seat,
            "total_price": total_price,
            "monthly_equivalent": round(monthly_equivalent, 2),
            "annual_savings": savings
        }
    }


@router.post("/checkout")
async def create_team_checkout_session(request: CreateTeamSubscriptionRequest):
    """Create a Stripe checkout session for team billing"""
    try:
        import stripe
        
        # Get plan
        plan = await get_team_plan(request.plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        # Validate seats
        if request.seats < plan.get("min_seats", 1):
            raise HTTPException(
                status_code=400,
                detail=f"Minimum {plan['min_seats']} seats required"
            )
        
        # Get Stripe API key
        api_key = await get_stripe_api_key()
        if not api_key:
            raise HTTPException(status_code=400, detail="Stripe not configured")
        
        stripe.api_key = api_key
        
        # Calculate price
        if request.billing_period == "yearly":
            price_per_seat = plan["price_per_seat_yearly"]
            interval = "year"
        else:
            price_per_seat = plan["price_per_seat_monthly"]
            interval = "month"
        
        total_price = int(price_per_seat * request.seats * 100)  # Stripe uses cents
        
        # Create Stripe checkout session
        session = stripe.checkout.Session.create(
            mode='subscription',
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f"{plan['name']} - {request.seats} seats",
                        'description': "Team billing for workspace",
                    },
                    'unit_amount': total_price,
                    'recurring': {
                        'interval': interval,
                    },
                },
                'quantity': 1,
            }],
            success_url=f"{request.origin_url}/workspace/{request.workspace_id}?team_billing=success&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{request.origin_url}/workspace/{request.workspace_id}?team_billing=cancelled",
            metadata={
                'type': 'team_billing',
                'workspace_id': request.workspace_id,
                'owner_id': request.owner_id,
                'plan_id': request.plan_id,
                'seats': str(request.seats),
                'billing_period': request.billing_period
            }
        )
        
        return {
            "success": True,
            "url": session.url,
            "session_id": session.id
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Team checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/workspace/{workspace_id}/subscription")
async def get_workspace_subscription(workspace_id: str):
    """Get the team subscription for a workspace"""
    subscription = await db.team_subscriptions.find_one(
        {"workspace_id": workspace_id},
        {"_id": 0}
    )
    
    if not subscription:
        return {"success": True, "subscription": None, "has_team_billing": False}
    
    # Get plan details
    plan = await get_team_plan(subscription.get("plan_id"))
    
    return {
        "success": True,
        "subscription": subscription,
        "plan": plan,
        "has_team_billing": True
    }


@router.put("/workspace/{workspace_id}/seats")
async def update_workspace_seats(workspace_id: str, request: UpdateSeatsRequest):
    """Update the number of seats for a workspace subscription"""
    subscription = await db.team_subscriptions.find_one({"workspace_id": workspace_id})
    if not subscription:
        raise HTTPException(status_code=404, detail="No team subscription found for this workspace")
    
    plan = await get_team_plan(subscription.get("plan_id"))
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Validate new seat count
    if request.seats < plan.get("min_seats", 1):
        raise HTTPException(
            status_code=400,
            detail=f"Minimum {plan['min_seats']} seats required for this plan"
        )
    
    max_seats = plan.get("max_seats", -1)
    if max_seats != -1 and request.seats > max_seats:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {max_seats} seats allowed for this plan"
        )
    
    # Calculate new price
    if subscription.get("billing_period") == "yearly":
        price_per_seat = plan["price_per_seat_yearly"]
    else:
        price_per_seat = plan["price_per_seat_monthly"]
    
    new_total = price_per_seat * request.seats
    
    # Update subscription (would also update Stripe in production)
    await db.team_subscriptions.update_one(
        {"workspace_id": workspace_id},
        {
            "$set": {
                "seats": request.seats,
                "total_price": new_total,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {
        "success": True,
        "message": f"Seats updated to {request.seats}",
        "new_total_price": new_total
    }


@router.post("/workspace/{workspace_id}/cancel")
async def cancel_workspace_subscription(workspace_id: str):
    """Cancel a workspace team subscription"""
    subscription = await db.team_subscriptions.find_one({"workspace_id": workspace_id})
    if not subscription:
        raise HTTPException(status_code=404, detail="No team subscription found")
    
    # Update status to cancelled
    await db.team_subscriptions.update_one(
        {"workspace_id": workspace_id},
        {
            "$set": {
                "status": "cancelled",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"success": True, "message": "Subscription cancelled. Access continues until period end."}
