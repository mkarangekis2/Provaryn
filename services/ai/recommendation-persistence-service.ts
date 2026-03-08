import { scoreAIRecommendationReliability } from "@/services/ai/reliability-service";
import { createAIRecommendationSupabase, createAIRunSupabase } from "@/server/persistence/supabase-ai";
import { addAuditEntrySupabase } from "@/server/persistence/supabase-settings";

export async function persistAIRecommendation(input: {
  userId: string;
  runType: string;
  promptVersion?: string;
  recommendationType: string;
  model: string;
  llmConfidence: number;
  payload: Record<string, unknown>;
  inputPayload?: Record<string, unknown>;
  evidenceSignals: number;
  missingItems: number;
  explanation?: {
    whatDetected?: string;
    whyItMatters?: string;
    evidenceUsed?: string;
    missingItems?: string;
    actionRecommended?: string;
  };
}) {
  const reliability = scoreAIRecommendationReliability({
    llmConfidence: input.llmConfidence,
    evidenceSignals: input.evidenceSignals,
    missingItems: input.missingItems
  });

  const runId = await createAIRunSupabase({
    userId: input.userId,
    runType: input.runType,
    promptVersion: input.promptVersion,
    model: input.model,
    inputPayload: input.inputPayload,
    outputPayload: input.payload,
    confidence: reliability.combinedConfidence
  });

  const recommendationId = await createAIRecommendationSupabase({
    userId: input.userId,
    runId,
    recommendationType: input.recommendationType,
    payload: input.payload,
    confidence: reliability.combinedConfidence,
    deterministicScore: reliability.deterministicScore,
    requiresConfirmation: reliability.requiresHumanConfirmation,
    explanation: input.explanation
  });

  await addAuditEntrySupabase({
    userId: input.userId,
    action: reliability.requiresHumanConfirmation ? "ai_recommendation_queued_for_review" : "ai_recommendation_auto_confident",
    category: "ai",
    metadata: {
      runId,
      recommendationId,
      runType: input.runType,
      recommendationType: input.recommendationType,
      confidence: reliability.combinedConfidence
    }
  });

  return {
    runId,
    recommendationId,
    reliability
  };
}
