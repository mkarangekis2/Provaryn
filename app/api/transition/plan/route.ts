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

type TransitionTask = {
  id: string;
  title: string;
  rationale: string;
  urgency: number;
  completed: boolean;
  relatedConditions: string[];
};

function mergeTasks(existing: TransitionTask[], generated: TransitionTask[]) {
  const byTitle = new Map<string, TransitionTask>();

  for (const task of existing) {
    byTitle.set(task.title.trim().toLowerCase(), task);
  }

  for (const task of generated) {
    const key = task.title.trim().toLowerCase();
    const current = byTitle.get(key);
    if (!current) {
      byTitle.set(key, task);
      continue;
    }

    byTitle.set(key, {
      ...current,
      urgency: Math.max(current.urgency, task.urgency),
      rationale: current.rationale || task.rationale,
      relatedConditions: Array.from(new Set([...(current.relatedConditions ?? []), ...(task.relatedConditions ?? [])]))
    });
  }

  return Array.from(byTitle.values()).sort((a, b) => b.urgency - a.urgency);
}

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

    const existingPlan = await getTransitionPlanSupabase(userId);
    const mergedTasks = mergeTasks(existingPlan?.tasks ?? [], tasks);

    const plan = await upsertTransitionPlanSupabase({
      userId,
      active: true,
      targetDate: body.targetDate ?? existingPlan?.targetDate,
      triggeredReason: body.triggeredReason,
      tasks: mergedTasks
    });
    return NextResponse.json({ ok: true, plan });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to build transition plan" },
      { status: 500 }
    );
  }
}
