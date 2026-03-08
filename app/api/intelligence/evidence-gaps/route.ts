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

  const gaps = conditions.flatMap((c) => {
    const list: Array<{ condition: string; description: string; impact: "low" | "medium" | "high"; urgency: number }> = [];
    if (c.diagnosisStatus === "missing") list.push({ condition: c.label, description: "Missing diagnostic confirmation", impact: "high", urgency: 5 });
    if (c.serviceConnection < 60) list.push({ condition: c.label, description: "Service connection support needs stronger event/exposure links", impact: "high", urgency: 4 });
    if (c.readiness < 65) list.push({ condition: c.label, description: "Longitudinal symptom documentation is incomplete", impact: "medium", urgency: 3 });
    return list;
  });

  return NextResponse.json({ ok: true, gaps: gaps.sort((a, b) => b.urgency - a.urgency) });
}
