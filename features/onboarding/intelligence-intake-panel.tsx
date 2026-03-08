"use client";

import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BrainCircuit, CalendarRange, ClipboardCheck, Plus, Sparkles, Stethoscope, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrCreateClientUserId } from "@/lib/client-user";

const exposureKeys = [
  "Noise / hearing risk",
  "Blast / breaching",
  "Airborne / jump stress",
  "Heavy rucking / repetitive load",
  "Chemical / environmental",
  "Sleep disruption / shift work",
  "Mental stressor exposure"
] as const;

const symptomCategories = [
  "Head / neurological",
  "Hearing / tinnitus",
  "Neck / shoulder",
  "Back / spine",
  "Hip / knee / joints",
  "Sleep / fatigue",
  "Mood / stress / anxiety",
  "Respiratory",
  "GI / digestive",
  "Skin",
  "Cardiovascular",
  "Other recurring symptoms"
] as const;

const schema = z.object({
  serviceProfile: z.object({
    dateJoined: z.string().optional(),
    branch: z.string().min(1, "Required"),
    component: z.string().min(1, "Required"),
    rank: z.string().min(1, "Required"),
    mos: z.string().min(1, "Required"),
    yearsServed: z.coerce.number().int().min(0).max(60),
    currentStatus: z.string().min(1, "Required"),
    etsDate: z.string().optional()
  }),
  timeline: z.object({
    deployments: z
      .array(
        z.object({
          location: z.string().min(1, "Location required"),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          combatExposure: z.enum(["none", "possible", "likely", "confirmed"])
        })
      )
      .min(1),
    schools: z.string().optional(),
    qualifications: z.string().optional()
  }),
  exposures: z.record(
    z.string(),
    z.object({
      level: z.enum(["none", "possible", "likely", "confirmed"]),
      notes: z.string().optional()
    })
  ),
  health: z.array(
    z.object({
      category: z.string(),
      occurrence: z.enum(["none", "rare", "weekly", "daily"]),
      severity: z.coerce.number().int().min(0).max(10),
      impact: z.enum(["none", "mild", "moderate", "severe"]),
      careSought: z.enum(["none", "primary", "specialist", "er"]),
      notes: z.string().optional()
    })
  ),
  goals: z.string().optional()
});

type IntakeFormValues = z.infer<typeof schema>;
type Task = { id: string; title: string; rationale: string; urgency: number; completed: boolean; relatedConditions: string[] };
type TransitionPlan = { tasks: Task[] };
type AnalysisResponse = {
  summary: string;
  confidence: number;
  inferredConditions: Array<{
    name: string;
    bodySystem: string;
    likelihood: "low" | "medium" | "high";
    why: string;
    missingEvidence: string[];
    recommendedActions: string[];
  }>;
  exposureFindings: Array<{ exposure: string; confidence: "low" | "medium" | "high"; implications: string[] }>;
  immediatePlan: Array<{ title: string; rationale: string; urgency: number; timeframe: string; relatedConditions: string[] }>;
  clarifyingQuestions: string[];
};

const tabs = [
  { id: "intake", label: "Intake Questionnaire", icon: CalendarRange },
  { id: "analysis", label: "AI Breakdown", icon: BrainCircuit },
  { id: "tracker", label: "To-Do Tracker", icon: ClipboardCheck }
] as const;

function defaultValues(): IntakeFormValues {
  const exposures: IntakeFormValues["exposures"] = {};
  exposureKeys.forEach((key) => {
    exposures[key] = { level: "none", notes: "" };
  });
  return {
    serviceProfile: {
      dateJoined: "",
      branch: "",
      component: "",
      rank: "",
      mos: "",
      yearsServed: 0,
      currentStatus: "",
      etsDate: ""
    },
    timeline: {
      deployments: [{ location: "", startDate: "", endDate: "", combatExposure: "none" }],
      schools: "",
      qualifications: ""
    },
    exposures,
    health: symptomCategories.map((category) => ({
      category,
      occurrence: "none",
      severity: 0,
      impact: "none",
      careSought: "none",
      notes: ""
    })),
    goals: ""
  };
}

export function OnboardingIntelligenceIntakePanel() {
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("Complete the intake to generate your personalized catch-up plan.");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("intake");
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [plan, setPlan] = useState<TransitionPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [warning, setWarning] = useState<string>("");

  const form = useForm<IntakeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues()
  });

  const deployments = useFieldArray({
    control: form.control,
    name: "timeline.deployments"
  });

  useEffect(() => {
    const id = getOrCreateClientUserId();
    setUserId(id);
  }, []);

  useEffect(() => {
    if (activeTab === "tracker" && userId) {
      void loadPlan(userId);
    }
  }, [activeTab, userId]);

  const completionPct = useMemo(() => {
    if (!plan?.tasks?.length) return 0;
    const done = plan.tasks.filter((task) => task.completed).length;
    return Math.round((done / plan.tasks.length) * 100);
  }, [plan]);

  async function loadPlan(id: string) {
    setLoadingPlan(true);
    try {
      const response = await fetch(`/api/transition/plan?userId=${encodeURIComponent(id)}`);
      if (!response.ok) return;
      const payload = (await response.json()) as { plan: TransitionPlan | null };
      setPlan(payload.plan);
    } finally {
      setLoadingPlan(false);
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
    const payload = (await response.json()) as { plan: TransitionPlan };
    setPlan(payload.plan);
  }

  async function onSubmit(values: IntakeFormValues) {
    if (!userId) {
      setStatus("No authenticated user found. Sign in again and retry.");
      return;
    }
    setWarning("");
    setStatus("Running AI intake analysis and building your catch-up plan...");
    const response = await fetch("/api/onboarding/intelligence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        serviceProfile: values.serviceProfile,
        timeline: {
          deployments: values.timeline.deployments,
          schools: values.timeline.schools
            ? values.timeline.schools.split(",").map((item) => item.trim()).filter(Boolean)
            : [],
          qualifications: values.timeline.qualifications
            ? values.timeline.qualifications.split(",").map((item) => item.trim()).filter(Boolean)
            : []
        },
        exposures: values.exposures,
        health: values.health,
        goals: values.goals
      })
    });

    if (!response.ok) {
      setStatus("Unable to analyze intake. Review fields and try again.");
      return;
    }

    const payload = (await response.json()) as {
      ok: boolean;
      analysis: AnalysisResponse;
      transitionPlan: TransitionPlan;
      warning?: string;
    };

    setAnalysis(payload.analysis);
    setPlan(payload.transitionPlan);
    setWarning(payload.warning ?? "");
    setStatus("AI analysis complete. Review your breakdown and start the tracker.");
    setActiveTab("analysis");
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="kicker">Onboarding Intelligence</p>
        <h1 className="text-3xl font-display mt-2">Comprehensive Service + Health Intake</h1>
        <p className="text-sm text-muted mt-3">
          Guided questionnaire with structured choices and clarifications. AI converts your answers into condition hypotheses,
          evidence gaps, and a prioritized catch-up checklist.
        </p>
        <p className="text-xs text-muted mt-3">User Scope: {userId || "initializing..."}</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.id === activeTab;
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

      {activeTab === "intake" ? (
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="p-6 space-y-4">
            <h2 className="font-display text-xl">1. Service Profile</h2>
            <p className="text-xs text-muted">Enter your official military identity and timeline anchors. These drive ETS timing, exposure mapping, and service-connection analysis.</p>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted">Date joined service</p>
                <input className="rounded-xl bg-panel2 border border-border px-3 py-2 w-full" type="date" {...form.register("serviceProfile.dateJoined")} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted">Branch (Army, Navy, etc.)</p>
                <input className="rounded-xl bg-panel2 border border-border px-3 py-2 w-full" placeholder="Branch" {...form.register("serviceProfile.branch")} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted">Component</p>
                <input className="rounded-xl bg-panel2 border border-border px-3 py-2 w-full" placeholder="Active, Guard, Reserve" {...form.register("serviceProfile.component")} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted">Rank at present</p>
                <input className="rounded-xl bg-panel2 border border-border px-3 py-2 w-full" placeholder="Rank" {...form.register("serviceProfile.rank")} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted">MOS / AFSC / Rate</p>
                <input className="rounded-xl bg-panel2 border border-border px-3 py-2 w-full" placeholder="11B, 3P0X1, HM, etc." {...form.register("serviceProfile.mos")} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted">Total years served</p>
                <input className="rounded-xl bg-panel2 border border-border px-3 py-2 w-full" type="number" min={0} max={60} {...form.register("serviceProfile.yearsServed")} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs text-muted">Current status</p>
                <input className="rounded-xl bg-panel2 border border-border px-3 py-2 w-full" placeholder="Serving, Transitioning, Retiring soon" {...form.register("serviceProfile.currentStatus")} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted">ETS / retirement date</p>
                <input className="rounded-xl bg-panel2 border border-border px-3 py-2 w-full" type="date" {...form.register("serviceProfile.etsDate")} />
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl">2. Deployments / Timeline</h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => deployments.append({ location: "", startDate: "", endDate: "", combatExposure: "none" })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Deployment
              </Button>
            </div>
            <p className="text-xs text-muted">Add each deployment or operational period. Use approximate dates if exact dates are unavailable.</p>
            <div className="space-y-3">
              {deployments.fields.map((field, index) => (
                <div key={field.id} className="grid md:grid-cols-5 gap-3 rounded-xl border border-border p-3 bg-panel2/60">
                  <div className="md:col-span-2 space-y-1">
                    <p className="text-[11px] text-muted">Location / operation name</p>
                    <input className="rounded-xl bg-panel border border-border px-3 py-2 w-full" placeholder="Kandahar, CENTCOM rotation, JRTC, etc." {...form.register(`timeline.deployments.${index}.location`)} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] text-muted">Start date</p>
                    <input className="rounded-xl bg-panel border border-border px-3 py-2 w-full" type="date" {...form.register(`timeline.deployments.${index}.startDate`)} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] text-muted">End date</p>
                    <input className="rounded-xl bg-panel border border-border px-3 py-2 w-full" type="date" {...form.register(`timeline.deployments.${index}.endDate`)} />
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="w-full space-y-1">
                      <p className="text-[11px] text-muted">Combat exposure level</p>
                      <select className="rounded-xl bg-panel border border-border px-3 py-2 w-full" {...form.register(`timeline.deployments.${index}.combatExposure`)}>
                        <option value="none">Combat: None</option>
                        <option value="possible">Combat: Possible</option>
                        <option value="likely">Combat: Likely</option>
                        <option value="confirmed">Combat: Confirmed</option>
                      </select>
                    </div>
                    {deployments.fields.length > 1 ? (
                      <button type="button" className="rounded-xl border border-border px-2 py-2 hover:bg-panel h-[42px]" onClick={() => deployments.remove(index)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-[11px] text-muted">Schools attended (comma-separated)</p>
                <textarea className="rounded-xl bg-panel2 border border-border px-3 py-2 min-h-[96px] w-full" placeholder="Air Assault, Ranger, ALC..." {...form.register("timeline.schools")} />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] text-muted">Qualifications / badges / certs (comma-separated)</p>
                <textarea className="rounded-xl bg-panel2 border border-border px-3 py-2 min-h-[96px] w-full" placeholder="Parachutist, Expert Infantry Badge, EMT..." {...form.register("timeline.qualifications")} />
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-display text-xl">3. Exposure Mapping (Structured + Clarification)</h2>
            <p className="text-xs text-muted">Choose exposure confidence and add context like unit, duty type, frequency, and known incidents.</p>
            <div className="space-y-3">
              {exposureKeys.map((key) => (
                <div key={key} className="grid md:grid-cols-[220px_180px_1fr] gap-3 items-start rounded-xl border border-border p-3 bg-panel2/50">
                  <p className="text-sm font-semibold">{key}</p>
                  <select className="rounded-xl bg-panel border border-border px-3 py-2" {...form.register(`exposures.${key}.level`)}>
                    <option value="none">None</option>
                    <option value="possible">Possible</option>
                    <option value="likely">Likely</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                  <input className="rounded-xl bg-panel border border-border px-3 py-2" placeholder="Clarifying details (dates, unit, frequency, events)" {...form.register(`exposures.${key}.notes`)} />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-display text-xl">4. Head-to-Toe Health Questionnaire</h2>
            <p className="text-xs text-muted">Track what occurred this week, severity, functional impact, and whether medical care was sought.</p>
            <div className="rounded-xl border border-border bg-panel2/40 px-3 py-2 text-[11px] text-muted grid md:grid-cols-[200px_140px_120px_140px_140px_1fr] gap-3">
              <p>Body system</p>
              <p>How often this week</p>
              <p>Severity (0-10)</p>
              <p>Impact level</p>
              <p>Care sought</p>
              <p>Clarification (timing, triggers, missed duty, sleep/training impact)</p>
            </div>
            <div className="space-y-3">
              {symptomCategories.map((category, index) => (
                <div key={category} className="grid md:grid-cols-[200px_140px_120px_140px_140px_1fr] gap-3 rounded-xl border border-border p-3 bg-panel2/50">
                  <p className="text-sm font-semibold">{category}</p>
                  <select className="rounded-xl bg-panel border border-border px-3 py-2" {...form.register(`health.${index}.occurrence`)}>
                    <option value="none">No issue</option>
                    <option value="rare">Rare</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                  </select>
                  <input className="rounded-xl bg-panel border border-border px-3 py-2" type="number" min={0} max={10} {...form.register(`health.${index}.severity`)} />
                  <select className="rounded-xl bg-panel border border-border px-3 py-2" {...form.register(`health.${index}.impact`)}>
                    <option value="none">Impact: None</option>
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                  <select className="rounded-xl bg-panel border border-border px-3 py-2" {...form.register(`health.${index}.careSought`)}>
                    <option value="none">Care: None</option>
                    <option value="primary">Primary</option>
                    <option value="specialist">Specialist</option>
                    <option value="er">ER/Urgent</option>
                  </select>
                  <input className="rounded-xl bg-panel border border-border px-3 py-2" placeholder="Clarification (timing, triggers, functional impact)" {...form.register(`health.${index}.notes`)} />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-3">
            <h2 className="font-display text-xl">5. Goals / Constraints</h2>
            <textarea
              className="w-full rounded-xl bg-panel2 border border-border px-3 py-2 min-h-[120px]"
              placeholder="Anything the system should prioritize: separation timeline, difficult records, unresolved injuries, pending exams, etc."
              {...form.register("goals")}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit">
                <Sparkles className="h-4 w-4 mr-1.5" />
                Analyze & Build Catch-Up Plan
              </Button>
              <p className="text-sm text-muted">{status}</p>
            </div>
            {warning ? <p className="text-xs text-warning">{warning}</p> : null}
          </Card>
        </form>
      ) : null}

      {activeTab === "analysis" ? (
        analysis ? (
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl">AI Intake Breakdown</h2>
                <span className="text-xs rounded-full px-3 py-1 bg-ai/20 text-ai">
                  Confidence {(analysis.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-sm text-muted mt-3">{analysis.summary}</p>
            </Card>

            <div className="grid lg:grid-cols-2 gap-4">
              <Card className="p-5 space-y-3">
                <h3 className="font-display text-lg flex items-center gap-2"><Stethoscope className="h-4 w-4 text-accent" /> Inferred Condition Areas</h3>
                {analysis.inferredConditions.length === 0 ? <p className="text-sm text-muted">No high-signal conditions inferred yet.</p> : null}
                {analysis.inferredConditions.map((condition) => (
                  <div key={`${condition.name}-${condition.bodySystem}`} className="rounded-xl border border-border p-3 bg-panel2/60">
                    <p className="font-semibold">{condition.name}</p>
                    <p className="text-xs text-muted mt-1">{condition.bodySystem} • {condition.likelihood} likelihood</p>
                    <p className="text-sm text-muted mt-2">{condition.why}</p>
                    <p className="text-xs mt-2">Missing: {condition.missingEvidence.join(" • ")}</p>
                  </div>
                ))}
              </Card>

              <Card className="p-5 space-y-3">
                <h3 className="font-display text-lg">Exposure Findings</h3>
                {analysis.exposureFindings.length === 0 ? <p className="text-sm text-muted">No significant exposure signals identified.</p> : null}
                {analysis.exposureFindings.map((exposure) => (
                  <div key={exposure.exposure} className="rounded-xl border border-border p-3 bg-panel2/60">
                    <p className="font-semibold">{exposure.exposure}</p>
                    <p className="text-xs text-muted mt-1">{exposure.confidence} confidence</p>
                    <p className="text-sm text-muted mt-2">{exposure.implications.join(" • ")}</p>
                  </div>
                ))}
              </Card>
            </div>

            <Card className="p-5">
              <h3 className="font-display text-lg">Clarifying Questions</h3>
              <div className="mt-3 space-y-2">
                {analysis.clarifyingQuestions.map((question) => (
                  <p key={question} className="text-sm rounded-lg border border-border bg-panel2/50 px-3 py-2">{question}</p>
                ))}
              </div>
              <div className="mt-4">
                <Button onClick={() => setActiveTab("tracker")}>Open To-Do Tracker</Button>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-6">
            <p className="text-sm text-muted">No AI analysis yet. Complete the intake questionnaire first.</p>
          </Card>
        )
      ) : null}

      {activeTab === "tracker" ? (
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="font-display text-2xl">Catch-Up To-Do Tracker</h2>
            <p className="text-sm text-muted mt-2">Tasks are generated from your onboarding analysis and persisted in Transition Mode.</p>
            <p className="metric-value mt-3">{completionPct}%</p>
            <div className="mt-2 h-2 rounded-full overflow-hidden bg-panel2">
              <div className="h-full bg-accent" style={{ width: `${completionPct}%` }} />
            </div>
          </Card>

          {loadingPlan ? (
            <Card className="p-6"><p className="text-sm text-muted">Loading tracker...</p></Card>
          ) : null}

          {!loadingPlan && !plan?.tasks?.length ? (
            <Card className="p-6"><p className="text-sm text-muted">No tracker tasks yet. Run intake analysis to generate your action plan.</p></Card>
          ) : null}

          <div className="space-y-3">
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
        </div>
      ) : null}
    </div>
  );
}
