import { FeaturePage } from "@/features/layout/feature-page";

export default async function ConditionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FeaturePage
      title={`Condition Detail: ${id}`}
      subtitle="Deep Condition Context"
      description="Condition-level evidence map includes symptom timeline, service connections, related exposures/events, diagnosis status, and next-best actions."
      metrics={[
        { label: "Condition Readiness", value: "74", tone: "warning" },
        { label: "Service Connection", value: "Strong", tone: "success" },
        { label: "Diagnosis Status", value: "Pending", tone: "warning" },
        { label: "Secondary Potential", value: "High", tone: "ai" }
      ]}
      highlights={[
        "Confirm diagnosis documentation and link provider notes.",
        "Strengthen symptom frequency logs over a consistent timeline.",
        "Attach event evidence and exposure support for claim narrative cohesion.",
        "Generate condition narrative draft once blockers are closed."
      ]}
    />
  );
}
