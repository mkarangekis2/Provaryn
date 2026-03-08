"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrCreateClientUserId } from "@/lib/client-user";

type Condition = {
  id: string;
  label: string;
  category: string;
  confidence: number;
  readiness: number;
  serviceConnection: number;
  diagnosisStatus: "confirmed" | "suspected" | "missing";
  evidenceSignals: string[];
  urgency: "low" | "medium" | "high";
};

export function ConditionsTrackerPanel() {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [status, setStatus] = useState("Loading condition intelligence...");
  const [filter, setFilter] = useState<"all" | "strong" | "missing_diagnosis" | "urgent">("all");

  useEffect(() => {
    const userId = getOrCreateClientUserId();
    void load(userId);
  }, []);

  async function load(userId: string) {
    const response = await fetch(`/api/intelligence/conditions?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) {
      setStatus("Unable to load condition intelligence.");
      return;
    }
    const payload = (await response.json()) as { conditions: Condition[] };
    setConditions(payload.conditions);
    setStatus("Condition intelligence updated.");
  }

  const filtered = useMemo(() => {
    if (filter === "all") return conditions;
    if (filter === "strong") return conditions.filter((condition) => condition.readiness >= 70);
    if (filter === "missing_diagnosis") return conditions.filter((condition) => condition.diagnosisStatus === "missing");
    return conditions.filter((condition) => condition.urgency === "high");
  }, [conditions, filter]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="kicker">Condition Intelligence</p>
        <h1 className="text-3xl font-display mt-2">Conditions Tracker</h1>
        <p className="text-sm text-muted mt-2">{status}</p>
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap gap-2">
          <button className={`rounded-lg px-3 py-1.5 text-sm border ${filter === "all" ? "bg-accent text-black border-accent" : "border-border"}`} onClick={() => setFilter("all")}>All</button>
          <button className={`rounded-lg px-3 py-1.5 text-sm border ${filter === "strong" ? "bg-accent text-black border-accent" : "border-border"}`} onClick={() => setFilter("strong")}>Strongest</button>
          <button className={`rounded-lg px-3 py-1.5 text-sm border ${filter === "missing_diagnosis" ? "bg-accent text-black border-accent" : "border-border"}`} onClick={() => setFilter("missing_diagnosis")}>Missing Diagnosis</button>
          <button className={`rounded-lg px-3 py-1.5 text-sm border ${filter === "urgent" ? "bg-accent text-black border-accent" : "border-border"}`} onClick={() => setFilter("urgent")}>Urgent</button>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? <Card className="p-6"><p className="text-sm text-muted">No conditions detected yet. Complete check-ins, event logs, and document extraction to populate this tracker.</p></Card> : null}
        {filtered.map((condition) => (
          <Card key={condition.id} className="p-5">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg">{condition.label}</p>
              <Badge tone={condition.urgency === "high" ? "risk" : condition.urgency === "medium" ? "warning" : "success"}>{condition.urgency}</Badge>
            </div>
            <p className="text-xs text-muted mt-1 uppercase">{condition.category.replace("_", " ")}</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Readiness</span><span>{condition.readiness}</span></div>
              <div className="flex justify-between"><span className="text-muted">Confidence</span><span>{Math.round(condition.confidence * 100)}%</span></div>
              <div className="flex justify-between"><span className="text-muted">Service Connection</span><span>{condition.serviceConnection}%</span></div>
              <div className="flex justify-between"><span className="text-muted">Diagnosis</span><span>{condition.diagnosisStatus}</span></div>
            </div>
            <Link href={`/conditions/${condition.id}`} className="mt-4 inline-block rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-panel2">Open Detail</Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
