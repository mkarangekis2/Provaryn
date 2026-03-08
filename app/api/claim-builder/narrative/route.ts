import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateNarrative } from "@/services/claim-builder-service";
import { listNarratives, upsertNarrative } from "@/server/mock/store";
import { addNarrativeSupabase, listNarrativesSupabase } from "@/server/persistence/supabase-claim-builder";
import { requireAuthorizedUser } from "@/lib/auth/request-user";

const postSchema = z.object({
  userId: z.string().min(5),
  packageId: z.string().uuid(),
  conditionId: z.string().optional(),
  conditionLabel: z.string().optional(),
  narrativeType: z.enum(["condition", "service_impact", "event"]),
  keySignals: z.array(z.string()).default([])
});

export async function GET(request: NextRequest) {
  const packageId = request.nextUrl.searchParams.get("packageId");
  if (!packageId) return NextResponse.json({ ok: false, error: "packageId required" }, { status: 400 });
  try {
    const narratives = await listNarrativesSupabase(packageId);
    return NextResponse.json({ ok: true, narratives });
  } catch {
    return NextResponse.json({ ok: true, narratives: listNarratives(packageId) });
  }
}

export async function POST(request: NextRequest) {
  const body = postSchema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;
  const userId = auth.userId;
  let existing = listNarratives(body.packageId);
  try {
    existing = await listNarrativesSupabase(body.packageId);
  } catch {
    // keep fallback
  }
  const priorVersion = existing.filter((item) => item.conditionId === body.conditionId && item.narrativeType === body.narrativeType).length;

  const generated = generateNarrative({
    conditionLabel: body.conditionLabel,
    narrativeType: body.narrativeType,
    keySignals: body.keySignals
  });

  let saved: ReturnType<typeof upsertNarrative>;
  try {
    saved = await addNarrativeSupabase({
      packageId: body.packageId,
      userId,
      conditionId: body.conditionId,
      narrativeType: body.narrativeType,
      content: generated.content,
      version: priorVersion + 1
    });
  } catch {
    saved = upsertNarrative({
      id: generated.id ?? randomUUID(),
      packageId: body.packageId,
      userId,
      conditionId: body.conditionId,
      narrativeType: body.narrativeType,
      content: generated.content,
      version: priorVersion + 1,
      createdAt: new Date().toISOString()
    });
  }

  return NextResponse.json({ ok: true, narrative: saved });
}
