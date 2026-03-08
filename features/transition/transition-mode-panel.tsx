"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrCreateClientUserId } from "@/lib/client-user";

type TransitionTask = { id: string; title: string; rationale: string; urgency: number; completed: boolean; relatedConditions: string[] };
type TransitionPlan = { active: boolean; targetDate?: string; triggeredReason: string; tasks: TransitionTask[]; updatedAt: string };

export function TransitionModePanel() {
  const [userId, setUserId] = useState("");
  const [plan, setPlan] = useState<TransitionPlan | null>(null);
  const [targetDate, setTargetDate] = useState("");
  const [triggeredReason, setTriggeredReason] = useState("ETS timeline and readiness threshold");
  const [status, setStatus] = useState("Loading transition plan...");

  useEffect(() => {
    const id = getOrCreateClientUserId();
    setUserId(id);
    void load(id);
  }, []);

  async function load(id: string) {
    const response = await fetch(`/api/transition/plan?userId=${encodeURIComponent(id)}`);
    if (!response.ok) {
      setStatus("Unable to load transition plan.");
      return;
    }
    const payload = (await response.json()) as { plan: TransitionPlan | null };
    setPlan(payload.plan);
    setStatus(payload.plan ? "Transition plan loaded." : "Transition mode not activated yet.");
  }

  async function activate() {
    setStatus("Activating transition mode...");
    const response = await fetch("/api/transition/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, targetDate, triggeredReason })
    });

    if (!response.ok) {
      setStatus("Failed to activate transition mode.");
      return;
    }

    const payload = (await response.json()) as { plan: TransitionPlan };
    setPlan(payload.plan);
    setStatus("Transition mode activated.");
  }

  const completion = useMemo(() => {
    if (!plan || plan.tasks.length === 0) return 0;
    const done = plan.tasks.filter((task) => task.completed).length;
    return Math.round((done / plan.tasks.length) * 100);
  }, [plan]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="kicker">Transition Mode</p>
        <h1 className="text-3xl font-display mt-2">ETS / Retirement Activation</h1>
        <p className="text-sm text-muted mt-2">{status}</p>
      </Card>

      <Card className="p-6 grid md:grid-cols-3 gap-3">
        <input className="rounded-xl bg-panel2 border border-border px-3 py-2" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        <input className="rounded-xl bg-panel2 border border-border px-3 py-2 md:col-span-2" value={triggeredReason} onChange={(e) => setTriggeredReason(e.target.value)} />
        <div className="md:col-span-3 flex items-center gap-3">
          <Button onClick={activate}>Activate Transition Mode</Button>
          <Link href="/transition/action-plan" className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-panel2">Open Action Plan</Link>
          <Link href="/transition/readiness" className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-panel2">Open Readiness Review</Link>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-xl">Preparation Status</h2>
        <p className="metric-value mt-3">{completion}%</p>
        <div className="mt-3 h-3 rounded-full bg-panel2 overflow-hidden"><div className="h-full bg-accent" style={{ width: `${completion}%` }} /></div>
        <p className="text-sm text-muted mt-2">{plan?.tasks.length ?? 0} tasks generated from your current condition intelligence.</p>
      </Card>
    </div>
  );
}
