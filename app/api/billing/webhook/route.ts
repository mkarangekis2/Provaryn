import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
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
        await addBillingEventSupabase({
          userId,
          eventType: productFromMetadata as "reconstruction_unlock" | "premium_subscription" | "claim_builder_package",
          active: true,
          source: "stripe",
          stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
          metadata: { sessionId: session.id, eventId: event.id }
        });
        await addAuditEntrySupabase({
          userId,
          action: "stripe_checkout_completed",
          category: "billing",
          metadata: { product: productFromMetadata, sessionId: session.id }
        });
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const item = subscription.items.data[0];
      const priceId = item?.price?.id;
      const userId = subscription.metadata?.userId;
      const product = priceId ? getProductForPriceId(priceId) : null;
      const active = ["trialing", "active", "past_due"].includes(subscription.status);
      if (userId && product === "premium_subscription") {
        await addBillingEventSupabase({
          userId,
          eventType: "premium_subscription",
          active,
          source: "stripe",
          stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : undefined,
          stripeSubscriptionId: subscription.id,
          metadata: { status: subscription.status, eventId: event.id }
        });
        await addAuditEntrySupabase({
          userId,
          action: "stripe_subscription_updated",
          category: "billing",
          metadata: { subscriptionId: subscription.id, status: subscription.status }
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const item = subscription.items.data[0];
      const priceId = item?.price?.id;
      const userId = subscription.metadata?.userId;
      const product = priceId ? getProductForPriceId(priceId) : null;
      if (userId && product === "premium_subscription") {
        await addBillingEventSupabase({
          userId,
          eventType: "premium_subscription",
          active: false,
          source: "stripe",
          stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : undefined,
          stripeSubscriptionId: subscription.id,
          metadata: { eventId: event.id }
        });
        await addAuditEntrySupabase({
          userId,
          action: "stripe_subscription_deleted",
          category: "billing",
          metadata: { subscriptionId: subscription.id }
        });
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : undefined;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : undefined;
      const userId = invoice.metadata?.userId;
      if (userId) {
        await addBillingEventSupabase({
          userId,
          eventType: "premium_subscription",
          active: false,
          source: "stripe",
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          metadata: { invoiceId: invoice.id, eventId: event.id, paymentStatus: invoice.status }
        });
        await addAuditEntrySupabase({
          userId,
          action: "stripe_invoice_payment_failed",
          category: "billing",
          metadata: { invoiceId: invoice.id, subscriptionId, customerId }
        });
      }
    }

    return NextResponse.json({ ok: true, received: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "webhook_failed" }, { status: 400 });
  }
}
