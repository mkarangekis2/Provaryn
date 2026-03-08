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

  return (
    <div className="space-y-6">
      <Card className="p-6"><h1 className="text-3xl font-display">Weekly Check-In Results</h1></Card>
      <div className="grid md:grid-cols-5 gap-4">
        <Card className="p-4"><p className="text-xs text-muted">Overall</p><p className="text-2xl font-display mt-1">{snapshot?.score.overall ?? "--"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Evidence</p><p className="text-2xl font-display mt-1">{snapshot?.score.evidenceCompleteness ?? "--"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Diagnosis</p><p className="text-2xl font-display mt-1">{snapshot?.score.diagnosisCoverage ?? "--"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Service Link</p><p className="text-2xl font-display mt-1">{snapshot?.score.serviceConnectionStrength ?? "--"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Transition</p><p className="text-2xl font-display mt-1">{snapshot?.score.transitionReadiness ?? "--"}</p></Card>
      </div>
      <Card className="p-6">
        <h2 className="font-display text-xl">Detected Signals</h2>
        <div className="mt-3 flex flex-wrap gap-2">{newSignals.map((s) => <Badge key={s.label} tone={s.urgency === "high" ? "risk" : s.urgency === "medium" ? "warning" : "success"}>{s.label}</Badge>)}</div>
      </Card>
    </div>
  );
}
