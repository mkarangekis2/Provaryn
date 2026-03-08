import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { detectConditions } from "@/services/conditions/condition-detection-service";
import { listCheckIns, listDocumentExtractions, listEventLogs } from "@/server/mock/store";
import {
  listCheckInsSupabase,
  listDocumentExtractionsSupabase,
  listEventLogsSupabase
} from "@/server/persistence/supabase-intelligence";

const schema = z.object({ userId: z.string().min(5) });

export async function GET(request: NextRequest) {
  const parsed = schema.safeParse({ userId: request.nextUrl.searchParams.get("userId") });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });

  const userId = parsed.data.userId;
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
