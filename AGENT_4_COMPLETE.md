# AGENT_4 — Stripe Payments Layer — Complete

## What Was Built

### 1. `/scripts/setup_stripe.py`
One-time script to create Stripe products and prices for all three plans (Free, Pro, Clinic). Reads `STRIPE_SECRET_KEY` from env, creates products/prices, prints the resulting price IDs to stdout, and saves them to `stripe_ids.json`. Run this once per environment to get the price IDs needed for backend config.

### 2. `/backend/app/routers/billing.py`
Three endpoints added under `/api/v1/billing/`:

| Endpoint | Auth | Description |
|---|---|---|
| `POST /billing/checkout` | Required (JWT) | Creates Stripe Checkout session; validates price_id against known prices; gets-or-creates Stripe customer on the org record |
| `POST /billing/portal` | Required (JWT) | Creates Stripe Customer Portal session for subscription management |
| `POST /billing/webhook` | None (Stripe signature) | Handles `checkout.session.completed`, `customer.subscription.updated/created`, `customer.subscription.deleted`; updates `organizations.plan` accordingly |

The webhook endpoint deliberately has no JWT auth dependency — security is enforced by Stripe signature verification (`stripe.Webhook.construct_event`).

### 3. `/backend/app/main.py`
- Added `billing` to the router imports
- Registered `billing.router` with prefix `/api/v1` and tag `billing`

### 4. `/backend/requirements.txt`
- Added `stripe==10.12.0`

### 5. `/frontend/app/(dashboard)/billing/page.tsx`
Rewrote the billing page to be fully wired:
- Fetches session token on mount and stores it in state
- "Actualizar a Pro" / "Actualizar a Clínica" buttons call `POST /api/v1/billing/checkout` with the correct price ID and redirect to `checkout_url`
- "Gestionar suscripción" button (shown for paid plans) calls `POST /api/v1/billing/portal` and redirects to `portal_url`
- Loading states disable buttons and show Spanish feedback text
- Limit-reached warning shown when `notesUsed >= 10` on free plan
- Price IDs sourced from `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` / `NEXT_PUBLIC_STRIPE_CLINIC_PRICE_ID` env vars; buttons are disabled if vars are not set

### 6. `/frontend/.env.local.example`
Added `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` and `NEXT_PUBLIC_STRIPE_CLINIC_PRICE_ID` placeholder entries.

## Configuration Required Before Going Live

Backend `.env`:
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...       # from setup_stripe.py output
STRIPE_CLINIC_PRICE_ID=price_...    # from setup_stripe.py output
```

Frontend `.env.local`:
```
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_CLINIC_PRICE_ID=price_...
```

## Assumptions
- `get_current_user_with_profile` returns a dict with keys `profile` (containing `id`, `org_id`, `email`) and `auth_user`
- `get_supabase_client` returns a Supabase client using the service role key (needed to write to `organizations`)
- The `organizations` table already has `stripe_customer_id` (text) and `plan` (text, default `'free'`) columns per the task brief
- The webhook endpoint uses `get_supabase_client` as a dependency for the DB client only — Stripe calls this endpoint directly without any JWT, and the signature check is the sole auth mechanism
- Success/cancel URLs default to `localhost:3000` — production deployments should pass the correct origin from the frontend (the page does this via `window.location.origin`)
