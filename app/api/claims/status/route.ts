import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  addAuditEntrySupabase
} from "@/server/persistence/supabase-settings";
import {
  getClaimStatusSupabase,
  upsertClaimStatusSupabase
} from "@/server/persistence/supabase-transition-claims";
import { requireAuthorizedQueryUser, requireAuthorizedUser } from "@/lib/auth/request-user";

const getSchema = z.object({ userId: z.string().min(5) });
const postSchema = z.object({
  userId: z.string().min(5),
  stage: z.enum(["preparing", "submitted", "evidence_gathering", "review", "decision", "appeal"]),
  notes: z.string().optional()
});

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;
  try {
    const record = await getClaimStatusSupabase(auth.userId);
    return NextResponse.json({ ok: true, record });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load claim status" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = postSchema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;
  const userId = auth.userId;
  try {
    const record = await upsertClaimStatusSupabase({
      userId,
      stage: body.stage,
      notes: body.notes
    });
    await addAuditEntrySupabase({
      userId,
      action: "claim_status_updated",
      category: "data",
      metadata: { stage: body.stage, notes: body.notes ?? "" }
    });
    return NextResponse.json({ ok: true, record });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to update claim status" },
      { status: 500 }
    );
  }
}
