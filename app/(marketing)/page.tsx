import Link from "next/link";
import { Card } from "@/components/ui/card";

const pillars = [
  "Career intelligence graph for service history, exposures, health, and evidence",
  "Continuous claim-readiness scoring with explainable AI recommendations",
  "Transition mode with prioritized actions before ETS/retirement",
  "Secure document vault, extraction review, and claim package assembly"
];

export default function LandingPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-14">
      <section className="grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <p className="kicker">AI Military Career Operating System</p>
          <h1 className="text-4xl md:text-6xl font-display mt-3 leading-tight">Build Your Future VA Claim Strength While You Serve.</h1>
          <p className="text-muted mt-5 text-lg">Valor tracks exposures, symptoms, incidents, and records over time to produce evidence-complete claim strategy and transition guidance.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="rounded-xl bg-accent px-5 py-3 text-black font-semibold">Start Free</Link>
            <Link href="/how-it-works" className="rounded-xl border border-border px-5 py-3">See How It Works</Link>
          </div>
        </div>
        <Card className="p-6 bg-brand-gradient">
          <p className="kicker">Live Operational Snapshot</p>
          <p className="metric-value mt-3">84</p>
          <p className="text-muted">Claim Readiness Score</p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted">Evidence completeness</span><span>79%</span></div>
            <div className="flex justify-between"><span className="text-muted">Diagnosis coverage</span><span>71%</span></div>
            <div className="flex justify-between"><span className="text-muted">Projected rating range</span><span>70-90%</span></div>
          </div>
        </Card>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        {pillars.map((pillar) => (
          <Card key={pillar} className="p-6"><p>{pillar}</p></Card>
        ))}
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <Card className="p-6"><p className="kicker">Free</p><p className="text-2xl font-display mt-2">Career Tracking</p></Card>
        <Card className="p-6"><p className="kicker">One-Time</p><p className="text-2xl font-display mt-2">$2.99 Reconstruction</p></Card>
        <Card className="p-6"><p className="kicker">Premium</p><p className="text-2xl font-display mt-2">Claim Intelligence + Builder</p></Card>
      </section>
    </div>
  );
}