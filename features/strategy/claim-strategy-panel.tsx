"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrCreateClientUserId } from "@/lib/client-user";

type Strategy = {
  primaryClaims: string[];
  secondaryClaims: string[];
  blockers: string[];
  fileNowRecommendation: boolean;
  rationale: string;
  confidence: number;
};

export function ClaimStrategyPanel() {
  const [strategy, setStrategy] = useState<Strategy | null>(null);

  useEffect(() => {
    const userId = getOrCreateClientUserId();
    void load(userId);
  }, []);

  async function load(userId: string) {
    const res = await fetch(`/api/intelligence/strategy?userId=${encodeURIComponent(userId)}`);
    const payload = (await res.json()) as { strategy: Strategy };
    setStrategy(payload.strategy);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-display">Claim Strategy</h1>
        {strategy ? <Badge className="mt-3" tone={strategy.fileNowRecommendation ? "success" : "warning"}>{strategy.fileNowRecommendation ? "File Now Candidate" : "Strengthen First"}</Badge> : null}
        <p className="text-sm text-muted mt-3">{strategy?.rationale ?? "Loading strategy..."}</p>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h2 className="font-display text-xl">Recommended Primary Claims</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">{(strategy?.primaryClaims ?? []).map((c) => <li key={c} className="rounded-lg border border-border bg-panel2/50 px-3 py-2">{c}</li>)}</ul>
        </Card>
        <Card className="p-6">
          <h2 className="font-display text-xl">Recommended Secondary Claims</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">{(strategy?.secondaryClaims ?? []).map((c) => <li key={c} className="rounded-lg border border-border bg-panel2/50 px-3 py-2">{c}</li>)}</ul>
        </Card>
      </div>
      <Card className="p-6">
        <h2 className="font-display text-xl">Current Blockers</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">{(strategy?.blockers ?? []).map((b) => <li key={b} className="rounded-lg border border-border bg-panel2/50 px-3 py-2">{b}</li>)}</ul>
      </Card>
    </div>
  );
}
