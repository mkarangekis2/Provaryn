"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrCreateClientUserId } from "@/lib/client-user";
import { trackEvent } from "@/lib/analytics/events";

type Condition = { id: string; label: string; readiness: number; evidenceSignals: string[] };
type ClaimPackage = { id: string; title: string; selectedConditions: Array<{ conditionId: string; included: boolean }> };

export function ClaimBuilderWorkspacePanel() {
  const [userId, setUserId] = useState("");
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [claimPackage, setClaimPackage] = useState<ClaimPackage | null>(null);
  const [status, setStatus] = useState("Loading claim builder...");

  useEffect(() => {
    const id = getOrCreateClientUserId();
    setUserId(id);
    trackEvent("claim_builder_started", { userId: id });
    void bootstrap(id);
  }, []);

  async function bootstrap(id: string) {
    const conditionsRes = await fetch(`/api/intelligence/conditions?userId=${encodeURIComponent(id)}`);
    const conditionsPayload = (await conditionsRes.json()) as { conditions: Condition[] };
    setConditions(conditionsPayload.conditions);

    const packageRes = await fetch(`/api/claim-builder/package?userId=${encodeURIComponent(id)}`);
    const packagePayload = (await packageRes.json()) as { claimPackage: ClaimPackage | null };

    if (!packagePayload.claimPackage) {
      const createdRes = await fetch("/api/claim-builder/package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: id,
          title: "Primary Claim Package",
          selectedConditions: conditionsPayload.conditions.map((condition) => ({ conditionId: condition.id, included: condition.readiness >= 45 }))
        })
      });
      const createdPayload = (await createdRes.json()) as { claimPackage: ClaimPackage };
      setClaimPackage(createdPayload.claimPackage);
    } else {
      setClaimPackage(packagePayload.claimPackage);
    }

    setStatus("Claim builder workspace ready.");
  }

  const selectedCount = useMemo(() => claimPackage?.selectedConditions.filter((item) => item.included).length ?? 0, [claimPackage]);

  async function toggleCondition(conditionId: string) {
    if (!claimPackage) return;
    const next = claimPackage.selectedConditions.map((item) =>
      item.conditionId === conditionId ? { ...item, included: !item.included } : item
    );

    const response = await fetch("/api/claim-builder/package", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, selectedConditions: next })
    });
    const payload = (await response.json()) as { claimPackage: ClaimPackage };
    setClaimPackage(payload.claimPackage);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-display">Claim Builder Workspace</h1>
        <p className="text-sm text-muted mt-2">{status}</p>
      </Card>

      <Card className="p-6">
        <p className="text-xs text-muted">Selected Conditions</p>
        <p className="metric-value mt-2">{selectedCount}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/claim-builder/statements" className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-panel2">Narratives</Link>
          <Link href="/claim-builder/bundle-review" className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-panel2">Bundle Review</Link>
          <Link href="/claim-builder/forms" className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-panel2">Forms</Link>
          <Link href="/claim-builder/submission" className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-panel2">Submission</Link>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {conditions.map((condition) => {
          const included = claimPackage?.selectedConditions.find((item) => item.conditionId === condition.id)?.included ?? false;
          return (
            <Card key={condition.id} className="p-5">
              <p className="font-semibold">{condition.label}</p>
              <p className="text-xs text-muted mt-1">Readiness {condition.readiness}</p>
              <p className="text-sm text-muted mt-2 line-clamp-2">{condition.evidenceSignals.join("; ")}</p>
              <Button className="mt-3" variant={included ? "subtle" : "primary"} onClick={() => toggleCondition(condition.id)}>
                {included ? "Remove from Package" : "Include in Package"}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
