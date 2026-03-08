import { NextRequest, NextResponse } from "next/server";
import { detectConditions } from "@/services/conditions/condition-detection-service";
import { listCheckIns, listDocumentExtractions, listEventLogs } from "@/server/mock/store";
import {
  listCheckInsSupabase,
  listDocumentExtractionsSupabase,
  listEventLogsSupabase
} from "@/server/persistence/supabase-intelligence";
import { requireAuthorizedQueryUser } from "@/lib/auth/request-user";

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;
  const userId = auth.userId;
  let checkIns = listCheckIns(userId);
  let events = listEventLogs(userId);
  let extractions = listDocumentExtractions(userId);
  try {
    [checkIns, events, extractions] = await Promise.all([
      listCheckInsSupabase(userId),
      listEventLogsSupabase(userId),
      listDocumentExtractionsSupabase(userId)
    ]);
  } catch {
    // fallback remains
  }
  const conditions = detectConditions({
    checkIns,
    events,
    extractions
  });

  return NextResponse.json({ ok: true, conditions });
}
