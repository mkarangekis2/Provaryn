"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrCreateClientUserId } from "@/lib/client-user";
import { usStates } from "@/lib/us-states";

type Match = { title: string; category: string; state: string; eligibilityConfidence: number };

export function BenefitsHubPanel() {
  const [stateCode, setStateCode] = useState("ALL");
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    const userId = getOrCreateClientUserId();
    void load(userId, stateCode);
  }, [stateCode]);

  async function load(userId: string, state: string) {
    const res = await fetch(`/api/benefits/matches?userId=${encodeURIComponent(userId)}&state=${encodeURIComponent(state)}`);
    const payload = (await res.json()) as { matches: Match[] };
    setMatches(payload.matches);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-display">Benefits Discovery Hub</h1>
        <select className="mt-3 rounded-xl bg-panel2 border border-border px-3 py-2" value={stateCode} onChange={(e) => setStateCode(e.target.value)}>
          <option value="ALL">All 50 States</option>
          {usStates.map((state) => (
            <option key={state.code} value={state.code}>{state.name}</option>
          ))}
        </select>
      </Card>
      <div className="space-y-3">
        {matches.map((m) => (
          <Card key={`${m.title}-${m.state}`} className="p-5 flex items-center justify-between">
            <div><p className="font-semibold">{m.title}</p><p className="text-sm text-muted">{m.category} • {m.state}</p></div>
            <Badge tone="success">{Math.round(m.eligibilityConfidence * 100)}% match</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
