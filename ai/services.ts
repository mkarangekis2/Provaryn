import { prompts } from "@/ai/prompts";
import { runStructuredPrompt } from "@/ai/openai-client";
import {
  claimStrategySchema,
  documentExtractionSchema,
  evidenceGapSchema,
  onboardingIntelligenceSchema
} from "@/ai/schemas";

export async function evidenceGapService(input: { condition: string; evidenceSummary: string }) {
  return runStructuredPrompt(
    {
      system: prompts.evidenceGap.system,
      user: `${prompts.evidenceGap.userTemplate}\nCondition: ${input.condition}\nEvidence: ${input.evidenceSummary}`,
      promptVersion: prompts.evidenceGap.version,
      runType: "evidence_gap"
    },
    evidenceGapSchema
  );
}

export async function claimStrategyService(input: { readiness: number; conditions: string[]; blockers: string[] }) {
  return runStructuredPrompt(
    {
      system: prompts.claimStrategy.system,
      user: `${prompts.claimStrategy.userTemplate}\nReadiness: ${input.readiness}\nConditions: ${input.conditions.join(", ")}\nBlockers: ${input.blockers.join(", ")}`,
      promptVersion: prompts.claimStrategy.version,
      runType: "claim_strategy"
    },
    claimStrategySchema
  );
}

export async function documentExtractionService(input: { text: string }) {
  return runStructuredPrompt(
    {
      system: prompts.documentExtraction.system,
      user: `${prompts.documentExtraction.userTemplate}\n${input.text}`,
      promptVersion: prompts.documentExtraction.version,
      runType: "document_extraction"
    },
    documentExtractionSchema
  );
}

export async function onboardingIntelligenceService(input: {
  serviceProfile: {
    branch: string;
    component: string;
    rank: string;
    mos: string;
    yearsServed: number;
    currentStatus: string;
    dateJoined?: string;
    etsDate?: string;
  };
  timeline: {
    deployments: Array<{ location: string; startDate?: string; endDate?: string; combatExposure: string }>;
    schools: string[];
    qualifications: string[];
  };
  exposures: Record<string, { level: "none" | "possible" | "likely" | "confirmed"; notes?: string }>;
  health: Array<{
    category: string;
    occurrence: "none" | "rare" | "weekly" | "daily";
    severity: number;
    impact: "none" | "mild" | "moderate" | "severe";
    careSought: "none" | "primary" | "specialist" | "er";
    notes?: string;
  }>;
  goals?: string;
}) {
  return runStructuredPrompt(
    {
      system: prompts.onboardingIntelligence.system,
      user: `${prompts.onboardingIntelligence.userTemplate}\n${JSON.stringify(input, null, 2)}`,
      promptVersion: prompts.onboardingIntelligence.version,
      runType: "onboarding_intelligence"
    },
    onboardingIntelligenceSchema
  );
}

export const aiServices = {
  evidenceGapService,
  claimStrategyService,
  documentExtractionService,
  onboardingIntelligenceService
};
