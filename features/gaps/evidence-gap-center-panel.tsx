"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrCreateClientUserId } from "@/lib/client-user";

type Gap = { condition: string; description: string; impact: "low" | "medium" | "high"; urgency: number };

export function EvidenceGapCenterPanel() {
  const [gaps, setGaps] = useState<Gap[]>([]);

  useEffect(() => {
    const userId = getOrCreateClientUserId();
    void load(userId);
  }, []);

  async function load(userId: string) {
    const res = await fetch(`/api/intelligence/evidence-gaps?userId=${encodeURIComponent(userId)}`);
    const payload = (await res.json()) as { gaps: Gap[] };
    setGaps(payload.gaps);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6"><h1 className="text-3xl font-display">Evidence Gap Center</h1></Card>
      <div className="space-y-3">
        {gaps.length === 0 ? <Card className="p-5 text-sm text-muted">No current gaps detected.</Card> : null}
        {gaps.map((gap, i) => (
          <Card key={`${gap.condition}-${i}`} className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{gap.condition}</p>
                <p className="text-sm text-muted mt-1">{gap.description}</p>
              </div>
              <Badge tone={gap.impact === "high" ? "risk" : gap.impact === "medium" ? "warning" : "default"}>Urgency {gap.urgency}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
