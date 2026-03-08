import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getUserSnapshotSupabase } from "@/server/persistence/supabase-intelligence";
import { getTransitionPlanSupabase } from "@/server/persistence/supabase-transition-claims";
import { calculateClaimReadiness } from "@/services/readiness-service";

export type MissionStage =
  | "intake"
  | "baseline"
  | "action_queue"
  | "weekly_cadence"
  | "transition"
  | "claim_builder";

export type JourneyDefectType =
  | "missing_diagnosis"
  | "missing_continuity_logs"
  | "missing_event_linkage"
  | "missing_specialist_evidence";

export type JourneyDefect = {
  type: JourneyDefectType;
  label: string;
  impact: "low" | "medium" | "high";
  route: string;
};

export type JourneyGate = {
  key: "evidence_completeness" | "diagnosis_coverage" | "service_connection_strength";
  current: number;
  target: number;
  passed: boolean;
};

export type JourneyStatus = {
  stage: MissionStage;
  stageLabel: string;
  score: {
    overall: number;
    evidenceCompleteness: number;
    diagnosisCoverage: number;
    serviceConnectionStrength: number;
    transitionReadiness: number;
  };
  gates: JourneyGate[];
  defects: JourneyDefect[];
  nextActions: Array<{ title: string; route: string }>;
};

function resolveStage(input: {
  hasServiceProfile: boolean;
  checkIns: number;
  transitionActive: boolean;
  claimPackageCount: number;
  gatesPassed: number;
}): MissionStage {
  if (!input.hasServiceProfile) return "intake";
  if (input.checkIns < 1) return "baseline";
  if (input.gatesPassed < 2) return "action_queue";
  if (input.transitionActive) return input.claimPackageCount > 0 ? "claim_builder" : "transition";
  return "weekly_cadence";
}

function buildDefects(input: {
  score: { evidenceCompleteness: number; diagnosisCoverage: number; serviceConnectionStrength: number };
  counts: { checkIns: number; events: number; documents: number };
}): JourneyDefect[] {
  const defects: JourneyDefect[] = [];
  if (input.score.diagnosisCoverage < 50) {
    defects.push({
      type: "missing_diagnosis",
      label: "Diagnosis coverage below target",
      impact: "high",
      route: "/conditions"
    });
  }
  if (input.counts.checkIns < 4) {
    defects.push({
      type: "missing_continuity_logs",
      label: "Longitudinal symptom continuity is thin",
      impact: "high",
      route: "/check-in"
    });
  }
  if (input.counts.events < 2) {
    defects.push({
      type: "missing_event_linkage",
      label: "Event/service linkage support is limited",
      impact: "medium",
      route: "/events"
    });
  }
  if (input.counts.documents < 2) {
    defects.push({
      type: "missing_specialist_evidence",
      label: "Specialist/document evidence is incomplete",
      impact: "high",
      route: "/vault"
    });
  }
  return defects;
}

function stageLabel(stage: MissionStage) {
  if (stage === "intake") return "Intake";
  if (stage === "baseline") return "Baseline Score";
  if (stage === "action_queue") return "Action Queue";
  if (stage === "weekly_cadence") return "Weekly Cadence";
  if (stage === "transition") return "Transition";
  return "Claim Builder";
}

export async function buildJourneyStatus(userId: string): Promise<JourneyStatus> {
  const snapshot = await getUserSnapshotSupabase(userId);
  const score = calculateClaimReadiness({
    symptomLogCount: snapshot.counts.symptomEntries,
    diagnosisCount: Math.max(1, Math.floor(snapshot.counts.highSeverityEntries / 4)),
    serviceEventsLinked: snapshot.counts.events,
    exposureLinks: Math.max(1, Math.floor(snapshot.counts.timelineEntries / 2)),
    documentCount: snapshot.counts.documents,
    narrativeCount: Math.max(0, Math.floor(snapshot.counts.events / 3)),
    specialistEvaluations: Math.max(0, Math.floor(snapshot.counts.checkIns / 4))
  });

  const [transitionPlan, profileResult, claimPackageCountRes] = await Promise.all([
    getTransitionPlanSupabase(userId),
    createServiceSupabaseClient().from("service_profiles").select("user_id").eq("user_id", userId).maybeSingle(),
    createServiceSupabaseClient().from("claim_packages").select("id", { count: "exact", head: true }).eq("user_id", userId)
  ]);

  const gates: JourneyGate[] = [
    {
      key: "evidence_completeness",
      current: score.evidenceCompleteness,
      target: 65,
      passed: score.evidenceCompleteness >= 65
    },
    {
      key: "diagnosis_coverage",
      current: score.diagnosisCoverage,
      target: 50,
      passed: score.diagnosisCoverage >= 50
    },
    {
      key: "service_connection_strength",
      current: score.serviceConnectionStrength,
      target: 55,
      passed: score.serviceConnectionStrength >= 55
    }
  ];

  const defects = buildDefects({
    score: {
      evidenceCompleteness: score.evidenceCompleteness,
      diagnosisCoverage: score.diagnosisCoverage,
      serviceConnectionStrength: score.serviceConnectionStrength
    },
    counts: {
      checkIns: snapshot.counts.checkIns,
      events: snapshot.counts.events,
      documents: snapshot.counts.documents
    }
  });

  const stage = resolveStage({
    hasServiceProfile: Boolean(profileResult.data),
    checkIns: snapshot.counts.checkIns,
    transitionActive: Boolean(transitionPlan?.active),
    claimPackageCount: claimPackageCountRes.count ?? 0,
    gatesPassed: gates.filter((gate) => gate.passed).length
  });

  const nextActions =
    defects.length > 0
      ? defects.slice(0, 3).map((defect) => ({ title: defect.label, route: defect.route }))
      : [{ title: "Continue weekly check-in cadence", route: "/check-in" }];

  return {
    stage,
    stageLabel: stageLabel(stage),
    score,
    gates,
    defects,
    nextActions
  };
}
