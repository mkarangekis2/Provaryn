"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrCreateClientUserId } from "@/lib/client-user";

type Transparency = {
  model: string;
  confidenceInputs: { conditionsDetected: number; symptomSignals: number; evidenceSignals: number; eventSignals: number };
  recommendationBasis: Array<{ condition: string; confidence: number; evidenceSignals: string[]; missingPieces: string[] }>;
  limitations: string[];
};

export function AITransparencyPanel() {
  const [data, setData] = useState<Transparency | null>(null);

  useEffect(() => {
    const userId = getOrCreateClientUserId();
    void load(userId);
  }, []);

  async function load(userId: string) {
    const res = await fetch(`/api/settings/ai-transparency?userId=${encodeURIComponent(userId)}`);
    const payload = (await res.json()) as { transparency: Transparency };
    setData(payload.transparency);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6"><h1 className="text-3xl font-display">AI Transparency Center</h1><p className="text-sm text-muted mt-2">Model: {data?.model ?? "loading"}</p></Card>
      <Card className="p-6 grid md:grid-cols-4 gap-3 text-sm">
        <div className="rounded-lg border border-border bg-panel2/50 p-3">Conditions: {data?.confidenceInputs.conditionsDetected ?? 0}</div>
        <div className="rounded-lg border border-border bg-panel2/50 p-3">Symptoms: {data?.confidenceInputs.symptomSignals ?? 0}</div>
        <div className="rounded-lg border border-border bg-panel2/50 p-3">Evidence: {data?.confidenceInputs.evidenceSignals ?? 0}</div>
        <div className="rounded-lg border border-border bg-panel2/50 p-3">Events: {data?.confidenceInputs.eventSignals ?? 0}</div>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-xl">Recommendation Basis</h2>
        <div className="mt-3 space-y-3">
          {(data?.recommendationBasis ?? []).map((row) => (
            <div key={row.condition} className="rounded-xl border border-border bg-panel2/50 p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{row.condition}</p>
                <Badge tone={row.confidence >= 0.75 ? "success" : row.confidence >= 0.5 ? "warning" : "risk"}>{Math.round(row.confidence * 100)}%</Badge>
              </div>
              <p className="text-xs text-muted mt-2">Signals: {row.evidenceSignals.join("; ") || "none"}</p>
              <p className="text-xs text-muted mt-1">Missing: {row.missingPieces.join("; ") || "none"}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-xl">Limitations & Boundaries</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">{(data?.limitations ?? []).map((item) => <li key={item} className="rounded-lg border border-border bg-panel2/50 px-3 py-2">{item}</li>)}</ul>
      </Card>
    </div>
  );
}
