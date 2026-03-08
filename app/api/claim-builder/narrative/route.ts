import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateNarrative } from "@/services/claim-builder-service";
import { addNarrativeSupabase, getClaimPackageSupabase, listNarrativesSupabase } from "@/server/persistence/supabase-claim-builder";
import { requireAuthorizedUser } from "@/lib/auth/request-user";

const getSchema = z.object({ userId: z.string().min(5), packageId: z.string().uuid() });
const postSchema = z.object({
  userId: z.string().min(5),
  packageId: z.string().uuid(),
  conditionId: z.string().optional(),
  conditionLabel: z.string().optional(),
  narrativeType: z.enum(["condition", "service_impact", "event"]),
  keySignals: z.array(z.string()).default([])
});

export async function GET(request: NextRequest) {
  const parsed = getSchema.safeParse({
    userId: request.nextUrl.searchParams.get("userId"),
    packageId: request.nextUrl.searchParams.get("packageId")
  });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "userId and packageId required" }, { status: 400 });
  const auth = await requireAuthorizedUser(request, parsed.data.userId);
  if (!auth.ok) return auth.response;
  try {
    const claimPackage = await getClaimPackageSupabase(auth.userId);
    if (!claimPackage || claimPackage.id !== parsed.data.packageId) {
      return NextResponse.json({ ok: false, error: "Claim package not found" }, { status: 404 });
    }
    const narratives = await listNarrativesSupabase(parsed.data.packageId);
    return NextResponse.json({ ok: true, narratives });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load narratives" },
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
    const existing = await listNarrativesSupabase(body.packageId);
    const priorVersion = existing.filter((item) => item.conditionId === body.conditionId && item.narrativeType === body.narrativeType).length;

    const generated = generateNarrative({
      conditionLabel: body.conditionLabel,
      narrativeType: body.narrativeType,
      keySignals: body.keySignals
    });

    const narrative = await addNarrativeSupabase({
      packageId: body.packageId,
      userId,
      conditionId: body.conditionId,
      narrativeType: body.narrativeType,
      content: generated.content,
      version: priorVersion + 1
    });
    return NextResponse.json({ ok: true, narrative });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to generate narrative" },
      { status: 500 }
    );
  }
}
