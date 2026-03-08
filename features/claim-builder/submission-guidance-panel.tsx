"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getOrCreateClientUserId } from "@/lib/client-user";

export function SubmissionGuidancePanel() {
  const [readiness, setReadiness] = useState<number | null>(null);
  const [blockers, setBlockers] = useState<string[]>([]);

  useEffect(() => {
    const userId = getOrCreateClientUserId();
    void load(userId);
  }, []);

  async function load(userId: string) {
    const res = await fetch(`/api/claim-builder/readiness?userId=${encodeURIComponent(userId)}`);
    const payload = (await res.json()) as { readiness: number | null; blockers: string[] };
    setReadiness(payload.readiness);
    setBlockers(payload.blockers);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-display">Submission Guidance</h1>
        <p className="text-sm text-muted mt-2">Use this checklist to finalize packet and reduce preventable defects.</p>
      </Card>
      <Card className="p-6">
        <p className="text-xs text-muted">Current Package Readiness</p>
        <p className="metric-value mt-2">{readiness ?? "--"}</p>
        <ol className="mt-4 space-y-2 text-sm text-muted list-decimal pl-5">
          <li>Verify all included conditions have supporting evidence and narrative context.</li>
          <li>Confirm timeline and event support aligns with claimed onset/progression.</li>
          <li>Export packet artifacts and keep copies of all submitted items.</li>
          <li>Track post-submission changes and prepare response strategy for VA requests.</li>
        </ol>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-xl">Open Blockers</h2>
        <ul className="mt-4 space-y-2 text-sm text-muted">
          {blockers.length === 0 ? <li>No blockers currently identified.</li> : null}
          {blockers.map((blocker) => <li key={blocker} className="rounded-lg border border-border bg-panel2/50 px-3 py-2">{blocker}</li>)}
        </ul>
      </Card>
    </div>
  );
}
