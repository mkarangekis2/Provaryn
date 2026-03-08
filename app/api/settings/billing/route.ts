import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveEntitlements } from "@/lib/billing/entitlements";
import {
  addAuditEntrySupabase,
  addBillingEventSupabase,
  listBillingEventsSupabase
} from "@/server/persistence/supabase-settings";
import { requireAuthorizedQueryUser, requireAuthorizedUser } from "@/lib/auth/request-user";

const getSchema = z.object({ userId: z.string().min(5) });
const postSchema = z.object({
  userId: z.string().min(5),
  eventType: z.enum(["reconstruction_unlock", "premium_subscription", "claim_builder_package"]),
  active: z.boolean().default(true)
});

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  try {
    const events = await listBillingEventsSupabase(auth.userId);
    const entitlements = resolveEntitlements(events.map((e) => ({ type: e.eventType, active: e.active })));
    return NextResponse.json({ ok: true, events, entitlements });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load billing settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Manual billing event triggers are disabled in production." }, { status: 403 });
  }

  const body = postSchema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;
  const userId = auth.userId;
  try {
    const event = await addBillingEventSupabase({
      userId,
      eventType: body.eventType,
      active: body.active,
      source: "manual"
    });
    await addAuditEntrySupabase({
      userId,
      action: "billing_event_recorded",
      category: "billing",
      metadata: { eventType: body.eventType, active: body.active }
    });
    return NextResponse.json({ ok: true, event });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to record billing event" },
      { status: 500 }
    );
  }
}
