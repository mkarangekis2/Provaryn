"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrCreateClientUserId } from "@/lib/client-user";
import { trackEvent } from "@/lib/analytics/events";

const categories = ["musculoskeletal", "sleep", "headaches", "hearing", "mood_stress", "breathing", "gi", "skin", "other"];

type Row = {
  category: string;
  severity: number;
  frequency: number;
  impact: string;
  careSought: boolean;
};

export function WeeklyCheckInForm() {
  const [userId, setUserId] = useState("");
  const [rows, setRows] = useState<Row[]>(
    categories.map((category) => ({ category, severity: 0, frequency: 0, impact: "none", careSought: false }))
  );
  const [status, setStatus] = useState("");

  useEffect(() => setUserId(getOrCreateClientUserId()), []);

  const activeCount = useMemo(() => rows.filter((row) => row.severity > 0 || row.frequency > 0).length, [rows]);

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function save() {
    setStatus("Saving check-in...");
    const payload = {
      userId,
      sessionDate: new Date().toISOString().slice(0, 10),
      entries: rows.filter((row) => row.severity > 0 || row.frequency > 0)
    };

    if (payload.entries.length === 0) {
      setStatus("Add at least one symptom entry.");
      return;
    }

    const response = await fetch("/api/intake/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setStatus("Failed to save check-in.");
      return;
    }

    trackEvent("first_checkin_completed", { userId, entryCount: payload.entries.length });
    setStatus("Weekly check-in saved.");
  }

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <h1 className="text-3xl font-display">Weekly Check-In</h1>
        <p className="text-sm text-muted mt-2">Active symptom categories in this check-in: {activeCount}</p>
      </Card>

      <Card className="p-6 space-y-3">
        {rows.map((row, index) => (
          <div key={row.category} className="grid md:grid-cols-6 gap-2 rounded-xl border border-border bg-panel2/40 p-3">
            <p className="text-sm uppercase tracking-wide text-muted md:col-span-1">{row.category.replace("_", " ")}</p>
            <input className="rounded-lg bg-panel2 border border-border px-2 py-1 text-sm" type="number" min={0} max={10} value={row.severity} onChange={(event) => updateRow(index, { severity: Number(event.target.value) })} placeholder="Severity" />
            <input className="rounded-lg bg-panel2 border border-border px-2 py-1 text-sm" type="number" min={0} max={7} value={row.frequency} onChange={(event) => updateRow(index, { frequency: Number(event.target.value) })} placeholder="Freq/week" />
            <input className="rounded-lg bg-panel2 border border-border px-2 py-1 text-sm" value={row.impact} onChange={(event) => updateRow(index, { impact: event.target.value })} placeholder="Impact" />
            <label className="text-xs text-muted flex items-center gap-2"><input type="checkbox" checked={row.careSought} onChange={(event) => updateRow(index, { careSought: event.target.checked })} /> Care sought</label>
          </div>
        ))}

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={save}>Save Weekly Check-In</Button>
          <span className="text-sm text-muted">{status}</span>
        </div>
      </Card>
    </div>
  );
}
