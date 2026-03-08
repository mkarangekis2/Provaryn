import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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
  try {
    const session = await addCheckInSupabase(payload);
    return NextResponse.json({ ok: true, session });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to create check-in session" },
      { status: 500 }
    );
  }
}
