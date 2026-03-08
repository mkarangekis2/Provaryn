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
