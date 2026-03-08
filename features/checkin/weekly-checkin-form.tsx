"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, BrainCircuit, ClipboardCheck, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrCreateClientUserId } from "@/lib/client-user";
import { trackEvent } from "@/lib/analytics/events";

const categories = [
  { key: "musculoskeletal", label: "Musculoskeletal Pain", hint: "Back, neck, shoulder, joint strain" },
  { key: "sleep", label: "Sleep", hint: "Insomnia, unrestful sleep, apnea concerns" },
  { key: "headaches", label: "Headaches / Neurological", hint: "Migraine, concentration or memory impact" },
  { key: "hearing", label: "Hearing / Tinnitus", hint: "Ringing, muffled hearing, noise sensitivity" },
  { key: "mood_stress", label: "Mood / Stress", hint: "Anxiety, low mood, hypervigilance, irritability" },
  { key: "breathing", label: "Breathing / Respiratory", hint: "Shortness of breath, cough, exertion limits" },
  { key: "gi", label: "GI / Digestive", hint: "Reflux, abdominal pain, bowel disruption" },
  { key: "skin", label: "Skin", hint: "Rashes, irritation, recurring skin symptoms" },
  { key: "other", label: "Other", hint: "Any recurring health issue not listed" }
] as const;

type Row = {
  category: string;
  occurrence: "none" | "rare" | "weekly" | "daily";
  severity: number;
  impactLevel: "none" | "mild" | "moderate" | "severe";
  likelyCause: string;
  notes: string;
  careSought: boolean;
};

type Snapshot = {
  score: { overall: number; evidenceCompleteness: number; diagnosisCoverage: number; serviceConnectionStrength: number; transitionReadiness: number };
};

type Condition = { label: string; readiness: number; urgency: "low" | "medium" | "high" };
type Task = { id: string; title: string; rationale: string; urgency: number; completed: boolean; relatedConditions: string[] };
type Plan = { tasks: Task[] };

const tabs = [
  { id: "questionnaire", label: "Questionnaire", icon: Activity },
  { id: "analysis", label: "Signal View", icon: BrainCircuit },
  { id: "tracker", label: "Action Tracker", icon: ClipboardCheck }
] as const;

function mapFrequency(occurrence: Row["occurrence"]) {
  if (occurrence === "daily") return 7;
  if (occurrence === "weekly") return 3;
  if (occurrence === "rare") return 1;
  return 0;
}

export function WeeklyCheckInForm() {
  const [userId, setUserId] = useState("");
  const [rows, setRows] = useState<Row[]>(
    categories.map((category) => ({
      category: category.key,
      occurrence: "none",
      severity: 0,
      impactLevel: "none",
      likelyCause: "",
      notes: "",
      careSought: false
    }))
  );
  const [status, setStatus] = useState("Complete this week's structured health update.");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("questionnaire");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loadingTracker, setLoadingTracker] = useState(false);

  useEffect(() => setUserId(getOrCreateClientUserId()), []);
  useEffect(() => {
    if (!userId) return;
    if (activeTab === "analysis") void loadAnalysis(userId);
    if (activeTab === "tracker") void loadTracker(userId);
  }, [activeTab, userId]);

  const activeCount = useMemo(() => rows.filter((row) => row.occurrence !== "none" && row.severity > 0).length, [rows]);
  const completion = useMemo(() => {
    if (!plan?.tasks?.length) return 0;
    const done = plan.tasks.filter((task) => task.completed).length;
    return Math.round((done / plan.tasks.length) * 100);
  }, [plan]);
  const strongSignals = useMemo(() => conditions.filter((condition) => condition.readiness >= 45).slice(0, 5), [conditions]);

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function loadAnalysis(id: string) {
    const [snapRes, condRes] = await Promise.all([
      fetch(`/api/intelligence/snapshot?userId=${encodeURIComponent(id)}`),
      fetch(`/api/intelligence/conditions?userId=${encodeURIComponent(id)}`)
    ]);

    if (snapRes.ok) setSnapshot(await snapRes.json() as Snapshot);
    if (condRes.ok) {
      const payload = (await condRes.json()) as { conditions: Condition[] };
      setConditions(payload.conditions);
    }
  }

  async function loadTracker(id: string) {
    setLoadingTracker(true);
    try {
      const response = await fetch(`/api/transition/plan?userId=${encodeURIComponent(id)}`);
      if (!response.ok) return;
      const payload = (await response.json()) as { plan: Plan | null };
      setPlan(payload.plan);
    } finally {
      setLoadingTracker(false);
    }
  }

  async function toggleTask(task: Task) {
    if (!userId) return;
    const response = await fetch("/api/transition/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, taskId: task.id, completed: !task.completed })
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { plan: Plan };
    setPlan(payload.plan);
  }

  async function save() {
    setStatus("Saving weekly update...");
    const payload = {
      userId,
      sessionDate: new Date().toISOString().slice(0, 10),
      entries: rows
        .filter((row) => row.occurrence !== "none" && row.severity > 0)
        .map((row) => ({
          category: row.category,
          severity: row.severity,
          frequency: mapFrequency(row.occurrence),
          impact: `${row.impactLevel}${row.likelyCause ? ` | cause: ${row.likelyCause}` : ""}${row.notes ? ` | notes: ${row.notes}` : ""}`,
          careSought: row.careSought
        }))
    };

    if (payload.entries.length === 0) {
      setStatus("Add at least one symptom entry.");
      return;
    }

    const response = await fetch("/api/intake/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setStatus("Failed to save check-in.");
      return;
    }

    trackEvent("first_checkin_completed", { userId, entryCount: payload.entries.length });
    const trackerRefresh = await fetch("/api/transition/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        triggeredReason: "Weekly check-in signal refresh"
      })
    });
    if (trackerRefresh.ok) {
      const trackerPayload = (await trackerRefresh.json()) as { plan?: Plan };
      if (trackerPayload.plan) setPlan(trackerPayload.plan);
    }
    setStatus("Weekly update saved. Review signal view and next actions.");
    setActiveTab("analysis");
    await loadAnalysis(userId);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="kicker">Weekly Update</p>
        <h1 className="text-3xl font-display mt-2">Structured Weekly Check-In</h1>
        <p className="text-sm text-muted mt-2">Active categories this week: {activeCount}</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl border px-4 py-3 text-left transition ${active ? "bg-accent text-black border-accent" : "bg-panel border-border hover:bg-panel2"}`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Icon className="h-4 w-4" />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {activeTab === "questionnaire" ? (
        <Card className="p-6 space-y-3">
          {rows.map((row, index) => (
            <div key={row.category} className="grid md:grid-cols-[190px_120px_100px_120px_1fr_1fr_100px] gap-2 rounded-xl border border-border bg-panel2/50 p-3">
              <div>
                <p className="text-sm font-semibold">{categories[index].label}</p>
                <p className="text-xs text-muted mt-1">{categories[index].hint}</p>
              </div>
              <select className="rounded-xl bg-panel border border-border px-2 py-2 text-sm" value={row.occurrence} onChange={(event) => updateRow(index, { occurrence: event.target.value as Row["occurrence"] })}>
                <option value="none">No issue</option>
                <option value="rare">Rare</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
              </select>
              <input className="rounded-xl bg-panel border border-border px-2 py-2 text-sm" type="number" min={0} max={10} value={row.severity} onChange={(event) => updateRow(index, { severity: Number(event.target.value) })} placeholder="0-10" />
              <select className="rounded-xl bg-panel border border-border px-2 py-2 text-sm" value={row.impactLevel} onChange={(event) => updateRow(index, { impactLevel: event.target.value as Row["impactLevel"] })}>
                <option value="none">No impact</option>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
              <input className="rounded-xl bg-panel border border-border px-2 py-2 text-sm" value={row.likelyCause} onChange={(event) => updateRow(index, { likelyCause: event.target.value })} placeholder="Likely cause / trigger" />
              <input className="rounded-xl bg-panel border border-border px-2 py-2 text-sm" value={row.notes} onChange={(event) => updateRow(index, { notes: event.target.value })} placeholder="Clarification (work/sleep/training impact)" />
              <label className="text-xs text-muted flex items-center gap-2"><input type="checkbox" checked={row.careSought} onChange={(event) => updateRow(index, { careSought: event.target.checked })} /> Care</label>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button onClick={save}>
              <Sparkles className="h-4 w-4 mr-1.5" />
              Save Weekly Update
            </Button>
            <span className="text-sm text-muted">{status}</span>
          </div>
        </Card>
      ) : null}

      {activeTab === "analysis" ? (
        <div className="space-y-4">
          <div className="grid md:grid-cols-5 gap-3">
            <Card className="p-4"><p className="text-xs text-muted">Overall</p><p className="text-2xl font-display mt-1">{snapshot?.score.overall ?? "--"}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted">Evidence</p><p className="text-2xl font-display mt-1">{snapshot?.score.evidenceCompleteness ?? "--"}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted">Diagnosis</p><p className="text-2xl font-display mt-1">{snapshot?.score.diagnosisCoverage ?? "--"}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted">Service Link</p><p className="text-2xl font-display mt-1">{snapshot?.score.serviceConnectionStrength ?? "--"}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted">Transition</p><p className="text-2xl font-display mt-1">{snapshot?.score.transitionReadiness ?? "--"}</p></Card>
          </div>
          <Card className="p-6">
            <h2 className="font-display text-xl">Detected Signals</h2>
            <div className="mt-3 space-y-2">
              {strongSignals.length === 0 ? <p className="text-sm text-muted">No high-confidence changes detected yet. Keep weekly continuity.</p> : null}
              {strongSignals.map((signal) => (
                <div key={signal.label} className="rounded-xl border border-border bg-panel2/50 p-3">
                  <p className="font-semibold">{signal.label}</p>
                  <p className="text-xs text-muted mt-1">Readiness {signal.readiness} • urgency {signal.urgency}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/check-in/results" className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-panel2">
                Open Full Results Page
              </Link>
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "tracker" ? (
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="font-display text-2xl">Weekly Action Tracker</h2>
            <p className="text-sm text-muted mt-2">Same tracker model as onboarding and transition planning.</p>
            <p className="metric-value mt-2">{completion}%</p>
            <div className="mt-2 h-2 rounded-full overflow-hidden bg-panel2"><div className="h-full bg-accent" style={{ width: `${completion}%` }} /></div>
          </Card>

          {loadingTracker ? <Card className="p-6"><p className="text-sm text-muted">Loading tracker...</p></Card> : null}
          {!loadingTracker && !plan?.tasks?.length ? (
            <Card className="p-6"><p className="text-sm text-muted">No tasks yet. Run onboarding intelligence or transition activation to generate tasks.</p></Card>
          ) : null}

          {(plan?.tasks ?? []).map((task) => (
            <Card key={task.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{task.title}</p>
                  <p className="text-sm text-muted mt-1">{task.rationale}</p>
                  <p className="text-xs text-muted mt-2">Urgency {task.urgency}/5</p>
                </div>
                <label className="text-sm flex items-center gap-2">
                  <input type="checkbox" checked={task.completed} onChange={() => void toggleTask(task)} />
                  Done
                </label>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
