import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { upsertServiceProfileSupabase } from "@/server/persistence/supabase-intake";
import { requireAuthorizedUser } from "@/lib/auth/request-user";

const schema = z.object({
  userId: z.string().uuid().or(z.string().min(5)),
  branch: z.string().min(1),
  component: z.string().min(1),
  rank: z.string().min(1),
  mos: z.string().min(1),
  yearsServed: z.number().int().min(0).max(60),
  currentStatus: z.string().min(1),
  etsDate: z.string().optional()
});

export async function POST(request: NextRequest) {
  const body = schema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;
  const payload = { ...body, userId: auth.userId };
  try {
    const profile = await upsertServiceProfileSupabase(payload);
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to upsert service profile" },
      { status: 500 }
    );
  }
}
