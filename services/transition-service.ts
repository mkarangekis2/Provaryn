import { randomUUID } from "node:crypto";
export type TransitionTask = {
  id: string;
  title: string;
  rationale: string;
  urgency: number;
  completed: boolean;
  relatedConditions: string[];
  owner: "member" | "coach";
  dueAt?: string;
  impactScore: number;
  sourceStage: "onboarding" | "weekly" | "transition" | "claim_builder";
  taskType: "evidence" | "medical_eval" | "narrative" | "records";
};

type ConditionLite = { id: string; label: string; readiness: number; diagnosisStatus: string; urgency: "low" | "medium" | "high" };

export function buildTransitionTasks(input: { conditions: ConditionLite[] }): TransitionTask[] {
  const dueInDays = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  };
  const tasks: TransitionTask[] = [];

  const highPriority = input.conditions.filter((condition) => condition.urgency === "high" || condition.diagnosisStatus === "missing");
  if (highPriority.some((condition) => condition.label.includes("Sleep"))) {
    tasks.push({
      id: randomUUID(),
      title: "Schedule sleep study",
      rationale: "Sleep-related symptoms with missing diagnostic confirmation reduce claim strength.",
      urgency: 5,
      completed: false,
      relatedConditions: highPriority.filter((condition) => condition.label.includes("Sleep")).map((condition) => condition.id),
      owner: "member",
      dueAt: dueInDays(14),
      impactScore: 88,
      sourceStage: "transition",
      taskType: "medical_eval"
    });
  }

  if (highPriority.some((condition) => condition.label.includes("Tinnitus") || condition.label.includes("Headache"))) {
    tasks.push({
      id: randomUUID(),
      title: "Complete audiology and neuro evaluation",
      rationale: "Hearing/headache patterns require specialist documentation before filing.",
      urgency: 5,
      completed: false,
      relatedConditions: highPriority.filter((condition) => condition.label.includes("Tinnitus") || condition.label.includes("Headache")).map((condition) => condition.id),
      owner: "member",
      dueAt: dueInDays(10),
      impactScore: 90,
      sourceStage: "transition",
      taskType: "medical_eval"
    });
  }

  if (highPriority.some((condition) => condition.label.includes("Lumbar"))) {
    tasks.push({
      id: randomUUID(),
      title: "Request lumbar imaging and ROM notes",
      rationale: "Musculoskeletal claims are stronger with imaging and documented functional limitation.",
      urgency: 4,
      completed: false,
      relatedConditions: highPriority.filter((condition) => condition.label.includes("Lumbar")).map((condition) => condition.id),
      owner: "member",
      dueAt: dueInDays(12),
      impactScore: 84,
      sourceStage: "transition",
      taskType: "medical_eval"
    });
  }

  tasks.push(
    {
      id: randomUUID(),
      title: "Gather final records and profiles",
      rationale: "Final records package prevents evidence defects at submission.",
      urgency: 5,
      completed: false,
      relatedConditions: [],
      owner: "member",
      dueAt: dueInDays(7),
      impactScore: 92,
      sourceStage: "transition",
      taskType: "records"
    },
    {
      id: randomUUID(),
      title: "Generate condition narratives",
      rationale: "Narrative quality improves service-connection context and continuity.",
      urgency: 4,
      completed: false,
      relatedConditions: input.conditions.map((condition) => condition.id),
      owner: "member",
      dueAt: dueInDays(9),
      impactScore: 76,
      sourceStage: "transition",
      taskType: "narrative"
    }
  );

  return tasks;
}
