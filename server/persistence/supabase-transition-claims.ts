import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { ensureSupabaseProfile } from "@/server/persistence/supabase-common";

type TransitionTask = {
  id: string;
  title: string;
  rationale: string;
  urgency: number;
  completed: boolean;
  relatedConditions: string[];
  owner?: "member" | "coach";
  dueAt?: string;
  impactScore?: number;
  sourceStage?: "onboarding" | "weekly" | "transition" | "claim_builder";
  taskType?: "evidence" | "medical_eval" | "narrative" | "records";
};

type TransitionPlan = {
  userId: string;
  active: boolean;
  targetDate?: string;
  triggeredReason: string;
  tasks: TransitionTask[];
  updatedAt: string;
};

type ClaimStatusRecord = {
  userId: string;
  stage: "preparing" | "submitted" | "evidence_gathering" | "review" | "decision" | "appeal";
  updatedAt: string;
  notes?: string;
};

export async function getTransitionPlanSupabase(userId: string): Promise<TransitionPlan | null> {
  await ensureSupabaseProfile(userId);
  const supabase = createServiceSupabaseClient();

  const planResult = await supabase
    .from("transition_plans")
    .select("id, user_id, active, target_date, triggered_reason, created_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (planResult.error) throw planResult.error;
  if (!planResult.data) return null;

  const tasksResult = await supabase
    .from("transition_tasks")
    .select("id, title, rationale, urgency, status, related_conditions, task_owner, due_at, impact_score, source_stage, task_type, created_at")
    .eq("plan_id", planResult.data.id)
    .order("created_at", { ascending: false });

  if (tasksResult.error) throw tasksResult.error;

  const tasks: TransitionTask[] = tasksResult.data.map((task) => ({
    id: task.id,
    title: task.title,
    rationale: task.rationale ?? "",
    urgency: task.urgency,
    completed: task.status === "done",
    relatedConditions: (task.related_conditions as string[] | null) ?? [],
    owner: (task.task_owner as "member" | "coach" | null) ?? "member",
    dueAt: task.due_at ?? undefined,
    impactScore: task.impact_score ?? 50,
    sourceStage: (task.source_stage as TransitionTask["sourceStage"] | null) ?? "transition",
    taskType: (task.task_type as TransitionTask["taskType"] | null) ?? "evidence"
  }));

  const latestTaskAt = tasksResult.data[0]?.created_at;

  return {
    userId: planResult.data.user_id,
    active: planResult.data.active,
    targetDate: planResult.data.target_date ?? undefined,
    triggeredReason: planResult.data.triggered_reason ?? "",
    tasks,
    updatedAt: latestTaskAt ?? planResult.data.created_at
  };
}

export async function upsertTransitionPlanSupabase(input: {
  userId: string;
  active: boolean;
  targetDate?: string;
  triggeredReason: string;
  tasks: TransitionTask[];
}) {
  await ensureSupabaseProfile(input.userId);
  const supabase = createServiceSupabaseClient();

  const existing = await supabase
    .from("transition_plans")
    .select("id, created_at")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (existing.error) throw existing.error;

  let planId: string;
  let createdAt = new Date().toISOString();

  if (existing.data) {
    planId = existing.data.id;
    createdAt = existing.data.created_at;
    const updated = await supabase
      .from("transition_plans")
      .update({
        active: input.active,
        target_date: input.targetDate ?? null,
        triggered_reason: input.triggeredReason
      })
      .eq("id", planId);
    if (updated.error) throw updated.error;

    const cleared = await supabase.from("transition_tasks").delete().eq("plan_id", planId);
    if (cleared.error) throw cleared.error;
  } else {
    const inserted = await supabase
      .from("transition_plans")
      .insert({
        user_id: input.userId,
        active: input.active,
        target_date: input.targetDate ?? null,
        triggered_reason: input.triggeredReason
      })
      .select("id, created_at")
      .single();

    if (inserted.error) throw inserted.error;
    planId = inserted.data.id;
    createdAt = inserted.data.created_at;
  }

  if (input.tasks.length > 0) {
    const taskInsert = await supabase.from("transition_tasks").insert(
      input.tasks.map((task) => ({
        id: task.id,
        plan_id: planId,
        title: task.title,
        rationale: task.rationale,
        urgency: task.urgency,
        status: task.completed ? "done" : "todo",
        related_conditions: task.relatedConditions,
        task_owner: task.owner ?? "member",
        due_at: task.dueAt ?? null,
        impact_score: task.impactScore ?? 50,
        source_stage: task.sourceStage ?? "transition",
        task_type: task.taskType ?? "evidence"
      }))
    );

    if (taskInsert.error) throw taskInsert.error;
  }

  return {
    userId: input.userId,
    active: input.active,
    targetDate: input.targetDate,
    triggeredReason: input.triggeredReason,
    tasks: input.tasks,
    updatedAt: createdAt
  };
}

export async function updateTransitionTaskSupabase(userId: string, taskId: string, completed: boolean) {
  await ensureSupabaseProfile(userId);
  const supabase = createServiceSupabaseClient();

  const update = await supabase
    .from("transition_tasks")
    .update({ status: completed ? "done" : "todo" })
    .eq("id", taskId)
    .select("id")
    .maybeSingle();

  if (update.error) throw update.error;
  if (!update.data) return null;

  return getTransitionPlanSupabase(userId);
}

export async function getClaimStatusSupabase(userId: string): Promise<ClaimStatusRecord | null> {
  await ensureSupabaseProfile(userId);
  const supabase = createServiceSupabaseClient();

  const result = await supabase
    .from("claim_status_records")
    .select("status, notes, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) throw result.error;
  if (!result.data) return null;

  return {
    userId,
    stage: result.data.status as ClaimStatusRecord["stage"],
    notes: result.data.notes ?? undefined,
    updatedAt: result.data.updated_at
  };
}

export async function upsertClaimStatusSupabase(input: {
  userId: string;
  stage: ClaimStatusRecord["stage"];
  notes?: string;
}) {
  await ensureSupabaseProfile(input.userId);
  const supabase = createServiceSupabaseClient();

  const inserted = await supabase
    .from("claim_status_records")
    .insert({
      user_id: input.userId,
      status: input.stage,
      notes: input.notes ?? null,
      updated_at: new Date().toISOString()
    })
    .select("status, notes, updated_at")
    .single();

  if (inserted.error) throw inserted.error;

  return {
    userId: input.userId,
    stage: inserted.data.status as ClaimStatusRecord["stage"],
    notes: inserted.data.notes ?? undefined,
    updatedAt: inserted.data.updated_at
  };
}
