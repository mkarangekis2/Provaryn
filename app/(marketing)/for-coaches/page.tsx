import Link from "next/link";
import { Card } from "@/components/ui/card";

const coachOutcomes = [
  "Permission-scoped caseload view with readiness and risk signals",
  "Prioritized evidence-gap interventions by user and claim impact",
  "Transition countdown tracking with action completion monitoring",
  "AI-generated coaching summaries with explainability context"
];

const adminOutcomes = [
  "Cohort readiness distribution and completion metrics",
  "Near-ETS risk surfacing for proactive support",
  "Organization access governance and invite management",
  "Program performance telemetry for operational reviews"
];

export default function ForCoachesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-10">
      <section className="space-y-4">
        <p className="kicker">For Coaches & Programs</p>
        <h1 className="text-4xl md:text-5xl font-display">Support More Service Members with Less Administrative Drag</h1>
        <p className="text-muted max-w-3xl">Coach and program dashboards are purpose-built for intervention, accountability, and secure cross-role collaboration.</p>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h2 className="text-xl font-display">Coach Workbench</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted list-disc pl-5">
            {coachOutcomes.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </Card>
        <Card className="p-6">
          <h2 className="text-xl font-display">Program Admin Intelligence</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted list-disc pl-5">
            {adminOutcomes.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </Card>
      </section>

      <Card className="p-6 md:p-8 bg-brand-gradient">
        <h2 className="text-2xl font-display">Deploy for Your Cohort</h2>
        <p className="text-muted mt-2">Launch with scoped access controls, invite workflows, and operational dashboards.</p>
        <div className="mt-5 flex gap-3">
          <Link href="/contact" className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-black">Request Demo</Link>
          <Link href="/security" className="rounded-xl border border-border px-4 py-2 text-sm">Review Security</Link>
        </div>
      </Card>
    </div>
  );
}
