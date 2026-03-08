import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addAuditEntry, getClaimStatus, upsertClaimStatus } from "@/server/mock/store";
import { randomUUID } from "node:crypto";
import {
  addAuditEntrySupabase
} from "@/server/persistence/supabase-settings";
import {
  getClaimStatusSupabase,
  upsertClaimStatusSupabase
} from "@/server/persistence/supabase-transition-claims";

const getSchema = z.object({ userId: z.string().min(5) });
const postSchema = z.object({
  userId: z.string().min(5),
  stage: z.enum(["preparing", "submitted", "evidence_gathering", "review", "decision", "appeal"]),
  notes: z.string().optional()
});

export async function GET(request: NextRequest) {
  const parsed = getSchema.safeParse({ userId: request.nextUrl.searchParams.get("userId") });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });
  try {
    const record = await getClaimStatusSupabase(parsed.data.userId);
    return NextResponse.json({ ok: true, record });
  } catch {
    return NextResponse.json({ ok: true, record: getClaimStatus(parsed.data.userId) });
  }
}

export async function POST(request: NextRequest) {
  const body = postSchema.parse(await request.json());
  let saved: ReturnType<typeof upsertClaimStatus>;
  try {
    saved = await upsertClaimStatusSupabase({
      userId: body.userId,
      stage: body.stage,
      notes: body.notes
    });
    await addAuditEntrySupabase({
      userId: body.userId,
      action: "claim_status_updated",
      category: "data",
      metadata: { stage: body.stage, notes: body.notes ?? "" }
    });
  } catch {
    saved = upsertClaimStatus({
      userId: body.userId,
      stage: body.stage,
      notes: body.notes,
      updatedAt: new Date().toISOString()
    });
    addAuditEntry(body.userId, {
      id: randomUUID(),
      action: "claim_status_updated",
      category: "data",
      metadata: { stage: body.stage, notes: body.notes ?? "" },
      createdAt: new Date().toISOString()
    });
  }
  return NextResponse.json({ ok: true, record: saved });
}
