"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrCreateClientUserId } from "@/lib/client-user";

type Opportunity = { condition: string; type: string; rationale: string; priority: number };

export function AppealsOpportunitiesPanel() {
  const [rows, setRows] = useState<Opportunity[]>([]);

  useEffect(() => {
    const userId = getOrCreateClientUserId();
    void load(userId);
  }, []);

  async function load(userId: string) {
    const res = await fetch(`/api/appeals/opportunities?userId=${encodeURIComponent(userId)}`);
    const payload = (await res.json()) as { opportunities: Opportunity[] };
    setRows(payload.opportunities);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6"><h1 className="text-3xl font-display">Appeals & Increase Opportunities</h1></Card>
      {rows.map((row, i) => (
        <Card key={`${row.condition}-${i}`} className="p-5">
          <div className="flex items-center justify-between">
            <div><p className="font-semibold">{row.condition}</p><p className="text-sm text-muted mt-1">{row.rationale}</p></div>
            <Badge tone={row.priority >= 5 ? "risk" : row.priority >= 3 ? "warning" : "default"}>Priority {row.priority}</Badge>
          </div>
          <p className="text-xs text-muted mt-2 uppercase">{row.type}</p>
        </Card>
      ))}
    </div>
  );
}
