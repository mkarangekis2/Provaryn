import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getNotificationPreferencesSupabase,
  upsertNotificationPreferencesSupabase
} from "@/server/persistence/supabase-settings";
import { requireAuthorizedQueryUser, requireAuthorizedUser } from "@/lib/auth/request-user";

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
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  try {
    const existing = (await getNotificationPreferencesSupabase(auth.userId)) ?? await upsertNotificationPreferencesSupabase({
      userId: auth.userId,
      weeklyCheckInReminder: true,
      transitionTaskReminder: true,
      evidenceGapReminder: true,
      coachUpdates: true,
      productAnnouncements: false,
      cadence: "weekly",
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ ok: true, preferences: existing });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load notification settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = postSchema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;
  const payload = { ...body, userId: auth.userId };
  try {
    const preferences = await upsertNotificationPreferencesSupabase({ ...payload, updatedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true, preferences });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to save notification settings" },
      { status: 500 }
    );
  }
}
