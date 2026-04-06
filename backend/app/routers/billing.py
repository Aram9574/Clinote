from fastapi import APIRouter, Depends, HTTPException, Request, Header
from pydantic import BaseModel
from typing import Optional
import stripe
import logging

from app.config import get_settings
from app.middleware.auth import get_current_user_with_profile, get_supabase_client

logger = logging.getLogger(__name__)
router = APIRouter()


def get_stripe():
    settings = get_settings()
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Stripe not configured")
    stripe.api_key = settings.stripe_secret_key
    return stripe


class CheckoutRequest(BaseModel):
    price_id: str
    success_url: str = "http://localhost:3000/billing?success=true"
    cancel_url: str = "http://localhost:3000/billing?cancelled=true"


@router.post("/billing/checkout")
async def create_checkout_session(
    checkout_req: CheckoutRequest,
    user_data=Depends(get_current_user_with_profile),
    supabase_client=Depends(get_supabase_client)
):
    """Create a Stripe Checkout session for plan upgrade."""
    stripe_client = get_stripe()
    settings = get_settings()
    profile = user_data["profile"]
    user_id = profile["id"]

    # Validate price_id is one of our known prices
    allowed_prices = [settings.stripe_pro_price_id, settings.stripe_clinic_price_id]
    if checkout_req.price_id not in allowed_prices:
        raise HTTPException(status_code=400, detail="Invalid price ID")

    # Get or create Stripe customer for this org
    org_id = profile.get("org_id")
    stripe_customer_id = None

    if org_id:
        org_resp = supabase_client.table("organizations").select("stripe_customer_id, name").eq("id", org_id).single().execute()
        if org_resp.data:
            stripe_customer_id = org_resp.data.get("stripe_customer_id")

            if not stripe_customer_id:
                # Create Stripe customer
                customer = stripe_client.Customer.create(
                    email=profile.get("email", user_data["auth_user"].email),
                    name=org_resp.data.get("name", ""),
                    metadata={"org_id": org_id, "user_id": user_id}
                )
                stripe_customer_id = customer.id
                supabase_client.table("organizations").update(
                    {"stripe_customer_id": stripe_customer_id}
                ).eq("id", org_id).execute()

    try:
        session_params = {
            "mode": "subscription",
            "payment_method_types": ["card"],
            "line_items": [{"price": checkout_req.price_id, "quantity": 1}],
            "success_url": checkout_req.success_url + "&session_id={CHECKOUT_SESSION_ID}",
            "cancel_url": checkout_req.cancel_url,
            "metadata": {
                "user_id": user_id,
                "org_id": org_id or "",
            },
            "subscription_data": {
                "metadata": {
                    "user_id": user_id,
                    "org_id": org_id or "",
                }
            },
            "allow_promotion_codes": True,
            "billing_address_collection": "required",
            "locale": "es",
        }

        if stripe_customer_id:
            session_params["customer"] = stripe_customer_id
        else:
            session_params["customer_email"] = profile.get("email", user_data["auth_user"].email)

        session = stripe_client.checkout.Session.create(**session_params)
        return {"checkout_url": session.url, "session_id": session.id}

    except stripe.error.StripeError as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail="Error creating checkout session")


@router.post("/billing/portal")
async def create_billing_portal(
    user_data=Depends(get_current_user_with_profile),
    supabase_client=Depends(get_supabase_client)
):
    """Create a Stripe Customer Portal session."""
    stripe_client = get_stripe()
    profile = user_data["profile"]
    org_id = profile.get("org_id")

    if not org_id:
        raise HTTPException(status_code=400, detail="No organization found for this user")

    org_resp = supabase_client.table("organizations").select("stripe_customer_id").eq("id", org_id).single().execute()
    if not org_resp.data or not org_resp.data.get("stripe_customer_id"):
        raise HTTPException(status_code=400, detail="No Stripe customer found. Please subscribe first.")

    try:
        portal_session = stripe_client.billing_portal.Session.create(
            customer=org_resp.data["stripe_customer_id"],
            return_url="http://localhost:3000/billing",
        )
        return {"portal_url": portal_session.url}
    except stripe.error.StripeError as e:
        logger.error(f"Stripe portal error: {e}")
        raise HTTPException(status_code=500, detail="Error creating billing portal")


@router.post("/billing/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="stripe-signature"),
    supabase_client=Depends(get_supabase_client)
):
    """Handle Stripe webhook events."""
    settings = get_settings()

    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=503, detail="Webhook secret not configured")

    payload = await request.body()

    try:
        stripe.api_key = settings.stripe_secret_key
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.stripe_webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event["type"]
    logger.info(f"Received Stripe webhook: {event_type}")

    if event_type == "checkout.session.completed":
        session = event["data"]["object"]
        org_id = session.get("metadata", {}).get("org_id")
        customer_id = session.get("customer")

        if org_id and customer_id:
            supabase_client.table("organizations").update(
                {"stripe_customer_id": customer_id}
            ).eq("id", org_id).execute()

    elif event_type in ("customer.subscription.updated", "customer.subscription.created"):
        subscription = event["data"]["object"]
        customer_id = subscription.get("customer")
        status = subscription.get("status")

        # Get price ID to determine plan
        items = subscription.get("items", {}).get("data", [])
        price_id = items[0].get("price", {}).get("id") if items else None

        if customer_id and price_id and status == "active":
            plan = "free"
            if price_id == settings.stripe_pro_price_id:
                plan = "pro"
            elif price_id == settings.stripe_clinic_price_id:
                plan = "clinic"

            supabase_client.table("organizations").update(
                {"plan": plan}
            ).eq("stripe_customer_id", customer_id).execute()

            logger.info(f"Updated org plan to {plan} for customer {customer_id}")

    elif event_type == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        customer_id = subscription.get("customer")

        if customer_id:
            supabase_client.table("organizations").update(
                {"plan": "free"}
            ).eq("stripe_customer_id", customer_id).execute()

            logger.info(f"Downgraded org to free plan for customer {customer_id}")

    return {"received": True, "event_type": event_type}
