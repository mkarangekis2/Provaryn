"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrCreateClientUserId } from "@/lib/client-user";

type Log = { id: string; action: string; category: "security" | "permissions" | "billing" | "data" | "ai" | "system"; createdAt: string };

export function AuditLogPanel() {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    const userId = getOrCreateClientUserId();
    void load(userId);
  }, []);

  async function load(userId: string) {
    const res = await fetch(`/api/settings/audit-log?userId=${encodeURIComponent(userId)}`);
    const payload = (await res.json()) as { logs: Log[] };
    setLogs(payload.logs);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6"><h1 className="text-3xl font-display">Audit Log</h1></Card>
      <div className="space-y-2">
        {logs.length === 0 ? <Card className="p-5 text-sm text-muted">No sensitive actions recorded yet.</Card> : null}
        {logs.map((log) => (
          <Card key={log.id} className="p-4 flex items-center justify-between">
            <div><p className="font-semibold text-sm">{log.action}</p><p className="text-xs text-muted mt-1">{new Date(log.createdAt).toLocaleString()}</p></div>
            <Badge>{log.category}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
