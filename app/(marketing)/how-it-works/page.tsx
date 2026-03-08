import Link from "next/link";
import { Card } from "@/components/ui/card";

const stages = [
  {
    title: "Build Your Career Graph",
    detail: "Capture service profile, timeline history, units, deployments, and exposure indicators in one connected record."
  },
  {
    title: "Run Weekly Documentation Loops",
    detail: "Log symptoms, incidents, and performance impact in 2-3 minutes per week to build longitudinal proof."
  },
  {
    title: "Convert Records Into Structured Evidence",
    detail: "Upload records, review extraction, confirm diagnosis/symptom metadata, and link documents to conditions."
  },
  {
    title: "Optimize Claim Strategy",
    detail: "Use explainable AI + deterministic scoring to prioritize strongest claims, secondaries, and next actions."
  },
  {
    title: "Transition and File with Confidence",
    detail: "Activate transition mode, close high-impact evidence gaps, assemble packet artifacts, and follow submission guidance."
  }
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-10">
      <section className="space-y-4">
        <p className="kicker">How It Works</p>
        <h1 className="text-4xl md:text-5xl font-display">A Full-Career Operating System for Claim Readiness</h1>
        <p className="text-muted max-w-3xl">The platform reduces evidence defects over time so you are not rebuilding your history during transition.</p>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        {stages.map((stage, index) => (
          <Card key={stage.title} className="p-6">
            <p className="kicker">Stage {index + 1}</p>
            <h2 className="text-xl font-display mt-2">{stage.title}</h2>
            <p className="text-sm text-muted mt-3">{stage.detail}</p>
          </Card>
        ))}
      </section>

      <Card className="p-6 md:p-8 bg-brand-gradient">
        <h2 className="text-2xl font-display">Ready to map your readiness baseline?</h2>
        <p className="text-muted mt-2">Start free, complete onboarding, and get your first intelligence snapshot.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/signup" className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-black">Start Free</Link>
          <Link href="/pricing" className="rounded-xl border border-border px-4 py-2 text-sm">View Pricing</Link>
        </div>
      </Card>
    </div>
  );
}
