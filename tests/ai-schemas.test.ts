import { describe, it, expect } from "vitest";
import { claimStrategySchema, documentExtractionSchema, evidenceGapSchema } from "@/ai/schemas";

describe("ai schemas", () => {
  it("validates evidence gap payload", () => {
    const parsed = evidenceGapSchema.parse({
      condition: "Lumbar Strain",
      missingItems: ["Diagnosis note", "Imaging support"],
      impact: "high",
      confidence: 0.78,
      explanation: "Missing specialist evidence"
    });
    expect(parsed.condition).toContain("Lumbar");
  });

  it("validates claim strategy payload", () => {
    const parsed = claimStrategySchema.parse({
      primaryClaims: ["Lumbar Strain"],
      secondaryClaims: ["Radiculopathy"],
      blockers: ["Missing diagnosis"],
      fileNowRecommendation: false,
      rationale: "Strengthen evidence",
      confidence: 0.72
    });
    expect(parsed.fileNowRecommendation).toBe(false);
  });

  it("validates document extraction payload", () => {
    const parsed = documentExtractionSchema.parse({
      provider: "Dr. Smith",
      facility: "Base Clinic",
      encounterDate: "2026-01-10",
      diagnoses: ["Lumbar strain"],
      symptoms: ["Back pain"],
      medications: ["NSAID"],
      limitations: ["No ruck > 25lbs"],
      conditionTags: ["MSK"],
      confidence: 0.81
    });
    expect(parsed.diagnoses.length).toBe(1);
  });
});
