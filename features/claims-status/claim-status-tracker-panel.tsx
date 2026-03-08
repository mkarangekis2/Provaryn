"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrCreateClientUserId } from "@/lib/client-user";

type Stage = "preparing" | "submitted" | "evidence_gathering" | "review" | "decision" | "appeal";

type Record = { stage: Stage; updatedAt: string; notes?: string };

export function ClaimStatusTrackerPanel() {
  const [userId, setUserId] = useState("");
  const [record, setRecord] = useState<Record | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const id = getOrCreateClientUserId();
    setUserId(id);
    void load(id);
  }, []);

  async function load(id: string) {
    const res = await fetch(`/api/claims/status?userId=${encodeURIComponent(id)}`);
    const payload = (await res.json()) as { record: Record | null };
    setRecord(payload.record);
  }

  async function updateStage(stage: Stage) {
    const res = await fetch("/api/claims/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, stage, notes })
    });
    const payload = (await res.json()) as { record: Record };
    setRecord(payload.record);
  }

  const stages: Stage[] = ["preparing", "submitted", "evidence_gathering", "review", "decision", "appeal"];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-display">Claim Status Tracker</h1>
        <p className="text-sm text-muted mt-2">Current stage: {record?.stage ?? "not set"}</p>
      </Card>
      <Card className="p-6">
        <textarea className="w-full rounded-xl bg-panel2 border border-border px-3 py-2 min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Status notes" />
        <div className="mt-3 flex flex-wrap gap-2">
          {stages.map((stage) => (
            <Button key={stage} size="sm" variant={record?.stage === stage ? "subtle" : "primary"} onClick={() => updateStage(stage)}>{stage}</Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
