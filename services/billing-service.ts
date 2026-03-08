import Stripe from "stripe";
import { requireServerEnv } from "@/lib/env";

export function getStripeClient() {
  return new Stripe(requireServerEnv("STRIPE_SECRET_KEY"), { apiVersion: "2025-02-24.acacia" });
}

export async function createCheckoutSession(input: {
  priceId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripeClient();
  return stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.userId,
    metadata: { userId: input.userId }
  });
}
