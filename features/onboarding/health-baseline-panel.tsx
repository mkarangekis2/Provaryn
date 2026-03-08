"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrCreateClientUserId } from "@/lib/client-user";

const baselineRows = ["musculoskeletal", "sleep", "headaches", "hearing", "mood_stress", "breathing", "gi", "skin"];

export function HealthBaselinePanel() {
  const [rows, setRows] = useState(baselineRows.map((category) => ({ category, severity: 0, frequency: 0 })));
  const [status, setStatus] = useState("");

  async function save() {
    const userId = getOrCreateClientUserId();
    const entries = rows.filter((r) => r.severity > 0 || r.frequency > 0).map((r) => ({ category: r.category, severity: r.severity, frequency: r.frequency, impact: "baseline", careSought: false }));
    if (entries.length === 0) {
      setStatus("Add at least one baseline symptom.");
      return;
    }

    const res = await fetch("/api/intake/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionDate: new Date().toISOString().slice(0, 10), entries })
    });

    setStatus(res.ok ? "Baseline saved." : "Failed to save baseline.");
  }

  return (
    <div className="space-y-6">
      <Card className="p-6"><h1 className="text-3xl font-display">Initial Health Baseline</h1></Card>
      <Card className="p-6 space-y-2">
        {rows.map((row, idx) => (
          <div key={row.category} className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-panel2/50 p-3">
            <p className="text-sm text-muted uppercase">{row.category.replace("_", " ")}</p>
            <input type="number" min={0} max={10} className="rounded-lg bg-panel2 border border-border px-2 py-1 text-sm" value={row.severity} onChange={(e) => setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, severity: Number(e.target.value) } : r)))} placeholder="Severity" />
            <input type="number" min={0} max={7} className="rounded-lg bg-panel2 border border-border px-2 py-1 text-sm" value={row.frequency} onChange={(e) => setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, frequency: Number(e.target.value) } : r)))} placeholder="Frequency" />
          </div>
        ))}
        <div className="flex items-center gap-3 pt-2"><Button onClick={save}>Save Baseline</Button><span className="text-sm text-muted">{status}</span></div>
      </Card>
    </div>
  );
}
