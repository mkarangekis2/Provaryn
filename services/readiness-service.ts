import type { ClaimReadinessScore } from "@/types/domain";

export function calculateClaimReadiness(input: {
  symptomLogCount: number;
  diagnosisCount: number;
  serviceEventsLinked: number;
  exposureLinks: number;
  documentCount: number;
  narrativeCount: number;
  specialistEvaluations: number;
}): ClaimReadinessScore {
  const evidenceCompleteness = Math.min(100, Math.round(input.documentCount * 4 + input.narrativeCount * 8 + input.serviceEventsLinked * 3));
  const diagnosisCoverage = Math.min(100, Math.round(input.diagnosisCount * 12 + input.specialistEvaluations * 10));
  const serviceConnectionStrength = Math.min(100, Math.round(input.serviceEventsLinked * 10 + input.exposureLinks * 7));
  const transitionReadiness = Math.min(100, Math.round((evidenceCompleteness + diagnosisCoverage + serviceConnectionStrength) / 3));
  const symptomSignal = Math.min(100, Math.round(input.symptomLogCount * 3));
  const overall = Math.round((evidenceCompleteness * 0.28) + (diagnosisCoverage * 0.24) + (serviceConnectionStrength * 0.24) + (transitionReadiness * 0.14) + (symptomSignal * 0.10));

  return {
    overall,
    evidenceCompleteness,
    diagnosisCoverage,
    serviceConnectionStrength,
    transitionReadiness
  };
}
