import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addEventLog } from "@/server/mock/store";
import { addEventLogSupabase } from "@/server/persistence/supabase-intake";

const schema = z.object({
  userId: z.string().uuid().or(z.string().min(5)),
  eventType: z.string().min(1),
  occurredAt: z.string().optional(),
  location: z.string().optional(),
  unit: z.string().optional(),
  description: z.string().min(5)
});

export async function POST(request: NextRequest) {
  const body = schema.parse(await request.json());
  let saved: ReturnType<typeof addEventLog>;
  try {
    saved = await addEventLogSupabase(body);
  } catch {
    saved = addEventLog(body);
  }
  return NextResponse.json({ ok: true, event: saved });
}
