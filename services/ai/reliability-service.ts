export type ReliabilityInput = {
  llmConfidence: number;
  evidenceSignals: number;
  missingItems: number;
};

export type ReliabilityOutput = {
  deterministicScore: number;
  combinedConfidence: number;
  requiresHumanConfirmation: boolean;
  reason: string;
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function scoreAIRecommendationReliability(input: ReliabilityInput): ReliabilityOutput {
  const evidenceScore = clamp01(input.evidenceSignals / 6);
  const penalty = clamp01(input.missingItems / 8);
  const deterministicScore = clamp01(0.65 * evidenceScore + 0.35 * (1 - penalty));
  const combinedConfidence = clamp01(0.6 * clamp01(input.llmConfidence) + 0.4 * deterministicScore);

  const requiresHumanConfirmation = combinedConfidence < 0.74 || input.missingItems >= 3;
  const reason = requiresHumanConfirmation
    ? "Confidence or evidence completeness below release threshold."
    : "Confidence threshold passed with sufficient evidence signals.";

  return {
    deterministicScore,
    combinedConfidence,
    requiresHumanConfirmation,
    reason
  };
}
