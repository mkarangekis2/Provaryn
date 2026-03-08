export type AppRole = "user" | "coach" | "program_admin" | "system_admin";

export type Entitlement = {
  reconstructionUnlocked: boolean;
  premiumActive: boolean;
  claimBuilderUnlocked: boolean;
};

export type ClaimReadinessScore = {
  overall: number;
  evidenceCompleteness: number;
  diagnosisCoverage: number;
  serviceConnectionStrength: number;
  transitionReadiness: number;
};

export type AIRunType =
  | "career_reconstruction"
  | "exposure_inference"
  | "symptom_classification"
  | "condition_detection"
  | "secondary_condition"
  | "evidence_gap"
  | "claim_strategy"
  | "narrative_generation"
  | "document_extraction"
  | "benefits_insight";
