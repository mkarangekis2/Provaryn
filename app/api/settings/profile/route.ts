import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addAuditEntry, getServiceProfile, upsertServiceProfile } from "@/server/mock/store";
import { getServiceProfileSupabase, addAuditEntrySupabase } from "@/server/persistence/supabase-settings";
import { upsertServiceProfileSupabase } from "@/server/persistence/supabase-intake";

const getSchema = z.object({ userId: z.string().min(5) });
const postSchema = z.object({
  userId: z.string().min(5),
  branch: z.string().min(1),
  component: z.string().min(1),
  rank: z.string().min(1),
  mos: z.string().min(1),
  yearsServed: z.number().int().min(0).max(60),
  currentStatus: z.string().min(1),
  etsDate: z.string().optional()
});

export async function GET(request: NextRequest) {
  const parsed = getSchema.safeParse({ userId: request.nextUrl.searchParams.get("userId") });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });

  let profile = null as ReturnType<typeof getServiceProfile>;
  try {
    profile = await getServiceProfileSupabase(parsed.data.userId);
  } catch {
    profile = null;
  }
  profile = profile ?? getServiceProfile(parsed.data.userId) ?? {
    userId: parsed.data.userId,
    branch: "Army",
    component: "Active",
    rank: "E-5",
    mos: "11B",
    yearsServed: 6,
    currentStatus: "Serving",
    etsDate: ""
  };

  return NextResponse.json({ ok: true, profile });
}

export async function POST(request: NextRequest) {
  const body = postSchema.parse(await request.json());
  let profile: ReturnType<typeof upsertServiceProfile>;
  try {
    profile = await upsertServiceProfileSupabase(body);
    await addAuditEntrySupabase({
      userId: body.userId,
      action: "profile_updated",
      category: "data",
      metadata: { branch: body.branch, component: body.component, rank: body.rank }
    });
  } catch {
    profile = upsertServiceProfile(body);
    addAuditEntry(body.userId, {
      id: randomUUID(),
      action: "profile_updated",
      category: "data",
      metadata: { branch: body.branch, component: body.component, rank: body.rank },
      createdAt: new Date().toISOString()
    });
  }
  return NextResponse.json({ ok: true, profile });
}
