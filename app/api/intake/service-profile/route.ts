import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { upsertServiceProfile } from "@/server/mock/store";
import { upsertServiceProfileSupabase } from "@/server/persistence/supabase-intake";

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
  let saved: ReturnType<typeof upsertServiceProfile>;
  try {
    saved = await upsertServiceProfileSupabase(body);
  } catch {
    saved = upsertServiceProfile(body);
  }
  return NextResponse.json({ ok: true, profile: saved });
}
