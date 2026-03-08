"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrCreateClientUserId } from "@/lib/client-user";

type SnapshotResponse = {
  ok: boolean;
  score: {
    overall: number;
    evidenceCompleteness: number;
    diagnosisCoverage: number;
    serviceConnectionStrength: number;
    transitionReadiness: number;
  };
  snapshot: {
    counts: {
      checkIns: number;
      symptomEntries: number;
      highSeverityEntries: number;
      events: number;
      timelineEntries: number;
      documents: number;
    };
  };
};

export function ClaimIntelligencePanel() {
  const [userId, setUserId] = useState("");
  const [data, setData] = useState<SnapshotResponse | null>(null);
  const [status, setStatus] = useState("Loading intelligence snapshot...");

  useEffect(() => {
    const id = getOrCreateClientUserId();
    setUserId(id);
    void load(id);
  }, []);

  async function load(id: string) {
    const response = await fetch(`/api/intelligence/snapshot?userId=${encodeURIComponent(id)}`);
    if (!response.ok) {
      setStatus("Unable to load claim intelligence snapshot.");
      return;
    }
    const payload = (await response.json()) as SnapshotResponse;
    setData(payload);
    setStatus("Live snapshot loaded.");
  }

  const ratingRange = useMemo(() => {
    if (!data) return "n/a";
    const low = Math.max(10, Math.round(data.score.overall * 0.75));
    const high = Math.min(100, Math.round(data.score.overall * 1.1));
    return `${low}-${high}%`;
  }, [data]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="kicker">Claim Intelligence</p>
        <h1 className="text-3xl font-display mt-2">Readiness Engine Dashboard</h1>
        <p className="text-sm text-muted mt-2">{status}</p>
        <p className="text-xs text-muted mt-1">User Scope: {userId || "initializing"}</p>
      </Card>

      <section className="grid md:grid-cols-5 gap-4">
        <Card className="p-4"><p className="text-xs text-muted">Overall Readiness</p><p className="text-2xl font-display mt-2">{data?.score.overall ?? "--"}</p><Badge tone="ai" className="mt-2">AI + Rules</Badge></Card>
        <Card className="p-4"><p className="text-xs text-muted">Evidence Completeness</p><p className="text-2xl font-display mt-2">{data?.score.evidenceCompleteness ?? "--"}%</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Diagnosis Coverage</p><p className="text-2xl font-display mt-2">{data?.score.diagnosisCoverage ?? "--"}%</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Service Connection</p><p className="text-2xl font-display mt-2">{data?.score.serviceConnectionStrength ?? "--"}%</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Projected Rating</p><p className="text-2xl font-display mt-2">{ratingRange}</p></Card>
      </section>

      <Card className="p-6">
        <h2 className="font-display text-xl">Process CTQ Inputs</h2>
        <div className="grid md:grid-cols-5 gap-3 mt-4">
          <div className="rounded-xl border border-border bg-panel2/60 p-3"><p className="text-xs text-muted">Check-ins</p><p className="text-xl font-semibold mt-1">{data?.snapshot.counts.checkIns ?? 0}</p></div>
          <div className="rounded-xl border border-border bg-panel2/60 p-3"><p className="text-xs text-muted">Symptom Entries</p><p className="text-xl font-semibold mt-1">{data?.snapshot.counts.symptomEntries ?? 0}</p></div>
          <div className="rounded-xl border border-border bg-panel2/60 p-3"><p className="text-xs text-muted">Logged Events</p><p className="text-xl font-semibold mt-1">{data?.snapshot.counts.events ?? 0}</p></div>
          <div className="rounded-xl border border-border bg-panel2/60 p-3"><p className="text-xs text-muted">Timeline Entries</p><p className="text-xl font-semibold mt-1">{data?.snapshot.counts.timelineEntries ?? 0}</p></div>
          <div className="rounded-xl border border-border bg-panel2/60 p-3"><p className="text-xs text-muted">Documents</p><p className="text-xl font-semibold mt-1">{data?.snapshot.counts.documents ?? 0}</p></div>
        </div>
      </Card>
    </div>
  );
}
