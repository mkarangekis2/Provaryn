import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listCheckIns, listDocumentExtractions, listEventLogs } from "@/server/mock/store";
import { detectConditions } from "@/services/conditions/condition-detection-service";
import {
  listCheckInsSupabase,
  listDocumentExtractionsSupabase,
  listEventLogsSupabase
} from "@/server/persistence/supabase-intelligence";

const schema = z.object({ userId: z.string().min(5) });

function estimateConditionRating(readiness: number, confidence: number) {
  const base = Math.round((readiness * 0.55) + (confidence * 100 * 0.45));
  const conservative = Math.max(10, Math.round(base * 0.6));
  const expected = Math.max(10, Math.round(base * 0.8));
  const best = Math.min(100, Math.round(base * 1.05));
  return { conservative, expected, best };
}

export async function GET(request: NextRequest) {
  const parsed = schema.safeParse({ userId: request.nextUrl.searchParams.get("userId") });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });

  let checkIns = listCheckIns(parsed.data.userId);
  let events = listEventLogs(parsed.data.userId);
  let extractions = listDocumentExtractions(parsed.data.userId);
  try {
    [checkIns, events, extractions] = await Promise.all([
      listCheckInsSupabase(parsed.data.userId),
      listEventLogsSupabase(parsed.data.userId),
      listDocumentExtractionsSupabase(parsed.data.userId)
    ]);
  } catch {
    // fallback remains
  }

  const conditions = detectConditions({
    checkIns,
    events,
    extractions
  });

  const perCondition = conditions.map((c) => ({ label: c.label, ...estimateConditionRating(c.readiness, c.confidence) }));
  const expectedCombined = Math.min(100, perCondition.reduce((sum, c) => sum + c.expected, 0));

  return NextResponse.json({
    ok: true,
    perCondition,
    scenarios: {
      conservative: Math.max(10, Math.round(expectedCombined * 0.7)),
      expected: expectedCombined,
      best: Math.min(100, Math.round(expectedCombined * 1.15))
    },
    disclaimer: "Estimator output is advisory and not a guaranteed VA determination."
  });
}
