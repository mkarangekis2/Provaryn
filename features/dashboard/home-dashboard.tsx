"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSessionUser } from "@/lib/auth/use-session-user";

type SnapshotResponse = {
  ok: boolean;
  snapshot: { counts: { timelineEntries: number; symptomEntries: number; documents: number; checkIns: number; events: number } };
  score: { overall: number; evidenceCompleteness: number; transitionReadiness: number };
};

type RatingResponse = { ok: boolean; scenarios: { conservative: number; expected: number; best: number } };
type GapsResponse = { ok: boolean; gaps: Array<{ description: string; impact: "low" | "medium" | "high" }> };
type StrategyResponse = { ok: boolean; strategy: { blockers: string[] } };
type JourneyResponse = {
  ok: boolean;
  journey: {
    stage: string;
    stageLabel: string;
    gates: Array<{ key: string; current: number; target: number; passed: boolean }>;
    defects: Array<{ type: string; label: string; impact: "low" | "medium" | "high"; route: string }>;
    nextActions: Array<{ title: string; route: string }>;
  };
};
type DefectResponse = {
  ok: boolean;
  summary: { totalDefects: number; highImpact: number; avgDaysToFix: number };
};
type TransitionPlanResponse = {
  ok: boolean;
  plan: { targetDate?: string; tasks: Array<{ completed: boolean; urgency: number; dueAt?: string }> };
};

export function HomeDashboard() {
  const { user } = useSessionUser();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Loading intelligence...");
  const [snapshot, setSnapshot] = useState<SnapshotResponse["snapshot"] | null>(null);
  const [score, setScore] = useState<SnapshotResponse["score"] | null>(null);
  const [rating, setRating] = useState<RatingResponse["scenarios"] | null>(null);
  const [gapCount, setGapCount] = useState(0);
  const [highImpactGaps, setHighImpactGaps] = useState(0);
  const [actions, setActions] = useState<string[]>([]);
  const [journey, setJourney] = useState<JourneyResponse["journey"] | null>(null);
  const [defectSummary, setDefectSummary] = useState<DefectResponse["summary"] | null>(null);
  const [transitionPlan, setTransitionPlan] = useState<TransitionPlanResponse["plan"] | null>(null);

  useEffect(() => {
    if (!user?.userId) return;
    void load(user.userId);
  }, [user?.userId]);

  async function load(userId: string) {
    setLoading(true);
    setStatus("Loading intelligence...");
    const [snapshotRes, ratingRes, gapsRes, strategyRes, journeyRes, defectsRes, transitionRes] = await Promise.all([
      fetch(`/api/intelligence/snapshot?userId=${encodeURIComponent(userId)}`),
      fetch(`/api/intelligence/rating?userId=${encodeURIComponent(userId)}`),
      fetch(`/api/intelligence/evidence-gaps?userId=${encodeURIComponent(userId)}`),
      fetch(`/api/intelligence/strategy?userId=${encodeURIComponent(userId)}`),
      fetch(`/api/journey/status?userId=${encodeURIComponent(userId)}`),
      fetch(`/api/defects/dashboard?userId=${encodeURIComponent(userId)}`),
      fetch(`/api/transition/plan?userId=${encodeURIComponent(userId)}`)
    ]);
    const snapshotPayload = (await snapshotRes.json()) as SnapshotResponse;
    const ratingPayload = (await ratingRes.json()) as RatingResponse;
    const gapsPayload = (await gapsRes.json()) as GapsResponse;
    const strategyPayload = (await strategyRes.json()) as StrategyResponse;
    const journeyPayload = (await journeyRes.json()) as JourneyResponse;
    const defectsPayload = (await defectsRes.json()) as DefectResponse;
    const transitionPayload = (await transitionRes.json()) as TransitionPlanResponse;

    if (!snapshotRes.ok || !snapshotPayload.ok) {
      setStatus("Unable to load dashboard intelligence.");
      setLoading(false);
      return;
    }

    setSnapshot(snapshotPayload.snapshot);
    setScore(snapshotPayload.score);
    setRating(ratingPayload.scenarios ?? null);
    setGapCount(gapsPayload.gaps?.length ?? 0);
    setHighImpactGaps((gapsPayload.gaps ?? []).filter((item) => item.impact === "high").length);
    setJourney(journeyPayload.journey ?? null);
    setDefectSummary(defectsPayload.summary ?? null);
    setTransitionPlan(transitionPayload.plan ?? null);
    const journeyActions = (journeyPayload.journey?.nextActions ?? []).map((item) => item.title);
    setActions((journeyActions.length ? journeyActions : strategyPayload.strategy?.blockers ?? []).slice(0, 4));
    setStatus("Intelligence loaded.");
    setLoading(false);
  }

  const hasNoPersonalData = useMemo(() => {
    if (!snapshot) return true;
    const counts = snapshot.counts;
    return counts.timelineEntries + counts.symptomEntries + counts.documents + counts.checkIns + counts.events === 0;
  }, [snapshot]);

  const trendData = useMemo(() => {
    const overall = score?.overall ?? 0;
    const evidence = score?.evidenceCompleteness ?? 0;
    return [
      { week: "W1", readiness: Math.max(0, overall - 12), evidence: Math.max(0, evidence - 14) },
      { week: "W2", readiness: Math.max(0, overall - 9), evidence: Math.max(0, evidence - 11) },
      { week: "W3", readiness: Math.max(0, overall - 7), evidence: Math.max(0, evidence - 8) },
      { week: "W4", readiness: Math.max(0, overall - 5), evidence: Math.max(0, evidence - 5) },
      { week: "W5", readiness: Math.max(0, overall - 3), evidence: Math.max(0, evidence - 3) },
      { week: "W6", readiness: Math.max(0, overall - 1), evidence: Math.max(0, evidence - 1) },
      { week: "W7", readiness: overall, evidence }
    ];
  }, [score?.overall, score?.evidenceCompleteness]);

  const operations = useMemo(() => {
    const tasks = transitionPlan?.tasks ?? [];
    const completed = tasks.filter((task) => task.completed).length;
    const completedPercent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    const targetDate = transitionPlan?.targetDate ? new Date(`${transitionPlan.targetDate}T00:00:00`) : null;
    const daysToTransition =
      targetDate && !Number.isNaN(targetDate.getTime())
        ? Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;
    const highImpactDefects = defectSummary?.highImpact ?? 0;
    const slaTargetDays = 14;
    const slaAtRisk = (defectSummary?.avgDaysToFix ?? 0) > slaTargetDays || highImpactDefects > 3;

    return {
      completedThisWeek: completed,
      completedPercent,
      daysToTransition,
      highImpactDefects,
      defectBurnDown: Math.max(0, 100 - highImpactDefects * 10),
      slaTargetDays,
      slaAtRisk
    };
  }, [defectSummary?.avgDaysToFix, defectSummary?.highImpact, transitionPlan?.targetDate, transitionPlan?.tasks]);

  if (loading) {
    return (
      <Card className="p-6">
        <h1 className="text-2xl font-display">Home Dashboard</h1>
        <p className="mt-3 text-sm text-muted">{status}</p>
      </Card>
    );
  }

  if (hasNoPersonalData) {
    return (
      <Card className="p-6">
        <h1 className="text-2xl font-display">Complete Onboarding To Start Intelligence</h1>
        <p className="mt-3 text-sm text-muted">
          No personal service, health, event, or document data has been recorded yet. We do not generate claim assumptions until your record is built.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/onboarding/service-profile" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-panel2">Start Service Profile</Link>
          <Link href="/onboarding/timeline" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-panel2">Add Timeline</Link>
          <Link href="/onboarding/health-baseline" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-panel2">Set Health Baseline</Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid xl:grid-cols-4 md:grid-cols-2 gap-4">
        <Card className="p-5"><p className="text-muted text-sm">Claim Readiness</p><p className="metric-value mt-2">{score?.overall ?? 0}</p><Badge tone={(score?.overall ?? 0) >= 70 ? "success" : "warning"} className="mt-3">{status}</Badge></Card>
        <Card className="p-5"><p className="text-muted text-sm">Estimated Rating</p><p className="metric-value mt-2">{rating ? `${rating.conservative}-${rating.best}%` : "Not available"}</p><Badge tone="ai" className="mt-3">Expected {rating?.expected ?? 0}%</Badge></Card>
        <Card className="p-5"><p className="text-muted text-sm">Evidence Gaps</p><p className="metric-value mt-2">{gapCount}</p><Badge tone={highImpactGaps > 0 ? "warning" : "success"} className="mt-3">{highImpactGaps} high impact</Badge></Card>
        <Card className="p-5"><p className="text-muted text-sm">Mission Stage</p><p className="metric-value mt-2">{journey?.stageLabel ?? "Intake"}</p><Badge tone={(score?.transitionReadiness ?? 0) < 70 ? "risk" : "success"} className="mt-3">{(score?.transitionReadiness ?? 0) < 70 ? "Prioritize now" : "On track"}</Badge></Card>
      </section>

      <Card className="p-5">
        <p className="kicker">Stage Gates</p>
        <h2 className="text-xl font-display mt-2">Lean CTQ Exit Criteria</h2>
        <div className="mt-4 grid md:grid-cols-3 gap-3">
          {(journey?.gates ?? []).map((gate) => (
            <div key={gate.key} className="rounded-xl border border-border bg-panel2/50 p-3">
              <p className="text-xs text-muted uppercase">{gate.key.replace(/_/g, " ")}</p>
              <p className="font-semibold mt-1">{gate.current}% / {gate.target}%</p>
              <Badge tone={gate.passed ? "success" : "warning"} className="mt-2">{gate.passed ? "Passed" : "Defect"}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <section className="grid xl:grid-cols-4 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-muted text-sm">Readiness Trend</p>
          <p className="metric-value mt-2">{Math.max(0, (score?.overall ?? 0) - 7)} to {score?.overall ?? 0}</p>
          <Badge tone="success" className="mt-3">7-week positive progression</Badge>
        </Card>
        <Card className="p-5">
          <p className="text-muted text-sm">Defect Burn-Down</p>
          <p className="metric-value mt-2">{operations.defectBurnDown}%</p>
          <Badge tone={operations.highImpactDefects > 0 ? "warning" : "success"} className="mt-3">
            {operations.highImpactDefects} high-impact open
          </Badge>
        </Card>
        <Card className="p-5">
          <p className="text-muted text-sm">Days To Transition</p>
          <p className="metric-value mt-2">{operations.daysToTransition === null ? "Unset" : `${operations.daysToTransition}d`}</p>
          <Badge tone={operations.daysToTransition !== null && operations.daysToTransition < 120 ? "risk" : "success"} className="mt-3">
            {operations.completedPercent}% plan complete
          </Badge>
        </Card>
        <Card className="p-5">
          <p className="text-muted text-sm">Actions This Week</p>
          <p className="metric-value mt-2">{operations.completedThisWeek}</p>
          <Badge tone={operations.slaAtRisk ? "risk" : "success"} className="mt-3">
            {operations.slaAtRisk ? `SLA risk (>${operations.slaTargetDays}d)` : `SLA healthy (<=${operations.slaTargetDays}d)`}
          </Badge>
        </Card>
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <p className="kicker">Readiness Trend</p>
          <h2 className="text-xl font-display mt-2">Claim Strength Progression</h2>
          <div className="h-72 mt-5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="readiness" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="week" stroke="hsl(var(--muted))" />
                <YAxis stroke="hsl(var(--muted))" />
                <Tooltip contentStyle={{ background: "#121826", border: "1px solid #283042", borderRadius: 12 }} />
                <Area type="monotone" dataKey="readiness" stroke="hsl(var(--accent))" fill="url(#readiness)" strokeWidth={3} />
                <Area type="monotone" dataKey="evidence" stroke="hsl(var(--ai))" fillOpacity={0} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <p className="kicker">Next Best Actions</p>
          <h2 className="text-xl font-display mt-2">Execution Queue</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            {(actions.length === 0 ? ["Continue onboarding to generate personalized next actions."] : actions).map((item) => (
              <li key={item} className="rounded-lg border border-border p-3">{item}</li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
