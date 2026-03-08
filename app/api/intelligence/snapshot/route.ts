import { NextRequest, NextResponse } from "next/server";
import { getUserSnapshot } from "@/server/mock/store";
import { calculateClaimReadiness } from "@/services/readiness-service";
import { getUserSnapshotSupabase } from "@/server/persistence/supabase-intelligence";
import { requireAuthorizedQueryUser } from "@/lib/auth/request-user";

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  let snapshot = getUserSnapshot(auth.userId);
  try {
    snapshot = await getUserSnapshotSupabase(auth.userId);
  } catch {
    // fallback
  }
  const score = calculateClaimReadiness({
    symptomLogCount: snapshot.counts.symptomEntries,
    diagnosisCount: Math.max(1, Math.floor(snapshot.counts.highSeverityEntries / 4)),
    serviceEventsLinked: snapshot.counts.events,
    exposureLinks: Math.max(1, Math.floor(snapshot.counts.timelineEntries / 2)),
    documentCount: snapshot.counts.documents,
    narrativeCount: Math.max(0, Math.floor(snapshot.counts.events / 3)),
    specialistEvaluations: Math.max(0, Math.floor(snapshot.counts.checkIns / 4))
  });

  return NextResponse.json({ ok: true, snapshot, score });
}
