import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getNotificationPreferences, upsertNotificationPreferences } from "@/server/mock/store";
import {
  getNotificationPreferencesSupabase,
  upsertNotificationPreferencesSupabase
} from "@/server/persistence/supabase-settings";

const getSchema = z.object({ userId: z.string().min(5) });
const postSchema = z.object({
  userId: z.string().min(5),
  weeklyCheckInReminder: z.boolean(),
  transitionTaskReminder: z.boolean(),
  evidenceGapReminder: z.boolean(),
  coachUpdates: z.boolean(),
  productAnnouncements: z.boolean(),
  cadence: z.enum(["daily", "weekly", "biweekly"])
});

export async function GET(request: NextRequest) {
  const parsed = getSchema.safeParse({ userId: request.nextUrl.searchParams.get("userId") });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });

  let existing = null as ReturnType<typeof getNotificationPreferences>;
  try {
    existing = await getNotificationPreferencesSupabase(parsed.data.userId);
  } catch {
    existing = null;
  }
  existing = existing ?? getNotificationPreferences(parsed.data.userId) ?? upsertNotificationPreferences({
    userId: parsed.data.userId,
    weeklyCheckInReminder: true,
    transitionTaskReminder: true,
    evidenceGapReminder: true,
    coachUpdates: true,
    productAnnouncements: false,
    cadence: "weekly",
    updatedAt: new Date().toISOString()
  });

  return NextResponse.json({ ok: true, preferences: existing });
}

export async function POST(request: NextRequest) {
  const body = postSchema.parse(await request.json());
  let saved: ReturnType<typeof upsertNotificationPreferences>;
  try {
    saved = await upsertNotificationPreferencesSupabase({ ...body, updatedAt: new Date().toISOString() });
  } catch {
    saved = upsertNotificationPreferences({ ...body, updatedAt: new Date().toISOString() });
  }
  return NextResponse.json({ ok: true, preferences: saved });
}
