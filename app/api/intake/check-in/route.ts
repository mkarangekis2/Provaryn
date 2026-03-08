import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addCheckIn } from "@/server/mock/store";
import { addCheckInSupabase } from "@/server/persistence/supabase-intake";
import { requireAuthorizedUser } from "@/lib/auth/request-user";

const schema = z.object({
  userId: z.string().uuid().or(z.string().min(5)),
  sessionDate: z.string(),
  entries: z.array(
    z.object({
      category: z.string(),
      severity: z.number().min(0).max(10),
      frequency: z.number().min(0).max(7),
      impact: z.string().min(1),
      careSought: z.boolean()
    })
  ).min(1)
});

export async function POST(request: NextRequest) {
  const body = schema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;
  const payload = { ...body, userId: auth.userId };
  let saved: ReturnType<typeof addCheckIn>;
  try {
    saved = await addCheckInSupabase(payload);
  } catch {
    saved = addCheckIn(payload);
  }
  return NextResponse.json({ ok: true, session: saved });
}
