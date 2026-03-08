import { detectConditions } from "@/services/conditions/condition-detection-service";
import { calculateClaimReadiness } from "@/services/readiness-service";
import { getUserSnapshotSupabase } from "@/server/persistence/supabase-intelligence";
import { getClaimStatusSupabase } from "@/server/persistence/supabase-transition-claims";

export async function buildUserIntelligenceAsync(userId: string) {
  const [snapshot, claimStatus] = await Promise.all([
    getUserSnapshotSupabase(userId),
    getClaimStatusSupabase(userId)
  ]);

  const conditions = detectConditions({
    checkIns: snapshot.checkIns,
    events: snapshot.events,
    extractions: snapshot.extractions
  });

  const score = calculateClaimReadiness({
    symptomLogCount: snapshot.counts.symptomEntries,
    diagnosisCount: Math.max(1, Math.floor(conditions.filter((c) => c.diagnosisStatus !== "missing").length)),
    serviceEventsLinked: snapshot.counts.events,
    exposureLinks: Math.max(1, Math.floor(snapshot.counts.timelineEntries / 2)),
    documentCount: snapshot.counts.documents,
    narrativeCount: Math.max(0, Math.floor(snapshot.counts.events / 3)),
    specialistEvaluations: Math.max(0, Math.floor(snapshot.counts.checkIns / 4))
  });

  return {
    userId,
    snapshot,
    conditions,
    score,
    claimStatus
  };
}

