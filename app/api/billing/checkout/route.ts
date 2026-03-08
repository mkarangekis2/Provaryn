import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { createCheckoutSession } from "@/services/billing-service";
import { getPriceIdForProduct, type BillingEventType } from "@/lib/billing/price-map";
import { requireAuthorizedUser } from "@/lib/auth/request-user";

const schema = z.object({
  userId: z.string().min(5),
  product: z.enum(["reconstruction_unlock", "premium_subscription", "claim_builder_package"])
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const auth = await requireAuthorizedUser(request, body.userId);
    if (!auth.ok) return auth.response;

    const priceId = getPriceIdForProduct(body.product);
    if (!priceId) {
      return NextResponse.json({ ok: false, error: `Missing Stripe price id for ${body.product}` }, { status: 400 });
    }

    const successUrl = `${env.APP_BASE_URL}/settings/billing?checkout=success&product=${body.product}`;
    const cancelUrl = `${env.APP_BASE_URL}/settings/billing?checkout=cancel`;
    const session = await createCheckoutSession({
      userId: auth.userId,
      priceId,
      product: body.product as BillingEventType,
      successUrl,
      cancelUrl
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "checkout_failed" }, { status: 400 });
  }
}
