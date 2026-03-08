import { NextRequest, NextResponse } from "next/server";
import { listCheckIns, listDocumentExtractions, listEventLogs } from "@/server/mock/store";
import { detectConditions } from "@/services/conditions/condition-detection-service";
import {
  listCheckInsSupabase,
  listDocumentExtractionsSupabase,
  listEventLogsSupabase
} from "@/server/persistence/supabase-intelligence";
import { requireAuthorizedQueryUser } from "@/lib/auth/request-user";

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  let checkIns = listCheckIns(auth.userId);
  let events = listEventLogs(auth.userId);
  let extractions = listDocumentExtractions(auth.userId);
  try {
    [checkIns, events, extractions] = await Promise.all([
      listCheckInsSupabase(auth.userId),
      listEventLogsSupabase(auth.userId),
      listDocumentExtractionsSupabase(auth.userId)
    ]);
  } catch {
    // fallback remains
  }

  const conditions = detectConditions({
    checkIns,
    events,
    extractions
  });

  const primaryClaims = conditions.filter((c) => c.readiness >= 60).map((c) => c.label);
  const secondaryClaims = [] as string[];
  if (primaryClaims.includes("Lumbar Strain") && conditions.some((c) => c.label.includes("Headache"))) secondaryClaims.push("Radiculopathy / Neurological secondary review");
  if (primaryClaims.includes("Stress-Related Disorder")) secondaryClaims.push("Sleep disturbance secondary consideration");

  const blockers = conditions
    .filter((c) => c.diagnosisStatus === "missing" || c.serviceConnection < 60 || c.readiness < 55)
    .map((c) => `${c.label}: ${c.diagnosisStatus === "missing" ? "missing diagnosis" : c.serviceConnection < 60 ? "service-connection support weak" : "readiness low"}`);

  const fileNowRecommendation = blockers.length <= 1 && primaryClaims.length >= 1;

  return NextResponse.json({
    ok: true,
    strategy: {
      primaryClaims,
      secondaryClaims,
      blockers,
      fileNowRecommendation,
      rationale: fileNowRecommendation
        ? "Core claims have sufficient strength for initial filing while continuing evidence enrichment."
        : "Strengthen evidence and diagnostic coverage before filing to reduce avoidable denial risk.",
      confidence: Math.min(0.92, 0.4 + primaryClaims.length * 0.12)
    }
  });
}
