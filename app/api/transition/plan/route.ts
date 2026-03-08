import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { detectConditions } from "@/services/conditions/condition-detection-service";
import { buildTransitionTasks } from "@/services/transition-service";
import {
  getTransitionPlanSupabase,
  upsertTransitionPlanSupabase
} from "@/server/persistence/supabase-transition-claims";
import {
  listCheckInsSupabase,
  listDocumentExtractionsSupabase,
  listEventLogsSupabase
} from "@/server/persistence/supabase-intelligence";
import { requireAuthorizedQueryUser, requireAuthorizedUser } from "@/lib/auth/request-user";

const postSchema = z.object({
  userId: z.string().min(5),
  targetDate: z.string().optional(),
  triggeredReason: z.string().min(3)
});

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;
  try {
    const plan = await getTransitionPlanSupabase(auth.userId);
    return NextResponse.json({ ok: true, plan });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load transition plan" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = postSchema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
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

    const tasks = buildTransitionTasks({
      conditions: conditions.map((condition) => ({
        id: condition.id,
        label: condition.label,
        readiness: condition.readiness,
        diagnosisStatus: condition.diagnosisStatus,
        urgency: condition.urgency
      }))
    });

    const plan = await upsertTransitionPlanSupabase({
      userId,
      active: true,
      targetDate: body.targetDate,
      triggeredReason: body.triggeredReason,
      tasks
    });
    return NextResponse.json({ ok: true, plan });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to build transition plan" },
      { status: 500 }
    );
  }
}
