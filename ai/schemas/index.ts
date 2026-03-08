import { z } from "zod";

export const evidenceGapSchema = z.object({
  condition: z.string(),
  missingItems: z.array(z.string()),
  impact: z.enum(["low", "medium", "high"]),
  confidence: z.number().min(0).max(1),
  explanation: z.string()
});

export const claimStrategySchema = z.object({
  primaryClaims: z.array(z.string()),
  secondaryClaims: z.array(z.string()),
  blockers: z.array(z.string()),
  fileNowRecommendation: z.boolean(),
  rationale: z.string(),
  confidence: z.number().min(0).max(1)
});

export const documentExtractionSchema = z.object({
  provider: z.string().optional(),
  facility: z.string().optional(),
  encounterDate: z.string().optional(),
  diagnoses: z.array(z.string()),
  symptoms: z.array(z.string()),
  medications: z.array(z.string()),
  limitations: z.array(z.string()),
  conditionTags: z.array(z.string()),
  confidence: z.number().min(0).max(1)
});

export const onboardingIntelligenceSchema = z.object({
  summary: z.string(),
  confidence: z.number().min(0).max(1),
  inferredConditions: z.array(
    z.object({
      name: z.string(),
      bodySystem: z.string(),
      likelihood: z.enum(["low", "medium", "high"]),
      why: z.string(),
      missingEvidence: z.array(z.string()),
      recommendedActions: z.array(z.string())
    })
  ),
  exposureFindings: z.array(
    z.object({
      exposure: z.string(),
      confidence: z.enum(["low", "medium", "high"]),
      implications: z.array(z.string())
    })
  ),
  immediatePlan: z.array(
    z.object({
      title: z.string(),
      rationale: z.string(),
      urgency: z.number().int().min(1).max(5),
      timeframe: z.string(),
      relatedConditions: z.array(z.string())
    })
  ),
  clarifyingQuestions: z.array(z.string())
});
