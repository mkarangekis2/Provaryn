"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSessionUser } from "@/lib/auth/use-session-user";

type Security = {
  mfaEnabled: boolean;
  loginAlertsEnabled: boolean;
  trustedDeviceCount: number;
  recentEvents: Array<{ id: string; label: string; at: string }>;
};

type Device = {
  id: string;
  label: string;
  trusted: boolean;
  ipAddress?: string;
  lastSeenAt: string;
  revokedAt?: string;
};

type Session = {
  id: string;
  sessionLabel: string;
  active: boolean;
  ipAddress?: string;
  lastSeenAt: string;
  endedAt?: string;
};

export function SecurityCenterPanel() {
  const { user } = useSessionUser();
  const [state, setState] = useState<Security | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [status, setStatus] = useState("Loading security center...");

  useEffect(() => {
    if (!user?.userId) return;
    void load(user.userId);
  }, [user?.userId]);

  async function load(id: string) {
    setStatus("Loading security center...");
    const res = await fetch(`/api/settings/security?userId=${encodeURIComponent(id)}`);
    const payload = (await res.json()) as { ok: boolean; security: Security; devices: Device[]; sessions: Session[]; error?: string };
    if (!res.ok || !payload.ok) {
      setStatus(payload.error ?? "Failed to load security center.");
      return;
    }
    setState(payload.security);
    setDevices(payload.devices ?? []);
    setSessions(payload.sessions ?? []);
    setStatus("Security center ready.");
  }

  async function save() {
    if (!state || !user?.userId) return;
    const res = await fetch("/api/settings/security", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.userId, mfaEnabled: state.mfaEnabled, loginAlertsEnabled: state.loginAlertsEnabled })
    });
    const payload = (await res.json()) as { ok: boolean; security: Security; error?: string };
    if (!res.ok || !payload.ok) {
      setStatus(payload.error ?? "Failed to save security settings.");
      return;
    }
    setState(payload.security ?? state);
    await load(user.userId);
  }

  async function securityAction(action: "revoke_device" | "end_session", targetId: string) {
    if (!user?.userId) return;
    const res = await fetch("/api/settings/security", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.userId, action, targetId })
    });
    const payload = (await res.json()) as { ok: boolean; error?: string };
    if (!res.ok || !payload.ok) {
      setStatus(payload.error ?? "Failed to update security action.");
      return;
    }
    await load(user.userId);
  }

  if (!state) return <Card className="p-6">Loading security center...</Card>;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-display">Security Center</h1>
        <p className="text-sm text-muted mt-2">{status}</p>
        <p className="text-sm text-muted mt-2">Trusted devices: {state.trustedDeviceCount}</p>
      </Card>
      <Card className="p-6 space-y-3">
        <label className="flex items-center justify-between rounded-xl border border-border bg-panel2/50 px-4 py-3"><span>MFA Enabled</span><input type="checkbox" checked={state.mfaEnabled} onChange={(e) => setState({ ...state, mfaEnabled: e.target.checked })} /></label>
        <label className="flex items-center justify-between rounded-xl border border-border bg-panel2/50 px-4 py-3"><span>Login Alerts Enabled</span><input type="checkbox" checked={state.loginAlertsEnabled} onChange={(e) => setState({ ...state, loginAlertsEnabled: e.target.checked })} /></label>
        <Button onClick={save}>Save Security Settings</Button>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-xl">Device History</h2>
        <div className="mt-3 space-y-2 text-sm text-muted">
          {devices.map((device) => (
            <div key={device.id} className="rounded-lg border border-border bg-panel2/50 px-3 py-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{device.label}</p>
                <p className="text-xs">Last seen {new Date(device.lastSeenAt).toLocaleString()} {device.ipAddress ? `• ${device.ipAddress}` : ""}</p>
              </div>
              <Button size="sm" variant="subtle" disabled={!device.trusted} onClick={() => securityAction("revoke_device", device.id)}>
                {device.trusted ? "Revoke" : "Revoked"}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-xl">Active Sessions</h2>
        <div className="mt-3 space-y-2 text-sm text-muted">
          {sessions.map((session) => (
            <div key={session.id} className="rounded-lg border border-border bg-panel2/50 px-3 py-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{session.sessionLabel}</p>
                <p className="text-xs">{session.active ? "Active" : "Ended"} • Last seen {new Date(session.lastSeenAt).toLocaleString()}</p>
              </div>
              <Button size="sm" variant="subtle" disabled={!session.active} onClick={() => securityAction("end_session", session.id)}>
                {session.active ? "End Session" : "Ended"}
              </Button>
            </div>
          ))}
        </div>
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
