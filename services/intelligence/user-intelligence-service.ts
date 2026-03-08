import { listCheckIns, listDocumentExtractions, listEventLogs, getUserSnapshot, getClaimStatus } from "@/server/mock/store";
import { detectConditions } from "@/services/conditions/condition-detection-service";
import { calculateClaimReadiness } from "@/services/readiness-service";
import { getUserSnapshotSupabase } from "@/server/persistence/supabase-intelligence";

export function buildUserIntelligence(userId: string) {
  const snapshot = getUserSnapshot(userId);
  const conditions = detectConditions({
    checkIns: listCheckIns(userId),
    events: listEventLogs(userId),
    extractions: listDocumentExtractions(userId)
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
    claimStatus: getClaimStatus(userId)
  };
}

export async function buildUserIntelligenceAsync(userId: string) {
  try {
    const persisted = await getUserSnapshotSupabase(userId);
    const conditions = detectConditions({
      checkIns: persisted.checkIns,
      events: persisted.events,
      extractions: persisted.extractions
    });

    const score = calculateClaimReadiness({
      symptomLogCount: persisted.counts.symptomEntries,
      diagnosisCount: Math.max(1, Math.floor(conditions.filter((c) => c.diagnosisStatus !== "missing").length)),
      serviceEventsLinked: persisted.counts.events,
      exposureLinks: Math.max(1, Math.floor(persisted.counts.timelineEntries / 2)),
      documentCount: persisted.counts.documents,
      narrativeCount: Math.max(0, Math.floor(persisted.counts.events / 3)),
      specialistEvaluations: Math.max(0, Math.floor(persisted.counts.checkIns / 4))
    });

    return {
      userId,
      snapshot: persisted,
      conditions,
      score,
      claimStatus: getClaimStatus(userId)
    };
  } catch {
    return buildUserIntelligence(userId);
  }
}
