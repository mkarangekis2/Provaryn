"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrCreateClientUserId } from "@/lib/client-user";

type ClaimPackage = { id: string; selectedConditions: Array<{ conditionId: string; included: boolean }> };
type Condition = { id: string; label: string; evidenceSignals: string[] };
type Narrative = { id: string; conditionId?: string; narrativeType: string; content: string; version: number };

export function NarrativeStudioPanel() {
  const [userId, setUserId] = useState("");
  const [claimPackage, setClaimPackage] = useState<ClaimPackage | null>(null);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [status, setStatus] = useState("Loading narrative studio...");

  useEffect(() => {
    const id = getOrCreateClientUserId();
    setUserId(id);
    void bootstrap(id);
  }, []);

  async function bootstrap(id: string) {
    const packageRes = await fetch(`/api/claim-builder/package?userId=${encodeURIComponent(id)}`);
    const packagePayload = (await packageRes.json()) as { claimPackage: ClaimPackage | null };
    setClaimPackage(packagePayload.claimPackage);

    const condRes = await fetch(`/api/intelligence/conditions?userId=${encodeURIComponent(id)}`);
    const condPayload = (await condRes.json()) as { conditions: Condition[] };
    setConditions(condPayload.conditions);

    if (packagePayload.claimPackage?.id) {
      const narrativesRes = await fetch(`/api/claim-builder/narrative?packageId=${encodeURIComponent(packagePayload.claimPackage.id)}`);
      const narrativesPayload = (await narrativesRes.json()) as { narratives: Narrative[] };
      setNarratives(narrativesPayload.narratives);
    }

    setStatus("Narrative studio ready.");
  }

  const includedConditions = useMemo(() => {
    if (!claimPackage) return [] as Condition[];
    const includedIds = new Set(claimPackage.selectedConditions.filter((item) => item.included).map((item) => item.conditionId));
    return conditions.filter((condition) => includedIds.has(condition.id));
  }, [claimPackage, conditions]);

  async function generate(condition: Condition) {
    if (!claimPackage) return;
    setStatus(`Generating narrative for ${condition.label}...`);
    const response = await fetch("/api/claim-builder/narrative", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        packageId: claimPackage.id,
        conditionId: condition.id,
        conditionLabel: condition.label,
        narrativeType: "condition",
        keySignals: condition.evidenceSignals
      })
    });
    const payload = (await response.json()) as { narrative: Narrative };
    setNarratives((prev) => [payload.narrative, ...prev]);
    setStatus("Narrative generated.");
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-display">Personal Statement Generator</h1>
        <p className="text-sm text-muted mt-2">{status}</p>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <h2 className="font-display text-xl">Generate by Condition</h2>
          <div className="mt-4 space-y-2">
            {includedConditions.map((condition) => (
              <div key={condition.id} className="rounded-xl border border-border bg-panel2/50 px-3 py-2 flex items-center justify-between">
                <span className="text-sm">{condition.label}</span>
                <Button size="sm" onClick={() => generate(condition)}>Generate</Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-xl">Versions</h2>
          <div className="mt-4 space-y-2 max-h-[420px] overflow-auto">
            {narratives.length === 0 ? <p className="text-sm text-muted">No narratives generated yet.</p> : null}
            {narratives.map((narrative) => (
              <div key={narrative.id} className="rounded-xl border border-border bg-panel2/50 p-3">
                <p className="text-xs text-muted">{narrative.narrativeType} • v{narrative.version}</p>
                <pre className="whitespace-pre-wrap text-sm mt-2 text-text/90">{narrative.content}</pre>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
