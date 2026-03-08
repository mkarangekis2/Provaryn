"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSessionUser } from "@/lib/auth/use-session-user";

type ClaimPackage = {
  selectedConditions: Array<{ conditionId: string; included: boolean }>;
  forms: {
    profileReviewed: boolean;
    serviceHistoryReviewed: boolean;
    evidenceMappingReviewed: boolean;
    narrativeReviewed: boolean;
  };
};

type ExportJob = {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  outputFormat: "json" | "pdf" | "packet";
  createdAt: string;
  completedAt?: string;
  artifact: Record<string, unknown>;
};

export function FormsAssemblyPanel() {
  const { user } = useSessionUser();
  const [claimPackage, setClaimPackage] = useState<ClaimPackage | null>(null);
  const [readiness, setReadiness] = useState<number | null>(null);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [status, setStatus] = useState("Loading claim assembly workspace...");

  useEffect(() => {
    if (!user?.userId) return;
    void load(user.userId);
  }, [user?.userId]);

  async function load(id: string) {
    setStatus("Loading claim assembly workspace...");
    const [pkgRes, readinessRes, exportsRes] = await Promise.all([
      fetch(`/api/claim-builder/package?userId=${encodeURIComponent(id)}`),
      fetch(`/api/claim-builder/readiness?userId=${encodeURIComponent(id)}`),
      fetch(`/api/claim-builder/export?userId=${encodeURIComponent(id)}`)
    ]);
    const pkgPayload = (await pkgRes.json()) as { ok: boolean; claimPackage: ClaimPackage | null };
    const readinessPayload = (await readinessRes.json()) as { ok: boolean; readiness: number | null; blockers: string[] };
    const exportsPayload = (await exportsRes.json()) as { ok: boolean; jobs: ExportJob[] };

    setClaimPackage(pkgPayload.claimPackage);
    setReadiness(readinessPayload.readiness);
    setBlockers(readinessPayload.blockers ?? []);
    setExportJobs(exportsPayload.jobs ?? []);
    setStatus("Assembly workspace ready.");
  }

  async function toggle(key: keyof ClaimPackage["forms"]) {
    if (!claimPackage || !user?.userId) return;
    const nextForms = { ...claimPackage.forms, [key]: !claimPackage.forms[key] };
    const res = await fetch("/api/claim-builder/package", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.userId, selectedConditions: claimPackage.selectedConditions, forms: nextForms })
    });
    const payload = (await res.json()) as { claimPackage: ClaimPackage };
    setClaimPackage(payload.claimPackage);
    await load(user.userId);
  }

  async function generateExport(format: "packet" | "json" = "packet") {
    if (!user?.userId) return;
    setStatus("Generating export artifact...");
    const res = await fetch("/api/claim-builder/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.userId, format })
    });
    const payload = (await res.json()) as { ok: boolean; error?: string };
    if (!res.ok || !payload.ok) {
      setStatus(payload.error ?? "Failed to generate export artifact.");
      return;
    }
    await load(user.userId);
    setStatus("Export artifact generated.");
  }

  const items: Array<{ key: keyof ClaimPackage["forms"]; label: string }> = [
    { key: "profileReviewed", label: "Profile data reviewed" },
    { key: "serviceHistoryReviewed", label: "Service history reviewed" },
    { key: "evidenceMappingReviewed", label: "Evidence mapping reviewed" },
    { key: "narrativeReviewed", label: "Narratives reviewed" }
  ];

  return (
    <Card className="p-6">
      <h1 className="text-3xl font-display">Forms & Packet Assembly</h1>
      <p className="mt-2 text-sm text-muted">{status}</p>

      <div className="mt-4 grid md:grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl border border-border bg-panel2/50 p-3">
          <p className="text-xs text-muted">Package Readiness</p>
          <p className="mt-1 text-2xl font-display">{readiness ?? "--"}%</p>
        </div>
        <div className="rounded-xl border border-border bg-panel2/50 p-3">
          <p className="text-xs text-muted">Included Conditions</p>
          <p className="mt-1 text-2xl font-display">{claimPackage?.selectedConditions.filter((c) => c.included).length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-panel2/50 p-3">
          <p className="text-xs text-muted">Exports Generated</p>
          <p className="mt-1 text-2xl font-display">{exportJobs.length}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-panel2/50 p-4">
        <p className="text-sm font-semibold">QA Blockers</p>
        <ul className="mt-2 space-y-1 text-sm text-muted">
          {blockers.length === 0 ? <li>All critical QA checks currently satisfied.</li> : blockers.map((item) => <li key={item}>- {item}</li>)}
        </ul>
      </div>

      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div key={item.key} className="rounded-xl border border-border bg-panel2/50 px-4 py-3 flex items-center justify-between">
            <span className="text-sm">{item.label}</span>
            <Button size="sm" variant={claimPackage?.forms[item.key] ? "subtle" : "primary"} onClick={() => toggle(item.key)}>
              {claimPackage?.forms[item.key] ? "Marked" : "Mark Complete"}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={() => generateExport("packet")}>Generate Claim Packet Export</Button>
        <Button variant="subtle" onClick={() => generateExport("json")}>Generate JSON Snapshot</Button>
      </div>

      <div className="mt-5 space-y-2">
        {exportJobs.slice(0, 5).map((job) => (
          <div key={job.id} className="rounded-xl border border-border bg-panel2/50 px-4 py-3 text-sm">
            <p className="font-semibold">{job.outputFormat.toUpperCase()} export • {job.status}</p>
            <p className="text-xs text-muted mt-1">{new Date(job.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
