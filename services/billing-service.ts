import Stripe from "stripe";
import { requireServerEnv } from "@/lib/env";
import type { BillingEventType } from "@/lib/billing/price-map";

export function getStripeClient() {
  return new Stripe(requireServerEnv("STRIPE_SECRET_KEY"), { apiVersion: "2025-02-24.acacia" });
}

export async function createCheckoutSession(input: {
  priceId: string;
  userId: string;
  product: BillingEventType;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripeClient();
  const mode = input.product === "premium_subscription" ? "subscription" : "payment";
  return stripe.checkout.sessions.create({
    mode,
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.userId,
    metadata: { userId: input.userId, product: input.product },
    subscription_data: mode === "subscription" ? { metadata: { userId: input.userId, product: input.product } } : undefined,
    allow_promotion_codes: true
  });
}

export async function constructStripeEvent(payload: string | Buffer, signature: string, webhookSecret: string) {
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
