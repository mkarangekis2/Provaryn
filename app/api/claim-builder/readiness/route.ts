import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getClaimPackageSupabase } from "@/server/persistence/supabase-claim-builder";
import { requireAuthorizedQueryUser } from "@/lib/auth/request-user";

const schema = z.object({ userId: z.string().min(5) });

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  try {
    const claimPackage = await getClaimPackageSupabase(auth.userId);
    if (!claimPackage) return NextResponse.json({ ok: true, readiness: null, blockers: ["No claim package created yet"] });

    const selectedCount = claimPackage.selectedConditions.filter((item) => item.included).length;
    const formCompletion = Object.values(claimPackage.forms).filter(Boolean).length;
    const readiness = Math.min(100, Math.round((selectedCount * 20) + (formCompletion * 8)));

    const blockers: string[] = [];
    if (selectedCount === 0) blockers.push("No conditions selected for package.");
    if (!claimPackage.forms.narrativeReviewed) blockers.push("Narratives not reviewed.");
    if (!claimPackage.forms.evidenceMappingReviewed) blockers.push("Evidence mapping checklist incomplete.");

    return NextResponse.json({ ok: true, readiness, blockers, claimPackage });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to evaluate claim package readiness" },
      { status: 500 }
    );
  }
}
