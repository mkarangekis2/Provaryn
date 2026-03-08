import { env } from "@/lib/env";

export type BillingEventType = "reconstruction_unlock" | "premium_subscription" | "claim_builder_package";

export function getPriceIdForProduct(product: BillingEventType) {
  if (product === "reconstruction_unlock") return env.STRIPE_PRICE_RECON_UNLOCK ?? null;
  if (product === "premium_subscription") return env.STRIPE_PRICE_PREMIUM ?? null;
  return env.STRIPE_PRICE_CLAIM_BUILDER ?? null;
}

export function getProductForPriceId(priceId: string): BillingEventType | null {
  if (env.STRIPE_PRICE_RECON_UNLOCK && priceId === env.STRIPE_PRICE_RECON_UNLOCK) return "reconstruction_unlock";
  if (env.STRIPE_PRICE_PREMIUM && priceId === env.STRIPE_PRICE_PREMIUM) return "premium_subscription";
  if (env.STRIPE_PRICE_CLAIM_BUILDER && priceId === env.STRIPE_PRICE_CLAIM_BUILDER) return "claim_builder_package";
  return null;
}
