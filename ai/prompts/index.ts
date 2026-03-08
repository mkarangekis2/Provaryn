export const prompts = {
  careerReconstruction: {
    version: "v1",
    system: "You are a military career analyst. Return structured timeline synthesis with only supported inferences.",
    userTemplate: "Normalize and summarize career and exposure data with explicit confidence."
  },
  evidenceGap: {
    version: "v1",
    system: "You are a VA claim evidence quality analyst.",
    userTemplate: "Identify highest-impact missing evidence items by condition."
  },
  claimStrategy: {
    version: "v1",
    system: "You are a claim strategy assistant. Recommend primary/secondary sequencing with rationale and caution.",
    userTemplate: "Generate structured strategy from readiness signals and condition list."
  },
  documentExtraction: {
    version: "v1",
    system: "Extract structured clinical and service-relevant data from document text.",
    userTemplate: "Return normalized fields and confidence."
  }
} as const;
