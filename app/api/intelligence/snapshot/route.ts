import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserSnapshot } from "@/server/mock/store";
import { calculateClaimReadiness } from "@/services/readiness-service";
import { getUserSnapshotSupabase } from "@/server/persistence/supabase-intelligence";

const schema = z.object({ userId: z.string().min(5) });

export async function GET(request: NextRequest) {
  const parsed = schema.safeParse({ userId: request.nextUrl.searchParams.get("userId") });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });
  }

  let snapshot = getUserSnapshot(parsed.data.userId);
  try {
    snapshot = await getUserSnapshotSupabase(parsed.data.userId);
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
