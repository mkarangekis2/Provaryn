"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getOrCreateClientUserId } from "@/lib/client-user";

type Task = { id: string; title: string; rationale: string; urgency: number; completed: boolean; relatedConditions: string[] };
type Plan = { tasks: Task[] };

export function TransitionActionPlanPanel() {
  const [userId, setUserId] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [status, setStatus] = useState("Loading transition action plan...");

  useEffect(() => {
    const id = getOrCreateClientUserId();
    setUserId(id);
    void load(id);
  }, []);

  async function load(id: string) {
    const response = await fetch(`/api/transition/plan?userId=${encodeURIComponent(id)}`);
    const payload = (await response.json()) as { plan: Plan | null };
    setPlan(payload.plan);
    setStatus(payload.plan ? "Action plan loaded." : "No transition plan yet. Activate Transition Mode first.");
  }

  async function toggle(task: Task) {
    const response = await fetch("/api/transition/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, taskId: task.id, completed: !task.completed })
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { plan: Plan };
    setPlan(payload.plan);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-display">Transition Action Plan</h1>
        <p className="text-sm text-muted mt-2">{status}</p>
      </Card>

      <div className="space-y-3">
        {(plan?.tasks ?? []).map((task) => (
          <Card key={task.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{task.title}</p>
                <p className="text-sm text-muted mt-1">{task.rationale}</p>
                <p className="text-xs text-muted mt-2">Urgency {task.urgency}/5</p>
              </div>
              <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={task.completed} onChange={() => toggle(task)} /> Done</label>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
