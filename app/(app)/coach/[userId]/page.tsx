import { FeaturePage } from "@/features/layout/feature-page";

export default async function CoachUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return (
    <FeaturePage
      title={`Coach User Detail: ${userId}`}
      subtitle="Scoped User Oversight"
      description="Permission-scoped longitudinal view for coach support, evidence gaps, transition risk, and intervention opportunities."
      metrics={[
        { label: "User Readiness", value: "69", tone: "warning" },
        { label: "Top Gap", value: "Diagnosis Coverage", tone: "risk" },
        { label: "Transition Window", value: "8 Months" },
        { label: "Follow-Up Priority", value: "High", tone: "ai" }
      ]}
      highlights={[
        "Schedule follow-up on unresolved high-impact evidence defects.",
        "Confirm user consent scope before document-level review.",
        "Prioritize tasks with strongest expected readiness impact.",
        "Use summary insights to plan next coaching touchpoint."
      ]}
    />
  );
}
