import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceProfileSupabase, addAuditEntrySupabase } from "@/server/persistence/supabase-settings";
import { upsertServiceProfileSupabase } from "@/server/persistence/supabase-intake";
import { requireAuthorizedQueryUser, requireAuthorizedUser } from "@/lib/auth/request-user";

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
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  try {
    const profile = (await getServiceProfileSupabase(auth.userId)) ?? {
      userId: auth.userId,
      branch: "Army",
      component: "Active",
      rank: "E-5",
      mos: "11B",
      yearsServed: 6,
      currentStatus: "Serving",
      etsDate: ""
    };

    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load profile settings" },
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
    const profile = await upsertServiceProfileSupabase(payload);
    await addAuditEntrySupabase({
      userId: payload.userId,
      action: "profile_updated",
      category: "data",
      metadata: { branch: payload.branch, component: payload.component, rank: payload.rank }
    });
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to save profile settings" },
      { status: 500 }
    );
  }
}
