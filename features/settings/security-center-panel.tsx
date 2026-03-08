"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrCreateClientUserId } from "@/lib/client-user";

type Security = {
  mfaEnabled: boolean;
  loginAlertsEnabled: boolean;
  trustedDeviceCount: number;
  recentEvents: Array<{ id: string; label: string; at: string }>;
};

export function SecurityCenterPanel() {
  const [userId, setUserId] = useState("");
  const [state, setState] = useState<Security | null>(null);

  useEffect(() => {
    const id = getOrCreateClientUserId();
    setUserId(id);
    void load(id);
  }, []);

  async function load(id: string) {
    const res = await fetch(`/api/settings/security?userId=${encodeURIComponent(id)}`);
    const payload = (await res.json()) as { security: Security };
    setState(payload.security);
  }

  async function save() {
    if (!state) return;
    const res = await fetch("/api/settings/security", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, mfaEnabled: state.mfaEnabled, loginAlertsEnabled: state.loginAlertsEnabled })
    });
    const payload = (await res.json()) as { security: Security };
    setState(payload.security);
  }

  if (!state) return <Card className="p-6">Loading security center...</Card>;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-display">Security Center</h1>
        <p className="text-sm text-muted mt-2">Trusted devices: {state.trustedDeviceCount}</p>
      </Card>
      <Card className="p-6 space-y-3">
        <label className="flex items-center justify-between rounded-xl border border-border bg-panel2/50 px-4 py-3"><span>MFA Enabled</span><input type="checkbox" checked={state.mfaEnabled} onChange={(e) => setState({ ...state, mfaEnabled: e.target.checked })} /></label>
        <label className="flex items-center justify-between rounded-xl border border-border bg-panel2/50 px-4 py-3"><span>Login Alerts Enabled</span><input type="checkbox" checked={state.loginAlertsEnabled} onChange={(e) => setState({ ...state, loginAlertsEnabled: e.target.checked })} /></label>
        <Button onClick={save}>Save Security Settings</Button>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-xl">Recent Security Events</h2>
        <div className="mt-3 space-y-2 text-sm text-muted">
          {state.recentEvents.map((event) => <div key={event.id} className="rounded-lg border border-border bg-panel2/50 px-3 py-2">{event.label} • {new Date(event.at).toLocaleString()}</div>)}
        </div>
      </Card>
    </div>
  );
}
