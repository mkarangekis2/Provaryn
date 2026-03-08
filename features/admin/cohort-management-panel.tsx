"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSessionUser } from "@/lib/auth/use-session-user";

type Cohort = {
  participantCount: number;
  avgReadiness: number;
  atRiskCount: number;
  transitionsSoon: number;
  readinessDistribution: { low: number; medium: number; high: number };
  usersNeedingIntervention: Array<{ userId: string; readiness: number; transitionReadiness: number; topCondition: string }>;
  completionMetrics: { onboardingCompletion: number; checkInCadence: number; evidenceCoverage: number };
};

type Invite = {
  id: string;
  inviteeEmail: string;
  role: "user" | "coach" | "program_admin" | "system_admin";
  status: string;
  createdAt: string;
};

export function CohortManagementPanel() {
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"user" | "coach" | "program_admin">("user");
  const [status, setStatus] = useState("Loading cohort management data...");
  const { user } = useSessionUser();

  useEffect(() => {
    if (!user?.userId) return;
    void load(user.userId);
  }, [user?.userId]);

  async function load(userId: string) {
    setStatus("Loading cohort management data...");
    const [cohortRes, inviteRes] = await Promise.all([
      fetch(`/api/admin/cohort?userId=${encodeURIComponent(userId)}`),
      fetch(`/api/admin/invites?userId=${encodeURIComponent(userId)}`)
    ]);
    const cohortPayload = (await cohortRes.json()) as { ok: boolean; cohort?: Cohort; error?: string };
    const invitePayload = (await inviteRes.json()) as { ok: boolean; invites?: Invite[] };
    if (!cohortRes.ok || !cohortPayload.ok || !cohortPayload.cohort) {
      setStatus(cohortPayload.error ?? "Unable to load cohort management data.");
      return;
    }
    setCohort(cohortPayload.cohort);
    setInvites(invitePayload.invites ?? []);
    setStatus("Cohort management data ready.");
  }

  async function sendInvite() {
    if (!user?.userId || !inviteEmail.trim()) return;
    setStatus("Sending organization invite...");
    const res = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.userId, email: inviteEmail.trim(), role: inviteRole })
    });
    const payload = (await res.json()) as { ok: boolean; error?: string; deliveryError?: string | null };
    if (!res.ok || !payload.ok) {
      setStatus(payload.error ?? "Failed to send invite.");
      return;
    }
    if (payload.deliveryError) {
      setStatus(`Invite record created, but email delivery returned: ${payload.deliveryError}`);
    } else {
      setStatus("Invite sent.");
    }
    setInviteEmail("");
    await load(user.userId);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-display">Program & Cohort Management</h1>
        <p className="text-sm text-muted mt-3">{status}</p>
      </Card>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-muted">Participants</p><p className="text-2xl font-display mt-1">{cohort?.participantCount ?? "--"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Average Readiness</p><p className="text-2xl font-display mt-1">{cohort?.avgReadiness ?? "--"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">At Risk</p><p className="text-2xl font-display mt-1">{cohort?.atRiskCount ?? "--"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Transitions Soon</p><p className="text-2xl font-display mt-1">{cohort?.transitionsSoon ?? "--"}</p></Card>
      </div>

      <Card className="p-6">
        <h2 className="font-display text-xl">Operational Controls</h2>
        <ul className="mt-4 space-y-2 text-sm text-muted">
          <li className="rounded-lg border border-border bg-panel2/50 px-3 py-2">Invite workflow: `/invite` route is active and supports code-based onboarding handoff.</li>
          <li className="rounded-lg border border-border bg-panel2/50 px-3 py-2">Cohort segmentation: organization membership and role tables are active for scoped analytics.</li>
          <li className="rounded-lg border border-border bg-panel2/50 px-3 py-2">Program metrics: readiness, risk, and transition outputs are aggregated across authorized cohort users.</li>
        </ul>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-xl">Organization Invites</h2>
        <div className="mt-4 grid md:grid-cols-4 gap-2">
          <input
            className="rounded-xl border border-border bg-panel2/50 px-3 py-2 text-sm md:col-span-2"
            placeholder="Invitee email"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
          />
          <select
            className="rounded-xl border border-border bg-panel2/50 px-3 py-2 text-sm"
            value={inviteRole}
            onChange={(event) => setInviteRole(event.target.value as "user" | "coach" | "program_admin")}
          >
            <option value="user">User</option>
            <option value="coach">Coach</option>
            <option value="program_admin">Program Admin</option>
          </select>
          <Button onClick={sendInvite}>Send Invite</Button>
        </div>
        <div className="mt-4 space-y-2 text-sm text-muted">
          {invites.map((invite) => (
            <div key={invite.id} className="rounded-lg border border-border bg-panel2/50 px-3 py-2">
              {invite.inviteeEmail} • {invite.role} • {invite.status} • {new Date(invite.createdAt).toLocaleString()}
            </div>
          ))}
          {invites.length === 0 ? <p>No invites sent yet.</p> : null}
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-xl">Readiness Distribution</h2>
        <div className="grid md:grid-cols-3 gap-3 mt-4 text-sm">
          <div className="rounded-lg border border-border bg-panel2/50 p-3">Low (&lt;60): {cohort?.readinessDistribution.low ?? 0}</div>
          <div className="rounded-lg border border-border bg-panel2/50 p-3">Medium (60-79): {cohort?.readinessDistribution.medium ?? 0}</div>
          <div className="rounded-lg border border-border bg-panel2/50 p-3">High (80+): {cohort?.readinessDistribution.high ?? 0}</div>
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-xl">Intervention Queue</h2>
        <div className="mt-4 space-y-2 text-sm text-muted">
          {(cohort?.usersNeedingIntervention ?? []).map((row) => (
            <div key={row.userId} className="rounded-lg border border-border bg-panel2/50 px-3 py-2">
              {row.userId.slice(0, 8)} • readiness {row.readiness} • transition {row.transitionReadiness} • {row.topCondition}
            </div>
          ))}
          {(cohort?.usersNeedingIntervention.length ?? 0) === 0 ? <p>No intervention queue items currently.</p> : null}
        </div>
      </Card>
    </div>
  );
}
