import { FeaturePage } from "@/features/layout/feature-page";

export default function Page() {
  return (
    <FeaturePage
      title="AI Transparency Center"
      subtitle="Explainability"
      description="Understand recommendation provenance, data sources used, confidence scores, and how to correct AI interpretations."
      metrics={[
        { label: "Readiness Impact", value: "High", tone: "ai" },
        { label: "Status", value: "Integrated", tone: "success" },
        { label: "Data Integrity", value: "Validated" },
        { label: "Next Milestone", value: "Operational" }
      ]}
      highlights={[
        "Complete all required fields and save to strengthen longitudinal claim evidence.",
        "Review AI explanations and confirm extracted structured data before persistence.",
        "Resolve prioritized evidence gaps to improve per-condition readiness and confidence.",
        "Track changes over time to support transition and claim submission decisions."
      ]}
    />
  );
}
