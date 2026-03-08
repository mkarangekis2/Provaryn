"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrCreateClientUserId } from "@/lib/client-user";

type UserRow = { id: string; displayName: string; readiness: number; transitionRisk: string; topGaps: string[]; claimStatus: string };

export function CoachDashboardPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);

  useEffect(() => {
    const userId = getOrCreateClientUserId();
    void load(userId);
  }, []);

  async function load(userId: string) {
    const res = await fetch(`/api/coach/dashboard?userId=${encodeURIComponent(userId)}`);
    const payload = (await res.json()) as { users: UserRow[] };
    setUsers(payload.users);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6"><h1 className="text-3xl font-display">Coach Dashboard</h1></Card>
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
