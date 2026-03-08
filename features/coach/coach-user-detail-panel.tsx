"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrCreateClientUserId } from "@/lib/client-user";

type Detail = {
  readiness: { overall: number; evidenceCompleteness: number; diagnosisCoverage: number; serviceConnectionStrength: number; transitionReadiness: number };
  conditionCount: number;
  urgentConditions: Array<{ label: string }>;
  recommendations: string[];
};

export function CoachUserDetailPanel({ subjectUserId }: { subjectUserId: string }) {
  const [data, setData] = useState<Detail | null>(null);

  useEffect(() => {
    const userId = getOrCreateClientUserId();
    void load(userId);
  }, [subjectUserId]);

  async function load(userId: string) {
    const res = await fetch(`/api/coach/user?userId=${encodeURIComponent(userId)}&subjectUserId=${encodeURIComponent(subjectUserId)}`);
    const payload = (await res.json()) as { user: Detail };
    setData(payload.user);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6"><h1 className="text-3xl font-display">Coach User Detail</h1><p className="text-sm text-muted mt-2">User: {subjectUserId}</p></Card>
      <div className="grid md:grid-cols-5 gap-4">
        <Card className="p-4"><p className="text-xs text-muted">Overall</p><p className="text-2xl font-display mt-1">{data?.readiness.overall ?? "--"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Evidence</p><p className="text-2xl font-display mt-1">{data?.readiness.evidenceCompleteness ?? "--"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Diagnosis</p><p className="text-2xl font-display mt-1">{data?.readiness.diagnosisCoverage ?? "--"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Service Connection</p><p className="text-2xl font-display mt-1">{data?.readiness.serviceConnectionStrength ?? "--"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Transition</p><p className="text-2xl font-display mt-1">{data?.readiness.transitionReadiness ?? "--"}</p></Card>
      </div>
      <Card className="p-6">
        <h2 className="font-display text-xl">Urgent Conditions</h2>
        <div className="mt-3 flex flex-wrap gap-2">{(data?.urgentConditions ?? []).map((c) => <Badge key={c.label} tone="risk">{c.label}</Badge>)}</div>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-xl">Coach Recommendations</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">{(data?.recommendations ?? []).map((r) => <li key={r} className="rounded-lg border border-border bg-panel2/50 px-3 py-2">{r}</li>)}</ul>
      </Card>
    </div>
  );
}
