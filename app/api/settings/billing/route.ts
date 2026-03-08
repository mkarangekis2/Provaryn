import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addAuditEntry, addBillingEvent, listBillingEvents } from "@/server/mock/store";
import { resolveEntitlements } from "@/lib/billing/entitlements";
import {
  addAuditEntrySupabase,
  addBillingEventSupabase,
  listBillingEventsSupabase
} from "@/server/persistence/supabase-settings";

const getSchema = z.object({ userId: z.string().min(5) });
const postSchema = z.object({
  userId: z.string().min(5),
  eventType: z.enum(["reconstruction_unlock", "premium_subscription", "claim_builder_package"]),
  active: z.boolean().default(true)
});

export async function GET(request: NextRequest) {
  const parsed = getSchema.safeParse({ userId: request.nextUrl.searchParams.get("userId") });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });

  let events = listBillingEvents(parsed.data.userId);
  try {
    events = await listBillingEventsSupabase(parsed.data.userId);
  } catch {
    // fallback to mock store
  }
  const entitlements = resolveEntitlements(events.map((e) => ({ type: e.eventType, active: e.active })));
  return NextResponse.json({ ok: true, events, entitlements });
}

export async function POST(request: NextRequest) {
  const body = postSchema.parse(await request.json());
  let event: ReturnType<typeof addBillingEvent>;
  try {
    event = await addBillingEventSupabase({
      userId: body.userId,
      eventType: body.eventType,
      active: body.active,
      source: "manual"
    });
    await addAuditEntrySupabase({
      userId: body.userId,
      action: "billing_event_recorded",
      category: "billing",
      metadata: { eventType: body.eventType, active: body.active }
    });
  } catch {
    event = addBillingEvent({
      id: randomUUID(),
      userId: body.userId,
      eventType: body.eventType,
      active: body.active,
      source: "manual",
      createdAt: new Date().toISOString()
    });

    addAuditEntry(body.userId, {
      id: randomUUID(),
      action: "billing_event_recorded",
      category: "billing",
      metadata: { eventType: body.eventType, active: body.active },
      createdAt: new Date().toISOString()
    });
  }

  return NextResponse.json({ ok: true, event });
}
