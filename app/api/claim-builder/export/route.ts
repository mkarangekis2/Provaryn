import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  completeExportJobSupabase,
  createExportJobSupabase,
  getClaimPackageSupabase,
  listExportJobsSupabase,
  listNarrativesSupabase
} from "@/server/persistence/supabase-claim-builder";
import { addAuditEntrySupabase } from "@/server/persistence/supabase-settings";
import { requireAuthorizedQueryUser, requireAuthorizedUser } from "@/lib/auth/request-user";

const postSchema = z.object({
  userId: z.string().min(5),
  format: z.enum(["json", "pdf", "packet"]).default("packet")
});

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  try {
    const jobs = await listExportJobsSupabase(auth.userId);
    return NextResponse.json({ ok: true, jobs });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load export jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = postSchema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;

  try {
    const claimPackage = await getClaimPackageSupabase(auth.userId);
    if (!claimPackage) {
      return NextResponse.json({ ok: false, error: "Claim package not found" }, { status: 404 });
    }

    const exportJob = await createExportJobSupabase({
      userId: auth.userId,
      claimPackageId: claimPackage.id,
      outputFormat: body.format
    });

    const narratives = await listNarrativesSupabase(claimPackage.id);
    const included = claimPackage.selectedConditions.filter((item) => item.included);
    const qaChecks = {
      hasConditions: included.length > 0,
      profileReviewed: claimPackage.forms.profileReviewed,
      serviceHistoryReviewed: claimPackage.forms.serviceHistoryReviewed,
      evidenceMappingReviewed: claimPackage.forms.evidenceMappingReviewed,
      narrativeReviewed: claimPackage.forms.narrativeReviewed,
      hasNarratives: narratives.length > 0
    };

    const readinessPercent = Math.round(
      (Object.values(qaChecks).filter(Boolean).length / Object.keys(qaChecks).length) * 100
    );

    const artifact = {
      title: claimPackage.title,
      generatedAt: new Date().toISOString(),
      includedConditions: included,
      forms: claimPackage.forms,
      narratives: narratives.map((item) => ({
        narrativeType: item.narrativeType,
        version: item.version,
        createdAt: item.createdAt
      })),
      qaChecks,
      readinessPercent
    };

    const finalized = await completeExportJobSupabase({
      userId: auth.userId,
      exportJobId: exportJob.id,
      status: "completed",
      artifact,
      metadata: { format: body.format }
    });

    await addAuditEntrySupabase({
      userId: auth.userId,
      action: "claim_export_generated",
      category: "data",
      metadata: { exportJobId: finalized.id, format: body.format, readinessPercent }
    });

    return NextResponse.json({ ok: true, job: finalized });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to generate export job" },
      { status: 500 }
    );
  }
}
