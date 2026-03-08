"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSessionUser } from "@/lib/auth/use-session-user";

type Transparency = {
  model: string;
  confidenceInputs: { conditionsDetected: number; symptomSignals: number; evidenceSignals: number; eventSignals: number };
  recommendationBasis: Array<{ condition: string; confidence: number; evidenceSignals: string[]; missingPieces: string[]; rationale: string }>;
  aiTrace: Array<{ id: string; runType: string; promptVersion: string; model: string; confidence: number; createdAt: string; keys: string[] }>;
  aiAuditActions: Array<{ id: string; action: string; createdAt: string }>;
  reviewQueue: Array<{
    id: string;
    recommendationType: string;
    status: "pending_review" | "confirmed" | "rejected";
    requiresConfirmation: boolean;
    confidence: number;
    deterministicScore: number;
    createdAt: string;
    resolvedAt?: string;
  }>;
  limitations: string[];
};

export function AITransparencyPanel() {
  const [data, setData] = useState<Transparency | null>(null);
  const [status, setStatus] = useState("Loading AI transparency data...");
  const { user } = useSessionUser();

  useEffect(() => {
    if (!user?.userId) return;
    void load(user.userId);
  }, [user?.userId]);

  async function load(userId: string) {
    setStatus("Loading AI transparency data...");
    const res = await fetch(`/api/settings/ai-transparency?userId=${encodeURIComponent(userId)}`);
    const payload = (await res.json()) as { ok: boolean; transparency: Transparency; error?: string };
    if (!res.ok || !payload.ok) {
      setStatus(payload.error ?? "Unable to load AI transparency data.");
      return;
    }
    setData(payload.transparency);
    setStatus("AI transparency data ready.");
  }

  async function resolveRecommendation(recommendationId: string, status: "confirmed" | "rejected") {
    if (!user?.userId) return;
    const res = await fetch("/api/ai/recommendations/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.userId, recommendationId, status })
    });
    if (!res.ok) {
      setStatus("Failed to update recommendation review status.");
      return;
    }
    await load(user.userId);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6"><h1 className="text-3xl font-display">AI Transparency Center</h1><p className="text-sm text-muted mt-2">Model: {data?.model ?? "loading"} • {status}</p></Card>
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
              <p className="text-xs text-muted mt-2">Why flagged: {row.rationale}</p>
              <p className="text-xs text-muted mt-2">Signals: {row.evidenceSignals.join("; ") || "none"}</p>
              <p className="text-xs text-muted mt-1">Missing: {row.missingPieces.join("; ") || "none"}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-xl">AI Run Trace</h2>
        <div className="mt-3 space-y-3">
          {(data?.aiTrace ?? []).map((trace) => (
            <div key={trace.id} className="rounded-xl border border-border bg-panel2/50 p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{trace.runType}</p>
                <Badge tone={trace.confidence >= 0.75 ? "success" : trace.confidence >= 0.5 ? "warning" : "risk"}>{Math.round(trace.confidence * 100)}%</Badge>
              </div>
              <p className="text-xs text-muted mt-1">{trace.model} • prompt {trace.promptVersion}</p>
              <p className="text-xs text-muted mt-1">Output keys: {trace.keys.join(", ") || "none"}</p>
              <p className="text-xs text-muted mt-1">{new Date(trace.createdAt).toLocaleString()}</p>
            </div>
          ))}
          {(data?.aiTrace.length ?? 0) === 0 ? <p className="text-sm text-muted">No AI traces available yet.</p> : null}
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-xl">AI Audit Actions</h2>
        <div className="mt-3 space-y-2 text-sm text-muted">
          {(data?.aiAuditActions ?? []).map((row) => (
            <div key={row.id} className="rounded-lg border border-border bg-panel2/50 px-3 py-2">
              {row.action} • {new Date(row.createdAt).toLocaleString()}
            </div>
          ))}
          {(data?.aiAuditActions.length ?? 0) === 0 ? <p>No AI audit actions recorded yet.</p> : null}
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-xl">Human Confirmation Queue</h2>
        <p className="text-xs text-muted mt-2">
          Recommendations below confidence threshold stay pending until explicitly confirmed.
        </p>
        <div className="mt-3 space-y-3">
          {(data?.reviewQueue ?? []).map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-panel2/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{item.recommendationType.replace(/_/g, " ")}</p>
                <Badge tone={item.status === "confirmed" ? "success" : item.status === "rejected" ? "risk" : "warning"}>
                  {item.status}
                </Badge>
              </div>
              <p className="text-xs text-muted mt-2">
                Combined {Math.round(item.confidence * 100)}% • deterministic {Math.round(item.deterministicScore * 100)}%
              </p>
              <p className="text-xs text-muted mt-1">{new Date(item.createdAt).toLocaleString()}</p>
              {item.status === "pending_review" ? (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-500/25"
                    onClick={() => void resolveRecommendation(item.id, "confirmed")}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-rose-500/40 bg-rose-500/15 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-500/25"
                    onClick={() => void resolveRecommendation(item.id, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </div>
          ))}
          {(data?.reviewQueue.length ?? 0) === 0 ? <p className="text-sm text-muted">No recommendations in queue.</p> : null}
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-xl">Limitations & Boundaries</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">{(data?.limitations ?? []).map((item) => <li key={item} className="rounded-lg border border-border bg-panel2/50 px-3 py-2">{item}</li>)}</ul>
      </Card>
    </div>
  );
}
