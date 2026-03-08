import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { ensureSupabaseProfile } from "@/server/persistence/supabase-common";

export type AIRecommendationQueueItem = {
  id: string;
  recommendationType: string;
  status: "pending_review" | "confirmed" | "rejected";
  requiresConfirmation: boolean;
  confidence: number;
  deterministicScore: number;
  createdAt: string;
  resolvedAt?: string;
  payload: Record<string, unknown>;
};

export async function createAIRunSupabase(input: {
  userId: string;
  runType: string;
  promptVersion?: string;
  model?: string;
  inputPayload?: Record<string, unknown>;
  outputPayload?: Record<string, unknown>;
  confidence?: number;
}) {
  await ensureSupabaseProfile(input.userId);
  const supabase = createServiceSupabaseClient();
  const result = await supabase
    .from("ai_runs")
    .insert({
      user_id: input.userId,
      run_type: input.runType,
      prompt_version: input.promptVersion ?? null,
      model: input.model ?? null,
      input: input.inputPayload ?? {},
      output: input.outputPayload ?? {},
      confidence: input.confidence ?? null
    })
    .select("id")
    .single();

  if (result.error) throw result.error;
  return result.data.id;
}

export async function createAIRecommendationSupabase(input: {
  userId: string;
  runId?: string;
  recommendationType: string;
  payload: Record<string, unknown>;
  confidence: number;
  deterministicScore: number;
  requiresConfirmation: boolean;
  explanation?: {
    whatDetected?: string;
    whyItMatters?: string;
    evidenceUsed?: string;
    missingItems?: string;
    actionRecommended?: string;
  };
}) {
  await ensureSupabaseProfile(input.userId);
  const supabase = createServiceSupabaseClient();
  const recommendationResult = await supabase
    .from("ai_recommendations")
    .insert({
      user_id: input.userId,
      run_id: input.runId ?? null,
      recommendation_type: input.recommendationType,
      payload: input.payload,
      status: "pending_review",
      requires_confirmation: input.requiresConfirmation,
      confidence: input.confidence,
      deterministic_score: input.deterministicScore
    })
    .select("id")
    .single();

  if (recommendationResult.error) throw recommendationResult.error;

  if (input.explanation) {
    const explanationResult = await supabase.from("recommendation_explanations").insert({
      recommendation_id: recommendationResult.data.id,
      what_detected: input.explanation.whatDetected ?? null,
      why_it_matters: input.explanation.whyItMatters ?? null,
      evidence_used: input.explanation.evidenceUsed ?? null,
      missing_items: input.explanation.missingItems ?? null,
      action_recommended: input.explanation.actionRecommended ?? null
    });
    if (explanationResult.error) throw explanationResult.error;
  }

  return recommendationResult.data.id;
}

export async function listAIRecommendationQueueSupabase(userId: string) {
  await ensureSupabaseProfile(userId);
  const supabase = createServiceSupabaseClient();
  const result = await supabase
    .from("ai_recommendations")
    .select("id, recommendation_type, status, requires_confirmation, confidence, deterministic_score, payload, created_at, resolved_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (result.error) throw result.error;
  return result.data.map(
    (row): AIRecommendationQueueItem => ({
      id: row.id,
      recommendationType: row.recommendation_type,
      status: (row.status ?? "pending_review") as "pending_review" | "confirmed" | "rejected",
      requiresConfirmation: row.requires_confirmation ?? true,
      confidence: row.confidence ?? 0.5,
      deterministicScore: row.deterministic_score ?? 0.5,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at ?? undefined,
      payload: (row.payload as Record<string, unknown>) ?? {}
    })
  );
}

export async function updateAIRecommendationStatusSupabase(input: {
  userId: string;
  recommendationId: string;
  status: "confirmed" | "rejected";
}) {
  const supabase = createServiceSupabaseClient();
  const result = await supabase
    .from("ai_recommendations")
    .update({
      status: input.status,
      resolved_at: new Date().toISOString(),
      reviewed_by_user_id: input.userId
    })
    .eq("id", input.recommendationId)
    .eq("user_id", input.userId)
    .select("id")
    .maybeSingle();

  if (result.error) throw result.error;
}
