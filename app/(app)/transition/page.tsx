import { FeaturePage } from "@/features/layout/feature-page";

export default function Page() {
  return (
    <FeaturePage
      title="Transition Mode"
      subtitle="ETS/Retirement Preparation"
      description="Activate transition mode based on timeline, intent, or readiness thresholds and focus effort on highest-value pre-separation actions."
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
