import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addAnalyticsEvent } from "@/server/mock/store";
import { addAnalyticsEventSupabase } from "@/server/persistence/supabase-analytics";

const schema = z.object({
  name: z.enum([
    "signup_started",
    "signup_completed",
    "onboarding_completed",
    "reconstruction_unlocked",
    "first_checkin_completed",
    "first_upload_completed",
    "first_condition_detected",
    "transition_mode_entered",
    "claim_builder_started",
    "claim_package_generated",
    "upgrade_purchased",
    "coach_relationship_created"
  ]),
  payload: z.record(z.unknown()).default({}),
  userId: z.string().min(5).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const input = {
      id: randomUUID(),
      userId: body.userId,
      name: body.name,
      payload: body.payload,
      createdAt: new Date().toISOString()
    };
    let event: ReturnType<typeof addAnalyticsEvent>;
    try {
      event = await addAnalyticsEventSupabase(input);
    } catch {
      event = addAnalyticsEvent(input);
    }
    return NextResponse.json({ ok: true, event });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "invalid_event" }, { status: 400 });
  }
}
