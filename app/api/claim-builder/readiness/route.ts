import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getClaimPackage } from "@/server/mock/store";
import { getClaimPackageSupabase } from "@/server/persistence/supabase-claim-builder";

const schema = z.object({ userId: z.string().min(5) });

export async function GET(request: NextRequest) {
  const parsed = schema.safeParse({ userId: request.nextUrl.searchParams.get("userId") });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });

  let claimPackage = getClaimPackage(parsed.data.userId);
  try {
    const persisted = await getClaimPackageSupabase(parsed.data.userId);
    claimPackage = persisted ?? claimPackage;
  } catch {
    // fallback
  }
  if (!claimPackage) return NextResponse.json({ ok: true, readiness: null, blockers: ["No claim package created yet"] });

  const selectedCount = claimPackage.selectedConditions.filter((item) => item.included).length;
  const formCompletion = Object.values(claimPackage.forms).filter(Boolean).length;
  const readiness = Math.min(100, Math.round((selectedCount * 20) + (formCompletion * 8)));

  const blockers: string[] = [];
  if (selectedCount === 0) blockers.push("No conditions selected for package.");
  if (!claimPackage.forms.narrativeReviewed) blockers.push("Narratives not reviewed.");
  if (!claimPackage.forms.evidenceMappingReviewed) blockers.push("Evidence mapping checklist incomplete.");

  return NextResponse.json({ ok: true, readiness, blockers, claimPackage });
}
