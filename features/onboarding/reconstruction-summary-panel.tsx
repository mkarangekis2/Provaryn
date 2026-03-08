"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOrCreateClientUserId } from "@/lib/client-user";

export function ReconstructionSummaryPanel() {
  const [userId, setUserId] = useState("");
  const [snapshot, setSnapshot] = useState<any>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const id = getOrCreateClientUserId();
    setUserId(id);
    void load(id);
  }, []);

  async function load(id: string) {
    const res = await fetch(`/api/intelligence/snapshot?userId=${encodeURIComponent(id)}`);
    setSnapshot(await res.json());
  }

  const unlockActive = useMemo(() => {
    return snapshot?.snapshot?.counts?.timelineEntries > 0 || snapshot?.snapshot?.counts?.symptomEntries > 0;
  }, [snapshot]);

  async function unlock() {
    setStatus("Unlocking reconstruction report...");
    const res = await fetch("/api/settings/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, eventType: "reconstruction_unlock", active: true })
    });
    setStatus(res.ok ? "Reconstruction unlock recorded." : "Unlock failed.");
  }

  return (
    <div className="space-y-6">
      <Card className="p-6"><h1 className="text-3xl font-display">Career Reconstruction Results</h1></Card>
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-muted">Timeline Entries</p><p className="text-2xl font-display mt-1">{snapshot?.snapshot?.counts?.timelineEntries ?? 0}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Symptom Signals</p><p className="text-2xl font-display mt-1">{snapshot?.snapshot?.counts?.symptomEntries ?? 0}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Events</p><p className="text-2xl font-display mt-1">{snapshot?.snapshot?.counts?.events ?? 0}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Documents</p><p className="text-2xl font-display mt-1">{snapshot?.snapshot?.counts?.documents ?? 0}</p></Card>
      </div>
      <Card className="p-6">
        <h2 className="font-display text-xl">Premium Reconstruction Unlock</h2>
        <p className="text-sm text-muted mt-2">One-time unlock provides enhanced synthesis report and deeper strategy context.</p>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={unlock} disabled={!unlockActive}>Unlock for $2.99</Button>
          <Badge tone={unlockActive ? "success" : "warning"}>{unlockActive ? "Eligible" : "Need more data first"}</Badge>
          <span className="text-sm text-muted">{status}</span>
        </div>
      </Card>
    </div>
  );
}
