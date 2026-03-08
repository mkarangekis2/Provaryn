"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSessionUser } from "@/lib/auth/use-session-user";

type UserRow = { id: string; displayName: string; readiness: number; transitionRisk: string; topGaps: string[]; claimStatus: string };
type Summary = { assignedCount: number; usersAtRisk: number; avgReadiness: number };

export function CoachDashboardPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [status, setStatus] = useState("Loading coach dashboard...");
  const { user } = useSessionUser();

  useEffect(() => {
    if (!user?.userId) return;
    void load(user.userId);
  }, [user?.userId]);

  async function load(userId: string) {
    setStatus("Loading coach dashboard...");
    const res = await fetch(`/api/coach/dashboard?userId=${encodeURIComponent(userId)}`);
    const payload = (await res.json()) as { ok: boolean; users?: UserRow[]; summary?: Summary; error?: string };
    if (!res.ok || !payload.ok || !payload.users) {
      setUsers([]);
      setSummary(null);
      setStatus(payload.error ?? "Unable to load coach dashboard.");
      return;
    }
    setUsers(payload.users);
    setSummary(payload.summary ?? null);
    setStatus("Coach dashboard ready.");
  }

  return (
    <div className="space-y-6">
      <Card className="p-6"><h1 className="text-3xl font-display">Coach Dashboard</h1></Card>
      <p className="text-sm text-muted">{status}</p>
      <div className="grid md:grid-cols-3 gap-3">
        <Card className="p-4"><p className="text-xs text-muted">Assigned Users</p><p className="text-2xl font-display mt-1">{summary?.assignedCount ?? "--"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Users At Risk</p><p className="text-2xl font-display mt-1">{summary?.usersAtRisk ?? "--"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Average Readiness</p><p className="text-2xl font-display mt-1">{summary?.avgReadiness ?? "--"}</p></Card>
      </div>
      {users.map((user) => (
        <Card key={user.id} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{user.displayName}</p>
              <p className="text-sm text-muted">Readiness {user.readiness} • Claim status {user.claimStatus}</p>
            </div>
            <Badge tone={user.transitionRisk === "high" ? "risk" : user.transitionRisk === "medium" ? "warning" : "success"}>{user.transitionRisk} transition risk</Badge>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-muted">{user.topGaps.map((gap) => <li key={gap}>• {gap}</li>)}</ul>
          <Link href={`/coach/${user.id}`} className="inline-block mt-4 rounded-lg border border-border px-3 py-2 text-sm hover:bg-panel2">Open User Detail</Link>
        </Card>
      ))}
    </div>
  );
}
