"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrCreateClientUserId } from "@/lib/client-user";

type QueueTask = {
  id: string;
  title: string;
  rationale: string;
  urgency: number;
  completed: boolean;
  owner?: "member" | "coach";
  dueAt?: string;
  impactScore?: number;
  sourceStage?: "onboarding" | "weekly" | "transition" | "claim_builder";
  taskType?: "evidence" | "medical_eval" | "narrative" | "records";
};

type QueuePayload = {
  completion: number;
  tasks: QueueTask[];
};

export function ActionQueuePanel() {
  const [queue, setQueue] = useState<QueuePayload | null>(null);
  const [status, setStatus] = useState("Loading canonical action queue...");

  useEffect(() => {
    const userId = getOrCreateClientUserId();
    void load(userId);
  }, []);

  async function load(userId: string) {
    const response = await fetch(`/api/action-queue?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) {
      setStatus("Unable to load action queue.");
      return;
    }
    const payload = (await response.json()) as { queue: QueuePayload };
    setQueue(payload.queue);
    setStatus("Action queue loaded.");
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="kicker">Single Source Of Truth</p>
        <h1 className="text-3xl font-display mt-2">Action Queue</h1>
        <p className="text-sm text-muted mt-2">{status}</p>
      </Card>

      <Card className="p-6">
        <p className="text-sm text-muted">Completion</p>
        <p className="metric-value mt-2">{queue?.completion ?? 0}%</p>
        <div className="mt-3 h-2 rounded-full bg-panel2 overflow-hidden">
          <div className="h-full bg-accent" style={{ width: `${queue?.completion ?? 0}%` }} />
        </div>
      </Card>

      <div className="space-y-3">
        {(queue?.tasks ?? []).map((task) => (
          <Card key={task.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{task.title}</p>
                <p className="text-sm text-muted mt-1">{task.rationale}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone={task.urgency >= 5 ? "risk" : task.urgency >= 4 ? "warning" : "success"}>Urgency {task.urgency}/5</Badge>
                  <Badge tone="ai">Impact {task.impactScore ?? 50}</Badge>
                  <Badge tone="default">{task.sourceStage ?? "transition"}</Badge>
                  <Badge tone="default">{task.taskType ?? "evidence"}</Badge>
                </div>
              </div>
              <div className="text-right text-xs text-muted">
                <p>{task.completed ? "Done" : "Open"}</p>
                <p className="mt-1">{task.dueAt ? `Due ${new Date(task.dueAt).toLocaleDateString()}` : "No due date"}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
