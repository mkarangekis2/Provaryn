import { NextRequest, NextResponse } from "next/server";
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
  const userId = auth.userId;

  try {
    const [checkIns, events, extractions] = await Promise.all([
      listCheckInsSupabase(userId),
      listEventLogsSupabase(userId),
      listDocumentExtractionsSupabase(userId)
    ]);

    const conditions = detectConditions({
      checkIns,
      events,
      extractions
    });

    return NextResponse.json({ ok: true, conditions });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load conditions intelligence" },
      { status: 500 }
    );
  }
}
