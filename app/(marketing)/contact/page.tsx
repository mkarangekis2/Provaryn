import { FeaturePage } from "@/features/layout/feature-page";

export default function ContactPage() {
  return <FeaturePage title="Contact & Demo" subtitle="Deployment Support" description="Request a demo, partnership setup, or deployment support for transition programs and service organizations." metrics={[{ label: "Demo Time", value: "30 min" }, { label: "Program Rollout", value: "Guided" }, { label: "API Integrations", value: "Available" }, { label: "Support", value: "Priority" }]} highlights={["Submit enterprise request for coach/program onboarding.","Receive security and integration package with deployment checklist.","Configure organization branding and cohort segmentation.","Schedule readiness intelligence workflow training."]} />;
}