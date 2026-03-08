"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getOrCreateClientUserId } from "@/lib/client-user";

type RatingPayload = {
  perCondition: Array<{ label: string; conservative: number; expected: number; best: number }>;
  scenarios: { conservative: number; expected: number; best: number };
  disclaimer: string;
};

export function RatingEstimatorPanel() {
  const [data, setData] = useState<RatingPayload | null>(null);

  useEffect(() => {
    const userId = getOrCreateClientUserId();
    void load(userId);
  }, []);

  async function load(userId: string) {
    const res = await fetch(`/api/intelligence/rating?userId=${encodeURIComponent(userId)}`);
    const payload = (await res.json()) as RatingPayload;
    setData(payload);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-display">Rating Estimator</h1>
        <p className="text-sm text-muted mt-2">{data?.disclaimer ?? "Loading scenario model..."}</p>
      </Card>
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5"><p className="text-xs text-muted">Conservative</p><p className="metric-value mt-2">{data?.scenarios.conservative ?? "--"}%</p></Card>
        <Card className="p-5"><p className="text-xs text-muted">Expected</p><p className="metric-value mt-2">{data?.scenarios.expected ?? "--"}%</p></Card>
        <Card className="p-5"><p className="text-xs text-muted">Best Case</p><p className="metric-value mt-2">{data?.scenarios.best ?? "--"}%</p></Card>
      </div>
      <Card className="p-6">
        <h2 className="font-display text-xl">Per-Condition Scenarios</h2>
        <div className="mt-3 space-y-2 text-sm">
          {(data?.perCondition ?? []).map((c) => (
            <div key={c.label} className="rounded-lg border border-border bg-panel2/50 px-3 py-2 grid md:grid-cols-4 gap-2">
              <span>{c.label}</span><span className="text-muted">Cons {c.conservative}%</span><span className="text-muted">Exp {c.expected}%</span><span className="text-muted">Best {c.best}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
