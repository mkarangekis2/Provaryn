import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addTimelineEntry } from "@/server/mock/store";
import { addTimelineEntrySupabase } from "@/server/persistence/supabase-intake";
import { requireAuthorizedUser } from "@/lib/auth/request-user";

const schema = z.object({
  userId: z.string().uuid().or(z.string().min(5)),
  entryType: z.string().min(1),
  title: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export async function POST(request: NextRequest) {
  const body = schema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;
  const payload = { ...body, userId: auth.userId };
  let saved: ReturnType<typeof addTimelineEntry>;
  try {
    saved = await addTimelineEntrySupabase(payload);
  } catch {
    saved = addTimelineEntry(payload);
  }
  return NextResponse.json({ ok: true, entry: saved });
}
