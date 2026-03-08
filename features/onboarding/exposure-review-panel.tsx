"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrCreateClientUserId } from "@/lib/client-user";

type Condition = { label: string; category: string; confidence: number; evidenceSignals: string[] };

export function ExposureReviewPanel() {
  const [conditions, setConditions] = useState<Condition[]>([]);

  useEffect(() => {
    const userId = getOrCreateClientUserId();
    void load(userId);
  }, []);

  async function load(userId: string) {
    const res = await fetch(`/api/intelligence/conditions?userId=${encodeURIComponent(userId)}`);
    const payload = (await res.json()) as { conditions: Condition[] };
    setConditions(payload.conditions);
  }

  const exposureInferences = useMemo(() => {
    const items: string[] = [];
    if (conditions.some((c) => c.label.includes("Tinnitus"))) items.push("Repeated noise or blast exposure likely contributes to hearing symptoms.");
    if (conditions.some((c) => c.label.includes("Lumbar"))) items.push("Repetitive load-bearing / impact strain likely contributes to musculoskeletal symptoms.");
    if (conditions.some((c) => c.label.includes("Stress"))) items.push("Operational stressor exposure pattern detected from check-ins and events.");
    if (items.length === 0) items.push("Continue timeline and symptom capture to improve exposure inference quality.");
    return items;
  }, [conditions]);

  return (
    <div className="space-y-6">
      <Card className="p-6"><h1 className="text-3xl font-display">Exposure Mapping Review</h1></Card>
      <Card className="p-6">
        <h2 className="font-display text-xl">AI-Inferred Exposure Summary</h2>
        <ul className="mt-4 space-y-2 text-sm text-muted">
          {exposureInferences.map((item) => (
            <li key={item} className="rounded-lg border border-border bg-panel2/50 px-3 py-2">{item}</li>
          ))}
        </ul>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-xl">Related Conditions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {conditions.map((c) => <Badge key={c.label} tone="ai">{c.label} ({Math.round(c.confidence * 100)}%)</Badge>)}
        </div>
      </Card>
    </div>
  );
}
