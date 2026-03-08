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

export function CohortManagementPanel() {
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [status, setStatus] = useState("Loading cohort management data...");
  const { user } = useSessionUser();

  useEffect(() => {
    if (!user?.userId) return;
    void load(user.userId);
  }, [user?.userId]);

  async function load(userId: string) {
    setStatus("Loading cohort management data...");
    const res = await fetch(`/api/admin/cohort?userId=${encodeURIComponent(userId)}`);
    const payload = (await res.json()) as { ok: boolean; cohort?: Cohort; error?: string };
    if (!res.ok || !payload.ok || !payload.cohort) {
      setStatus(payload.error ?? "Unable to load cohort management data.");
      return;
    }
    setCohort(payload.cohort);
    setStatus("Cohort management data ready.");
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-display">Program & Cohort Management</h1>
        <p className="text-sm text-muted mt-3">{status}</p>
      </Card>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-muted">Participants</p><p className="text-2xl font-display mt-1">{cohort?.participantCount ?? "--"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Average Readiness</p><p className="text-2xl font-display mt-1">{cohort?.avgReadiness ?? "--"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">At Risk</p><p className="text-2xl font-display mt-1">{cohort?.atRiskCount ?? "--"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Transitions Soon</p><p className="text-2xl font-display mt-1">{cohort?.transitionsSoon ?? "--"}</p></Card>
      </div>

      <Card className="p-6">
        <h2 className="font-display text-xl">Operational Controls</h2>
        <ul className="mt-4 space-y-2 text-sm text-muted">
          <li className="rounded-lg border border-border bg-panel2/50 px-3 py-2">Invite workflow: `/invite` route is active and supports code-based onboarding handoff.</li>
          <li className="rounded-lg border border-border bg-panel2/50 px-3 py-2">Cohort segmentation: organization membership and role tables are active for scoped analytics.</li>
          <li className="rounded-lg border border-border bg-panel2/50 px-3 py-2">Program metrics: readiness, risk, and transition outputs are aggregated across authorized cohort users.</li>
        </ul>
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
        <h2 className="font-display text-xl">Intervention Queue</h2>
        <div className="mt-4 space-y-2 text-sm text-muted">
          {(cohort?.usersNeedingIntervention ?? []).map((row) => (
            <div key={row.userId} className="rounded-lg border border-border bg-panel2/50 px-3 py-2">
              {row.userId.slice(0, 8)} • readiness {row.readiness} • transition {row.transitionReadiness} • {row.topCondition}
            </div>
          ))}
          {(cohort?.usersNeedingIntervention.length ?? 0) === 0 ? <p>No intervention queue items currently.</p> : null}
        </div>
      </Card>
    </div>
  );
}
