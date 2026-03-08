"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useSessionUser } from "@/lib/auth/use-session-user";

type Cohort = {
  participantCount: number;
  avgReadiness: number;
  atRiskCount: number;
  transitionsSoon: number;
  readinessDistribution: { low: number; medium: number; high: number };
  usersNeedingIntervention: Array<{ userId: string; readiness: number; transitionReadiness: number; topCondition: string }>;
  completionMetrics: { onboardingCompletion: number; checkInCadence: number; evidenceCoverage: number };
};

export function AdminDashboardPanel() {
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [status, setStatus] = useState("Loading cohort analytics...");
  const { user } = useSessionUser();

  useEffect(() => {
    if (!user?.userId) return;
    void load(user.userId);
  }, [user?.userId]);

  async function load(userId: string) {
    setStatus("Loading cohort analytics...");
    const res = await fetch(`/api/admin/cohort?userId=${encodeURIComponent(userId)}`);
    const payload = (await res.json()) as { ok: boolean; cohort?: Cohort; error?: string };
    if (!res.ok || !payload.ok || !payload.cohort) {
      setStatus(payload.error ?? "Unable to load cohort analytics.");
      return;
    }
    setCohort(payload.cohort);
    setStatus("Cohort analytics ready.");
  }

  return (
    <div className="space-y-6">
      <Card className="p-6"><h1 className="text-3xl font-display">Program Admin Dashboard</h1></Card>
      <p className="text-sm text-muted">{status}</p>
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-muted">Participants</p><p className="text-2xl font-display mt-1">{cohort?.participantCount ?? "--"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Average Readiness</p><p className="text-2xl font-display mt-1">{cohort?.avgReadiness ?? "--"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">At Risk</p><p className="text-2xl font-display mt-1">{cohort?.atRiskCount ?? "--"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Transitions Soon</p><p className="text-2xl font-display mt-1">{cohort?.transitionsSoon ?? "--"}</p></Card>
      </div>
      <Card className="p-6">
        <h2 className="font-display text-xl">Completion Metrics</h2>
        <div className="grid md:grid-cols-3 gap-3 mt-4 text-sm">
          <div className="rounded-lg border border-border bg-panel2/50 p-3">Onboarding: {cohort?.completionMetrics.onboardingCompletion ?? 0}%</div>
          <div className="rounded-lg border border-border bg-panel2/50 p-3">Check-in Cadence: {cohort?.completionMetrics.checkInCadence ?? 0}%</div>
          <div className="rounded-lg border border-border bg-panel2/50 p-3">Evidence Coverage: {cohort?.completionMetrics.evidenceCoverage ?? 0}%</div>
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-xl">Readiness Distribution</h2>
        <div className="grid md:grid-cols-3 gap-3 mt-4 text-sm">
          <div className="rounded-lg border border-border bg-panel2/50 p-3">Low (&lt;60): {cohort?.readinessDistribution.low ?? 0}</div>
          <div className="rounded-lg border border-border bg-panel2/50 p-3">Medium (60-79): {cohort?.readinessDistribution.medium ?? 0}</div>
          <div className="rounded-lg border border-border bg-panel2/50 p-3">High (80+): {cohort?.readinessDistribution.high ?? 0}</div>
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-xl">Users Needing Intervention</h2>
        <div className="mt-4 space-y-2 text-sm text-muted">
          {(cohort?.usersNeedingIntervention ?? []).map((row) => (
            <div key={row.userId} className="rounded-lg border border-border bg-panel2/50 px-3 py-2">
              {row.userId.slice(0, 8)} • readiness {row.readiness} • transition {row.transitionReadiness} • {row.topCondition}
            </div>
          ))}
          {(cohort?.usersNeedingIntervention.length ?? 0) === 0 ? <p>No high-priority intervention users right now.</p> : null}
        </div>
      </Card>
    </div>
  );
}
