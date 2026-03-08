"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getOrCreateClientUserId } from "@/lib/client-user";

export function TransitionReadinessPanel() {
  const [status, setStatus] = useState("Loading package readiness...");
  const [readiness, setReadiness] = useState<number | null>(null);
  const [blockers, setBlockers] = useState<string[]>([]);

  useEffect(() => {
    const userId = getOrCreateClientUserId();
    void load(userId);
  }, []);

  async function load(userId: string) {
    const response = await fetch(`/api/claim-builder/readiness?userId=${encodeURIComponent(userId)}`);
    const payload = (await response.json()) as { readiness: number | null; blockers: string[] };
    setReadiness(payload.readiness);
    setBlockers(payload.blockers);
    setStatus("Readiness review loaded.");
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-display">Claim Package Readiness Review</h1>
        <p className="text-sm text-muted mt-2">{status}</p>
      </Card>
      <Card className="p-6">
        <p className="text-xs text-muted">Package Readiness</p>
        <p className="metric-value mt-2">{readiness ?? "--"}</p>
        <div className="mt-3 h-2 rounded-full bg-panel2 overflow-hidden"><div className="h-full bg-accent" style={{ width: `${readiness ?? 0}%` }} /></div>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-xl">Current Blockers</h2>
        <ul className="mt-4 space-y-2 text-sm text-muted">
          {blockers.length === 0 ? <li>No blockers detected.</li> : null}
          {blockers.map((blocker) => <li key={blocker} className="rounded-lg border border-border bg-panel2/50 px-3 py-2">{blocker}</li>)}
        </ul>
      </Card>
    </div>
  );
}
