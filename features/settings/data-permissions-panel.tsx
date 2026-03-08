"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrCreateClientUserId } from "@/lib/client-user";

type Permissions = {
  shareReadinessWithCoach: boolean;
  shareDocumentsWithCoach: boolean;
  organizationAccessEnabled: boolean;
  exportRequested: boolean;
};

export function DataPermissionsPanel() {
  const [userId, setUserId] = useState("");
  const [state, setState] = useState<Permissions | null>(null);

  useEffect(() => {
    const id = getOrCreateClientUserId();
    setUserId(id);
    void load(id);
  }, []);

  async function load(id: string) {
    const res = await fetch(`/api/settings/permissions?userId=${encodeURIComponent(id)}`);
    const payload = (await res.json()) as { permissions: Permissions };
    setState(payload.permissions);
  }

  async function save(next: Permissions) {
    const res = await fetch("/api/settings/permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...next })
    });
    const payload = (await res.json()) as { permissions: Permissions };
    setState(payload.permissions);
  }

  if (!state) return <Card className="p-6">Loading permissions...</Card>;

  return (
    <Card className="p-6">
      <h1 className="text-3xl font-display">Data Permissions Center</h1>
      <div className="mt-4 space-y-2 text-sm">
        {([
          ["shareReadinessWithCoach", "Share readiness score with coach"],
          ["shareDocumentsWithCoach", "Share documents with coach"],
          ["organizationAccessEnabled", "Enable organization access"],
          ["exportRequested", "Request full data export"]
        ] as const).map(([key, label]) => (
          <div key={key} className="rounded-xl border border-border bg-panel2/50 px-4 py-3 flex items-center justify-between">
            <span>{label}</span>
            <input type="checkbox" checked={state[key]} onChange={(e) => setState({ ...state, [key]: e.target.checked })} />
          </div>
        ))}
      </div>
      <Button className="mt-4" onClick={() => save(state)}>Save Permissions</Button>
    </Card>
  );
}
