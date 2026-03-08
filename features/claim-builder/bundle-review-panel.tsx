"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getOrCreateClientUserId } from "@/lib/client-user";

type Condition = { id: string; label: string; evidenceSignals: string[]; readiness: number; diagnosisStatus: string };
type ClaimPackage = { selectedConditions: Array<{ conditionId: string; included: boolean }> };

export function BundleReviewPanel() {
  const [rows, setRows] = useState<Array<{ label: string; readiness: number; diagnosisStatus: string; evidenceCount: number }>>([]);

  useEffect(() => {
    const userId = getOrCreateClientUserId();
    void load(userId);
  }, []);

  async function load(userId: string) {
    const [condRes, pkgRes] = await Promise.all([
      fetch(`/api/intelligence/conditions?userId=${encodeURIComponent(userId)}`),
      fetch(`/api/claim-builder/package?userId=${encodeURIComponent(userId)}`)
    ]);

    const condPayload = (await condRes.json()) as { conditions: Condition[] };
    const pkgPayload = (await pkgRes.json()) as { claimPackage: ClaimPackage | null };
    const included = new Set((pkgPayload.claimPackage?.selectedConditions ?? []).filter((c) => c.included).map((c) => c.conditionId));

    setRows(
      condPayload.conditions
        .filter((condition) => included.has(condition.id))
        .map((condition) => ({
          label: condition.label,
          readiness: condition.readiness,
          diagnosisStatus: condition.diagnosisStatus,
          evidenceCount: condition.evidenceSignals.length
        }))
    );
  }

  return (
    <Card className="p-6">
      <h1 className="text-3xl font-display">Evidence Bundle Review</h1>
      <div className="mt-4 space-y-2">
        {rows.length === 0 ? <p className="text-sm text-muted">No included conditions found in package.</p> : null}
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl border border-border bg-panel2/50 px-4 py-3 grid md:grid-cols-4 gap-2 text-sm">
            <p className="font-semibold">{row.label}</p>
            <p className="text-muted">Readiness {row.readiness}</p>
            <p className="text-muted">Diagnosis {row.diagnosisStatus}</p>
            <p className="text-muted">Signals {row.evidenceCount}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
