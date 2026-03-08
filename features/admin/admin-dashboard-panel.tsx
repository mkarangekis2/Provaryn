"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getOrCreateClientUserId } from "@/lib/client-user";

type Cohort = {
  participantCount: number;
  avgReadiness: number;
  atRiskCount: number;
  transitionsSoon: number;
  completionMetrics: { onboardingCompletion: number; checkInCadence: number; evidenceCoverage: number };
};

export function AdminDashboardPanel() {
  const [cohort, setCohort] = useState<Cohort | null>(null);

  useEffect(() => {
    const userId = getOrCreateClientUserId();
    void load(userId);
  }, []);

  async function load(userId: string) {
    const res = await fetch(`/api/admin/cohort?userId=${encodeURIComponent(userId)}`);
    const payload = (await res.json()) as { cohort: Cohort };
    setCohort(payload.cohort);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6"><h1 className="text-3xl font-display">Program Admin Dashboard</h1></Card>
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
    </div>
  );
}
