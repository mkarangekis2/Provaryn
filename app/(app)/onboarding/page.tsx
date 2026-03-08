import { FeaturePage } from "@/features/layout/feature-page";

export default function Page() {
  return (
    <FeaturePage
      title="Welcome & Orientation"
      subtitle="Guided Start"
      description="Explain system lifecycle, weekly loop expectations, data controls, and security posture before profile creation."
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
