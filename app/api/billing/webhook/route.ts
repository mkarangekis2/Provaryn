import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { addAuditEntry, addBillingEvent } from "@/server/mock/store";
import { constructStripeEvent } from "@/services/billing-service";
import { getProductForPriceId } from "@/lib/billing/price-map";
import { addAuditEntrySupabase, addBillingEventSupabase } from "@/server/persistence/supabase-settings";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ ok: false, error: "Missing stripe signature or webhook secret." }, { status: 400 });
  }

  const rawBody = await request.text();

  try {
    const event = await constructStripeEvent(rawBody, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.client_reference_id ?? session.metadata?.userId;
      const productFromMetadata = session.metadata?.product;
      if (userId && productFromMetadata) {
        try {
          await addBillingEventSupabase({
            userId,
            eventType: productFromMetadata as "reconstruction_unlock" | "premium_subscription" | "claim_builder_package",
            active: true,
            source: "stripe"
          });
          await addAuditEntrySupabase({
            userId,
            action: "stripe_checkout_completed",
            category: "billing",
            metadata: { product: productFromMetadata, sessionId: session.id }
          });
        } catch {
          addBillingEvent({
            id: randomUUID(),
            userId,
            eventType: productFromMetadata as "reconstruction_unlock" | "premium_subscription" | "claim_builder_package",
            active: true,
            source: "stripe",
            createdAt: new Date().toISOString()
          });
          addAuditEntry(userId, {
            id: randomUUID(),
            action: "stripe_checkout_completed",
            category: "billing",
            metadata: { product: productFromMetadata, sessionId: session.id },
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const item = subscription.items.data[0];
      const priceId = item?.price?.id;
      const userId = subscription.metadata?.userId;
      const product = priceId ? getProductForPriceId(priceId) : null;
      if (userId && product === "premium_subscription") {
        try {
          await addBillingEventSupabase({
            userId,
            eventType: "premium_subscription",
            active: false,
            source: "stripe"
          });
          await addAuditEntrySupabase({
            userId,
            action: "stripe_subscription_deleted",
            category: "billing",
            metadata: { subscriptionId: subscription.id }
          });
        } catch {
          addBillingEvent({
            id: randomUUID(),
            userId,
            eventType: "premium_subscription",
            active: false,
            source: "stripe",
            createdAt: new Date().toISOString()
          });
          addAuditEntry(userId, {
            id: randomUUID(),
            action: "stripe_subscription_deleted",
            category: "billing",
            metadata: { subscriptionId: subscription.id },
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    return NextResponse.json({ ok: true, received: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "webhook_failed" }, { status: 400 });
  }
}
