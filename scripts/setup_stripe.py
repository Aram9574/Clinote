#!/usr/bin/env python3
"""
Script to set up Stripe products and prices for CLINOTE.
Run once when setting up a new environment.

Usage: python setup_stripe.py
Required env var: STRIPE_SECRET_KEY
"""
import os
import sys
import json

try:
    import stripe
except ImportError:
    print("ERROR: stripe package not installed. Run: pip install stripe")
    sys.exit(1)


def setup_stripe_products():
    api_key = os.environ.get("STRIPE_SECRET_KEY")
    if not api_key:
        print("ERROR: STRIPE_SECRET_KEY environment variable not set")
        sys.exit(1)

    stripe.api_key = api_key

    results = {}

    print("Creating CLINOTE Stripe products and prices...\n")

    # Free plan (informational product, no recurring price needed)
    print("1. Creating Free product...")
    free_product = stripe.Product.create(
        name="CLINOTE Free",
        description="Plan gratuito: 10 notas/mes, SOAP + entidades, alertas básicas",
        metadata={"plan": "free", "notes_limit": "10"}
    )
    results["free_product_id"] = free_product.id
    print(f"   Product ID: {free_product.id}")

    # Pro plan
    print("\n2. Creating Pro product and price...")
    pro_product = stripe.Product.create(
        name="CLINOTE Pro",
        description="Plan Pro: Notas ilimitadas, todas las alertas, evidencia PubMed, 10 req/min",
        metadata={"plan": "pro"}
    )
    pro_price = stripe.Price.create(
        product=pro_product.id,
        unit_amount=3900,  # 39.00 EUR in cents
        currency="eur",
        recurring={"interval": "month"},
        nickname="Pro Monthly",
        metadata={"plan": "pro"}
    )
    results["pro_product_id"] = pro_product.id
    results["pro_price_id"] = pro_price.id
    print(f"   Product ID: {pro_product.id}")
    print(f"   Price ID: {pro_price.id}")

    # Clinic plan
    print("\n3. Creating Clínica product and price...")
    clinic_product = stripe.Product.create(
        name="CLINOTE Clínica",
        description="Plan Clínica: Multi-usuario, 30 req/min, soporte prioritario",
        metadata={"plan": "clinic"}
    )
    clinic_price = stripe.Price.create(
        product=clinic_product.id,
        unit_amount=19900,  # 199.00 EUR in cents
        currency="eur",
        recurring={"interval": "month"},
        nickname="Clinic Monthly",
        metadata={"plan": "clinic"}
    )
    results["clinic_product_id"] = clinic_product.id
    results["clinic_price_id"] = clinic_price.id
    print(f"   Product ID: {clinic_product.id}")
    print(f"   Price ID: {clinic_price.id}")

    print("\n" + "="*50)
    print("SETUP COMPLETE. Add these to your .env file:")
    print("="*50)
    print(f"STRIPE_PRO_PRICE_ID={results['pro_price_id']}")
    print(f"STRIPE_CLINIC_PRICE_ID={results['clinic_price_id']}")

    # Save to file
    output_file = "stripe_ids.json"
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nFull results saved to {output_file}")

    return results


if __name__ == "__main__":
    setup_stripe_products()
