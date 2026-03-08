import { describe, expect, it } from "vitest";
import { documentExtractionSchema } from "@/ai/schemas";

describe("document workflow", () => {
  it("accepts extraction review payload for persistence", () => {
    const extraction = documentExtractionSchema.parse({
      provider: "Provider",
      facility: "Facility",
      encounterDate: "2025-03-01",
      diagnoses: ["Diagnosis"],
      symptoms: ["Symptom"],
      medications: ["Medication"],
      limitations: ["Limitation"],
      conditionTags: ["Tag"],
      confidence: 0.75
    });

    expect(extraction.confidence).toBeGreaterThan(0.5);
  });
});
