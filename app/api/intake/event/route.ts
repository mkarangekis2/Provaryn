import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addEventLogSupabase } from "@/server/persistence/supabase-intake";
import { requireAuthorizedUser } from "@/lib/auth/request-user";

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
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;
  const payload = { ...body, userId: auth.userId };
  try {
    const event = await addEventLogSupabase(payload);
    return NextResponse.json({ ok: true, event });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to add event log" },
      { status: 500 }
    );
  }
}
