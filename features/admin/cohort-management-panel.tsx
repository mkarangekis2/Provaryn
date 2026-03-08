"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useSessionUser } from "@/lib/auth/use-session-user";

type Cohort = {
  participantCount: number;
  avgReadiness: number;
  atRiskCount: number;
  transitionsSoon: number;
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
          <li className="rounded-lg border border-border bg-panel2/50 px-3 py-2">Invite workflow: API scaffolding complete, pending org email provider + invite token table.</li>
          <li className="rounded-lg border border-border bg-panel2/50 px-3 py-2">Cohort segmentation: organization membership and role tables are active for scoped expansion.</li>
          <li className="rounded-lg border border-border bg-panel2/50 px-3 py-2">Program metrics: readiness, risk, and transition outputs are live from the cohort analytics endpoint.</li>
        </ul>
      </Card>
    </div>
  );
}
