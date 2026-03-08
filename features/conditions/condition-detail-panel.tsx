"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrCreateClientUserId } from "@/lib/client-user";

type Condition = {
  id: string;
  label: string;
  category: string;
  confidence: number;
  readiness: number;
  serviceConnection: number;
  diagnosisStatus: "confirmed" | "suspected" | "missing";
  evidenceSignals: string[];
  urgency: "low" | "medium" | "high";
};

export function ConditionDetailPanel({ conditionId }: { conditionId: string }) {
  const [condition, setCondition] = useState<Condition | null>(null);
  const [status, setStatus] = useState("Loading condition detail...");

  useEffect(() => {
    const userId = getOrCreateClientUserId();
    void load(userId, conditionId);
  }, [conditionId]);

  async function load(userId: string, id: string) {
    const response = await fetch(`/api/intelligence/conditions?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) {
      setStatus("Unable to load condition intelligence.");
      return;
    }

    const payload = (await response.json()) as { conditions: Condition[] };
    const found = payload.conditions.find((item) => item.id === id) ?? null;
    setCondition(found);
    setStatus(found ? "Condition detail loaded." : "Condition not found. Generate more evidence signals first.");
  }

  const blockerText = useMemo(() => {
    if (!condition) return [];
    const blockers: string[] = [];
    if (condition.diagnosisStatus === "missing") blockers.push("Diagnosis confirmation is still missing.");
    if (condition.serviceConnection < 60) blockers.push("Service-connection support is below optimal threshold.");
    if (condition.readiness < 70) blockers.push("Readiness is below file-now threshold; add supporting evidence.");
    return blockers;
  }, [condition]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="kicker">Condition Detail</p>
        <h1 className="text-3xl font-display mt-2">{condition?.label ?? conditionId}</h1>
        <p className="text-sm text-muted mt-2">{status}</p>
      </Card>

      {condition ? (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="p-4"><p className="text-xs text-muted">Readiness</p><p className="text-2xl font-display mt-1">{condition.readiness}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted">Confidence</p><p className="text-2xl font-display mt-1">{Math.round(condition.confidence * 100)}%</p></Card>
            <Card className="p-4"><p className="text-xs text-muted">Service Connection</p><p className="text-2xl font-display mt-1">{condition.serviceConnection}%</p></Card>
            <Card className="p-4"><p className="text-xs text-muted">Diagnosis</p><p className="text-2xl font-display mt-1">{condition.diagnosisStatus}</p></Card>
          </div>

          <Card className="p-6">
            <h2 className="font-display text-xl">Why Flagged</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {condition.evidenceSignals.map((signal) => (
                <Badge key={signal} tone="ai">{signal}</Badge>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-xl">Readiness Blockers</h2>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              {blockerText.length === 0 ? <li>Major blockers resolved. Continue documentation cadence.</li> : null}
              {blockerText.map((blocker) => (
                <li key={blocker} className="rounded-lg border border-border bg-panel2/50 px-3 py-2">{blocker}</li>
              ))}
            </ul>
          </Card>
        </>
      ) : null}
    </div>
  );
}
