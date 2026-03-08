"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const trendData = [
  { week: "W1", readiness: 52, evidence: 43 },
  { week: "W2", readiness: 57, evidence: 48 },
  { week: "W3", readiness: 61, evidence: 53 },
  { week: "W4", readiness: 67, evidence: 59 },
  { week: "W5", readiness: 72, evidence: 64 },
  { week: "W6", readiness: 76, evidence: 68 },
  { week: "W7", readiness: 81, evidence: 73 }
];

export function HomeDashboard() {
  return (
    <div className="space-y-6">
      <section className="grid xl:grid-cols-4 md:grid-cols-2 gap-4">
        <Card className="p-5"><p className="text-muted text-sm">Claim Readiness</p><p className="metric-value mt-2">81</p><Badge tone="success" className="mt-3">+6 this month</Badge></Card>
        <Card className="p-5"><p className="text-muted text-sm">Estimated Rating</p><p className="metric-value mt-2">70-90%</p><Badge tone="ai" className="mt-3">Expected</Badge></Card>
        <Card className="p-5"><p className="text-muted text-sm">Evidence Gaps</p><p className="metric-value mt-2">12</p><Badge tone="warning" className="mt-3">4 high impact</Badge></Card>
        <Card className="p-5"><p className="text-muted text-sm">Transition Window</p><p className="metric-value mt-2">245d</p><Badge tone="risk" className="mt-3">Prioritize now</Badge></Card>
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <p className="kicker">Readiness Trend</p>
          <h2 className="text-xl font-display mt-2">Claim Strength Progression</h2>
          <div className="h-72 mt-5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="readiness" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="week" stroke="hsl(var(--muted))" />
                <YAxis stroke="hsl(var(--muted))" />
                <Tooltip contentStyle={{ background: "#121826", border: "1px solid #283042", borderRadius: 12 }} />
                <Area type="monotone" dataKey="readiness" stroke="hsl(var(--accent))" fill="url(#readiness)" strokeWidth={3} />
                <Area type="monotone" dataKey="evidence" stroke="hsl(var(--ai))" fillOpacity={0} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <p className="kicker">Next Best Actions</p>
          <h2 className="text-xl font-display mt-2">Execution Queue</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li className="rounded-lg border border-border p-3">Book audiology exam for hearing and tinnitus support.</li>
            <li className="rounded-lg border border-border p-3">Attach profile records for lumbar strain incidents.</li>
            <li className="rounded-lg border border-border p-3">Complete weekly check-in to preserve symptom continuity.</li>
            <li className="rounded-lg border border-border p-3">Generate updated claim strategy after new evidence upload.</li>
          </ul>
        </Card>
      </section>
    </div>
  );
}
