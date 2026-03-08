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

  let events = listBillingEvents(auth.userId);
  try {
    events = await listBillingEventsSupabase(auth.userId);
  } catch {
    // fallback to mock store
  }
  const entitlements = resolveEntitlements(events.map((e) => ({ type: e.eventType, active: e.active })));
  return NextResponse.json({ ok: true, events, entitlements });
}

export async function POST(request: NextRequest) {
  const body = postSchema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;
  const userId = auth.userId;
  let event: ReturnType<typeof addBillingEvent>;
  try {
    event = await addBillingEventSupabase({
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
  } catch {
    event = addBillingEvent({
      id: randomUUID(),
      userId,
      eventType: body.eventType,
      active: body.active,
      source: "manual",
      createdAt: new Date().toISOString()
    });

    addAuditEntry(userId, {
      id: randomUUID(),
      action: "billing_event_recorded",
      category: "billing",
      metadata: { eventType: body.eventType, active: body.active },
      createdAt: new Date().toISOString()
    });
  }

  return NextResponse.json({ ok: true, event });
}
