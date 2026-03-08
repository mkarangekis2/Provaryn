"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrCreateClientUserId } from "@/lib/client-user";

type Snapshot = {
  score: { overall: number; evidenceCompleteness: number; diagnosisCoverage: number; serviceConnectionStrength: number; transitionReadiness: number };
  snapshot: { counts: { checkIns: number; symptomEntries: number; highSeverityEntries: number; events: number; timelineEntries: number; documents: number } };
};

type Condition = { label: string; readiness: number; urgency: "low" | "medium" | "high" };

export function CheckInResultsPanel() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [conditions, setConditions] = useState<Condition[]>([]);

  useEffect(() => {
    const userId = getOrCreateClientUserId();
    void load(userId);
  }, []);

  async function load(userId: string) {
    const [snapRes, condRes] = await Promise.all([
      fetch(`/api/intelligence/snapshot?userId=${encodeURIComponent(userId)}`),
      fetch(`/api/intelligence/conditions?userId=${encodeURIComponent(userId)}`)
    ]);

    setSnapshot(await snapRes.json() as Snapshot);
    const condPayload = (await condRes.json()) as { conditions: Condition[] };
    setConditions(condPayload.conditions);
  }

  const newSignals = useMemo(() => conditions.filter((c) => c.readiness >= 45).slice(0, 4), [conditions]);
  const urgentSignals = useMemo(() => conditions.filter((c) => c.urgency === "high").slice(0, 4), [conditions]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="kicker">Weekly Update Results</p>
        <h1 className="text-3xl font-display mt-2">Signal Breakdown</h1>
        <p className="text-sm text-muted mt-2">Latest trend, detected condition signals, and priority next actions.</p>
      </Card>

      <div className="grid md:grid-cols-5 gap-4">
        <Card className="p-4"><p className="text-xs text-muted">Overall</p><p className="text-2xl font-display mt-1">{snapshot?.score.overall ?? "--"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Evidence</p><p className="text-2xl font-display mt-1">{snapshot?.score.evidenceCompleteness ?? "--"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Diagnosis</p><p className="text-2xl font-display mt-1">{snapshot?.score.diagnosisCoverage ?? "--"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Service Link</p><p className="text-2xl font-display mt-1">{snapshot?.score.serviceConnectionStrength ?? "--"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Transition</p><p className="text-2xl font-display mt-1">{snapshot?.score.transitionReadiness ?? "--"}</p></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <h2 className="font-display text-xl">Detected Signals</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {newSignals.map((s) => (
              <Badge key={s.label} tone={s.urgency === "high" ? "risk" : s.urgency === "medium" ? "warning" : "success"}>
                {s.label}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-xl">Priority Follow-Ups</h2>
          <div className="mt-3 space-y-2">
            {urgentSignals.length === 0 ? <p className="text-sm text-muted">No urgent follow-up flags this week.</p> : null}
            {urgentSignals.map((signal) => (
              <div key={signal.label} className="rounded-xl border border-border bg-panel2/60 px-3 py-2">
                <p className="text-sm font-semibold">{signal.label}</p>
                <p className="text-xs text-muted mt-1">Readiness {signal.readiness} • High urgency</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
