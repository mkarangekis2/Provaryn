"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useSessionUser } from "@/lib/auth/use-session-user";

type TraceabilityPayload = {
  ok: boolean;
  graph: {
    symptoms: Array<{ category: string; count: number }>;
    events: Array<{ type: string; description: string }>;
    documents: Array<{ type: string; filename: string }>;
    conditions: Array<{ id: string; label: string; readiness: number }>;
    strategy: { primaryClaims: string[]; secondaryClaims: string[]; blockers: string[] };
    packages: Array<{ id: string; status: string; title: string; createdAt: string }>;
  };
};

function stageCard(title: string, items: string[]) {
  return (
    <Card className="p-4 min-h-52">
      <p className="kicker">{title}</p>
      <div className="mt-3 space-y-2">
        {items.length ? (
          items.slice(0, 8).map((item) => (
            <div key={item} className="rounded-lg border border-border bg-panel2/60 px-3 py-2 text-xs text-muted">
              {item}
            </div>
          ))
        ) : (
          <p className="text-xs text-muted">No linked records yet.</p>
        )}
      </div>
    </Card>
  );
}

export function TraceabilityGraphPanel() {
  const { user } = useSessionUser();
  const [data, setData] = useState<TraceabilityPayload["graph"] | null>(null);
  const [status, setStatus] = useState("Loading traceability graph...");

  useEffect(() => {
    if (!user?.userId) return;
    void load(user.userId);
  }, [user?.userId]);

  async function load(userId: string) {
    setStatus("Loading traceability graph...");
    const response = await fetch(`/api/claim-traceability/graph?userId=${encodeURIComponent(userId)}`, { cache: "no-store" });
    const payload = (await response.json()) as TraceabilityPayload;
    if (!response.ok || !payload.ok) {
      setStatus("Unable to load traceability graph.");
      return;
    }
    setData(payload.graph);
    setStatus("Traceability graph loaded.");
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="kicker">Evidence-To-Claim Traceability</p>
        <h1 className="text-3xl font-display mt-2">Proof Chain Graph</h1>
        <p className="text-sm text-muted mt-2">{status}</p>
      </Card>

      <div className="grid xl:grid-cols-6 md:grid-cols-3 gap-4">
        {stageCard(
          "1. Symptoms",
          (data?.symptoms ?? []).map((item) => `${item.category} (${item.count})`)
        )}
        {stageCard(
          "2. Events",
          (data?.events ?? []).map((item) => `${item.type}: ${item.description || "Operational/medical incident logged"}`)
        )}
        {stageCard(
          "3. Documents",
          (data?.documents ?? []).map((item) => `${item.type}: ${item.filename}`)
        )}
        {stageCard(
          "4. Conditions",
          (data?.conditions ?? []).map((item) => `${item.label} • readiness ${item.readiness}%`)
        )}
        {stageCard(
          "5. Strategy",
          [
            ...(data?.strategy.primaryClaims ?? []).map((item) => `Primary: ${item}`),
            ...(data?.strategy.secondaryClaims ?? []).map((item) => `Secondary: ${item}`),
            ...(data?.strategy.blockers ?? []).map((item) => `Blocker: ${item}`)
          ]
        )}
        {stageCard(
          "6. Claim Packets",
          (data?.packages ?? []).map((item) => `${item.title} • ${item.status}`)
        )}
      </div>
    </div>
  );
}
