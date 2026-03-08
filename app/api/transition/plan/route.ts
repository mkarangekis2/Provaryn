import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { detectConditions } from "@/services/conditions/condition-detection-service";
import { buildTransitionTasks } from "@/services/transition-service";
import { getTransitionPlan, listCheckIns, listDocumentExtractions, listEventLogs, upsertTransitionPlan } from "@/server/mock/store";
import {
  getTransitionPlanSupabase,
  upsertTransitionPlanSupabase
} from "@/server/persistence/supabase-transition-claims";
import {
  listCheckInsSupabase,
  listDocumentExtractionsSupabase,
  listEventLogsSupabase
} from "@/server/persistence/supabase-intelligence";

const postSchema = z.object({
  userId: z.string().min(5),
  targetDate: z.string().optional(),
  triggeredReason: z.string().min(3)
});

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });
  try {
    const plan = await getTransitionPlanSupabase(userId);
    return NextResponse.json({ ok: true, plan });
  } catch {
    return NextResponse.json({ ok: true, plan: getTransitionPlan(userId) });
  }
}

export async function POST(request: NextRequest) {
  const body = postSchema.parse(await request.json());
  let checkIns = listCheckIns(body.userId);
  let events = listEventLogs(body.userId);
  let extractions = listDocumentExtractions(body.userId);
  try {
    [checkIns, events, extractions] = await Promise.all([
      listCheckInsSupabase(body.userId),
      listEventLogsSupabase(body.userId),
      listDocumentExtractionsSupabase(body.userId)
    ]);
  } catch {
    // fallback remains
  }

  const conditions = detectConditions({
    checkIns,
    events,
    extractions
  });

  const tasks = buildTransitionTasks({
    conditions: conditions.map((condition) => ({
      id: condition.id,
      label: condition.label,
      readiness: condition.readiness,
      diagnosisStatus: condition.diagnosisStatus,
      urgency: condition.urgency
    }))
  });

  let plan: ReturnType<typeof upsertTransitionPlan>;
  try {
    plan = await upsertTransitionPlanSupabase({
      userId: body.userId,
      active: true,
      targetDate: body.targetDate,
      triggeredReason: body.triggeredReason,
      tasks
    });
  } catch {
    plan = upsertTransitionPlan({
      userId: body.userId,
      active: true,
      targetDate: body.targetDate,
      triggeredReason: body.triggeredReason,
      tasks,
      updatedAt: new Date().toISOString()
    });
  }

  return NextResponse.json({ ok: true, plan });
}
