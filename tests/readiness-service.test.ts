import { describe, it, expect } from "vitest";
import { calculateClaimReadiness } from "@/services/readiness-service";

describe("calculateClaimReadiness", () => {
  it("returns bounded and weighted scores", () => {
    const result = calculateClaimReadiness({
      symptomLogCount: 20,
      diagnosisCount: 3,
      serviceEventsLinked: 5,
      exposureLinks: 4,
      documentCount: 8,
      narrativeCount: 2,
      specialistEvaluations: 2
    });

    expect(result.overall).toBeGreaterThan(0);
    expect(result.overall).toBeLessThanOrEqual(100);
    expect(result.evidenceCompleteness).toBeLessThanOrEqual(100);
  });
});
