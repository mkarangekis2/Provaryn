import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addTimelineEntry } from "@/server/mock/store";
import { addTimelineEntrySupabase } from "@/server/persistence/supabase-intake";

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
  let saved: ReturnType<typeof addTimelineEntry>;
  try {
    saved = await addTimelineEntrySupabase(body);
  } catch {
    saved = addTimelineEntry(body);
  }
  return NextResponse.json({ ok: true, entry: saved });
}
