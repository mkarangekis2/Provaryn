"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrCreateClientUserId } from "@/lib/client-user";

type Defect = {
  defectType: string;
  description: string;
  impact: "low" | "medium" | "high";
  route: string;
  estimatedDaysToFix: number;
  frequency: number;
  weightedImpact?: number;
};

type Dashboard = {
  summary: { totalDefects: number; highImpact: number; avgDaysToFix: number };
  defects: Defect[];
  pareto: Defect[];
};

export function DefectDashboardPanel() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [status, setStatus] = useState("Loading defect dashboard...");

  useEffect(() => {
    const userId = getOrCreateClientUserId();
    void load(userId);
  }, []);

  async function load(userId: string) {
    const response = await fetch(`/api/defects/dashboard?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) {
      setStatus("Unable to load defects.");
      return;
    }
    const payload = (await response.json()) as { summary: Dashboard["summary"]; defects: Defect[]; pareto: Defect[] };
    setData({ summary: payload.summary, defects: payload.defects, pareto: payload.pareto });
    setStatus("Defect dashboard loaded.");
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="kicker">Lean Defect Control</p>
        <h1 className="text-3xl font-display mt-2">Defect Dashboard</h1>
        <p className="text-sm text-muted mt-2">{status}</p>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4"><p className="text-xs text-muted">Total Defects</p><p className="metric-value mt-2">{data?.summary.totalDefects ?? 0}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">High Impact</p><p className="metric-value mt-2">{data?.summary.highImpact ?? 0}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Avg Days To Fix</p><p className="metric-value mt-2">{data?.summary.avgDaysToFix ?? 0}</p></Card>
      </div>

      <Card className="p-6">
        <h2 className="font-display text-xl">Pareto Priority Order</h2>
        <div className="mt-4 space-y-3">
          {(data?.pareto ?? []).map((defect) => (
            <div key={`${defect.defectType}-${defect.description}`} className="rounded-xl border border-border bg-panel2/50 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{defect.description}</p>
                <Badge tone={defect.impact === "high" ? "risk" : defect.impact === "medium" ? "warning" : "success"}>{defect.impact}</Badge>
              </div>
              <p className="text-xs text-muted mt-2">ETA {defect.estimatedDaysToFix} days • weighted impact {defect.weightedImpact ?? defect.frequency}</p>
              <Link href={defect.route} className="mt-3 inline-block rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-panel">
                Fix This Defect
              </Link>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
