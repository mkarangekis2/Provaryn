import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prompts } from "@/ai/prompts";
import { onboardingIntelligenceService } from "@/ai/services";
import { requireAuthorizedUser } from "@/lib/auth/request-user";
import { persistAIRecommendation } from "@/services/ai/recommendation-persistence-service";
import {
  addCheckInSupabase,
  addTimelineEntrySupabase,
  upsertServiceStartTimelineSupabase,
  upsertServiceProfileSupabase
} from "@/server/persistence/supabase-intake";
import { upsertTransitionPlanSupabase } from "@/server/persistence/supabase-transition-claims";
import { upsertUserConditionsSupabase } from "@/server/persistence/supabase-intelligence";

const exposureValueSchema = z.object({
  level: z.enum(["none", "possible", "likely", "confirmed"]),
  notes: z.string().optional()
});

const healthEntrySchema = z.object({
  category: z.string().min(1),
  occurrence: z.enum(["none", "rare", "weekly", "daily"]),
  severity: z.number().int().min(0).max(10),
  impact: z.enum(["none", "mild", "moderate", "severe"]),
  careSought: z.enum(["none", "primary", "specialist", "er"]),
  notes: z.string().optional()
});

const schema = z.object({
  userId: z.string().min(5),
  serviceProfile: z.object({
    branch: z.string().min(1),
    component: z.string().min(1),
    rank: z.string().min(1),
    mos: z.string().min(1),
    yearsServed: z.number().int().min(0).max(60),
    currentStatus: z.string().min(1),
    dateJoined: z.string().optional(),
    etsDate: z.string().optional()
  }),
  timeline: z.object({
    deployments: z.array(
      z.object({
        location: z.string().min(1),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        combatExposure: z.enum(["none", "possible", "likely", "confirmed"])
      })
    ),
    schools: z.array(z.string()),
    qualifications: z.array(z.string())
  }),
  exposures: z.record(z.string(), exposureValueSchema),
  health: z.array(healthEntrySchema).min(1),
  goals: z.string().optional()
});

function computeYearsServed(input: { dateJoined?: string; currentStatus?: string; etsDate?: string }, fallback: number) {
  if (!input.dateJoined) return fallback;
  const joined = new Date(`${input.dateJoined}T00:00:00`);
  if (Number.isNaN(joined.getTime())) return fallback;

  const now = new Date();
  let end = now;
  if (input.etsDate) {
    const ets = new Date(`${input.etsDate}T00:00:00`);
    if (!Number.isNaN(ets.getTime()) && ets <= now) {
      end = ets;
    }
  }

  const status = (input.currentStatus ?? "").toLowerCase();
  if ((status.includes("retired") || status.includes("separated") || status.includes("veteran")) && input.etsDate) {
    const ets = new Date(`${input.etsDate}T00:00:00`);
    if (!Number.isNaN(ets.getTime())) {
      end = ets <= now ? ets : now;
    }
  }

  if (end < joined) return 0;
  const yearDiff = end.getFullYear() - joined.getFullYear();
  const anniversaryPassed =
    end.getMonth() > joined.getMonth() ||
    (end.getMonth() === joined.getMonth() && end.getDate() >= joined.getDate());
  return Math.max(0, anniversaryPassed ? yearDiff : yearDiff - 1);
}

function mapFrequency(occurrence: "none" | "rare" | "weekly" | "daily") {
  if (occurrence === "daily") return 7;
  if (occurrence === "weekly") return 3;
  if (occurrence === "rare") return 1;
  return 0;
}

function deterministicFallback(input: z.infer<typeof schema>) {
  const activeHealth = input.health.filter((entry) => entry.severity >= 4 || entry.occurrence === "weekly" || entry.occurrence === "daily");
  return {
    summary:
      activeHealth.length > 0
        ? `Intake shows ${activeHealth.length} active symptom areas that need evidence continuity and diagnostic support.`
        : "Intake is complete with limited active symptoms reported. Continue weekly tracking for continuity.",
    confidence: 0.65,
    inferredConditions: activeHealth.slice(0, 6).map((entry) => ({
      name: `${entry.category} symptom cluster`,
      bodySystem: entry.category,
      likelihood: entry.severity >= 7 ? "high" : "medium",
      why: `Reported ${entry.occurrence} with severity ${entry.severity}/10 and ${entry.impact} impact.`,
      missingEvidence: ["Specialist or PCP evaluation note", "Consistent symptom log continuity", "Functional impact documentation"],
      recommendedActions: ["Log weekly symptom progression", "Request follow-up exam", "Upload visit notes and related orders"]
    })),
    exposureFindings: Object.entries(input.exposures)
      .filter(([, exposure]) => exposure.level !== "none")
      .map(([name, exposure]) => ({
        exposure: name,
        confidence: exposure.level === "confirmed" ? "high" : "medium",
        implications: ["Potential service-connection support", "Needs event/date anchoring in records"]
      })),
    immediatePlan: [
      {
        title: "Fill high-impact evidence gaps",
        rationale: "Missing diagnostics and sparse continuity lower readiness.",
        urgency: 5,
        timeframe: "Next 14 days",
        relatedConditions: activeHealth.slice(0, 3).map((entry) => entry.category)
      },
      {
        title: "Build symptom continuity cadence",
        rationale: "Weekly entries improve severity trend and claim strength.",
        urgency: 4,
        timeframe: "Weekly",
        relatedConditions: activeHealth.slice(0, 4).map((entry) => entry.category)
      },
      {
        title: "Organize records by condition",
        rationale: "Condition-to-evidence mapping is required before package assembly.",
        urgency: 4,
        timeframe: "Next 30 days",
        relatedConditions: activeHealth.slice(0, 5).map((entry) => entry.category)
      }
    ],
    clarifyingQuestions: [
      "Which symptoms caused missed duty, profile restrictions, or reduced training output?",
      "Which conditions already have diagnosis and imaging support?",
      "What records from deployments or field events are still missing?"
    ]
  } as const;
}

function normalizeLikelihood(likelihood: string): "low" | "medium" | "high" {
  const value = likelihood.toLowerCase();
  if (value === "high" || value === "medium" || value === "low") return value;
  return "medium";
}

function mapLikelihoodToConfidence(likelihood: string) {
  const normalized = normalizeLikelihood(likelihood);
  if (normalized === "high") return 0.82;
  if (normalized === "medium") return 0.64;
  return 0.45;
}

function mapLikelihoodToReadiness(likelihood: string, missingEvidenceCount: number) {
  const normalized = normalizeLikelihood(likelihood);
  const base = normalized === "high" ? 70 : normalized === "medium" ? 52 : 36;
  const penalty = Math.min(20, missingEvidenceCount * 4);
  return Math.max(10, base - penalty);
}

export async function POST(request: NextRequest) {
  const body = schema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;

  const payload = { ...body, userId: auth.userId };
  const computedYearsServed = computeYearsServed(
    {
      dateJoined: payload.serviceProfile.dateJoined,
      currentStatus: payload.serviceProfile.currentStatus,
      etsDate: payload.serviceProfile.etsDate
    },
    payload.serviceProfile.yearsServed
  );

  try {
    const analysisResult = await onboardingIntelligenceService({
      serviceProfile: {
        ...payload.serviceProfile,
        yearsServed: computedYearsServed
      },
      timeline: payload.timeline,
      exposures: payload.exposures,
      health: payload.health,
      goals: payload.goals
    });

    const analysis = analysisResult.data;

    await upsertServiceProfileSupabase({
      userId: payload.userId,
      branch: payload.serviceProfile.branch,
      component: payload.serviceProfile.component,
      rank: payload.serviceProfile.rank,
      mos: payload.serviceProfile.mos,
      yearsServed: computedYearsServed,
      currentStatus: payload.serviceProfile.currentStatus,
      etsDate: payload.serviceProfile.etsDate
    });

    if (payload.serviceProfile.dateJoined) {
      await upsertServiceStartTimelineSupabase({
        userId: payload.userId,
        dateJoined: payload.serviceProfile.dateJoined,
        branch: payload.serviceProfile.branch,
        component: payload.serviceProfile.component
      });
    }

    await Promise.all(
      payload.timeline.deployments.slice(0, 10).map((deployment) =>
        addTimelineEntrySupabase({
          userId: payload.userId,
          entryType: "deployment",
          title: `Deployment: ${deployment.location}`,
          startDate: deployment.startDate,
          endDate: deployment.endDate,
          metadata: {
            combatExposure: deployment.combatExposure
          }
        })
      )
    );

    const symptomEntries = payload.health
      .filter((entry) => entry.occurrence !== "none" && entry.severity > 0)
      .map((entry) => ({
        category: entry.category,
        severity: entry.severity,
        frequency: mapFrequency(entry.occurrence),
        impact: `${entry.impact}${entry.notes ? ` | ${entry.notes}` : ""}`,
        careSought: entry.careSought !== "none"
      }));

    if (symptomEntries.length > 0) {
      await addCheckInSupabase({
        userId: payload.userId,
        sessionDate: new Date().toISOString().slice(0, 10),
        entries: symptomEntries
      });
    }

    const transitionPlan = await upsertTransitionPlanSupabase({
      userId: payload.userId,
      active: true,
      targetDate: payload.serviceProfile.etsDate,
      triggeredReason: "Onboarding intelligence catch-up plan",
      tasks: analysis.immediatePlan.map((item) => ({
        id: randomUUID(),
        title: item.title,
        rationale: `Onboarding: ${item.rationale} (${item.timeframe})`,
        urgency: item.urgency,
        completed: false,
        relatedConditions: item.relatedConditions,
        owner: "member",
        dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
        impactScore: Math.min(95, 50 + item.urgency * 8),
        sourceStage: "onboarding",
        taskType: "evidence"
      }))
    });

    await upsertUserConditionsSupabase({
      userId: payload.userId,
      conditions: analysis.inferredConditions.map((condition) => ({
        label: condition.name,
        category: condition.bodySystem.toLowerCase().replace(/\s+/g, "_"),
        confidence: mapLikelihoodToConfidence(condition.likelihood),
        readiness: mapLikelihoodToReadiness(condition.likelihood, condition.missingEvidence.length),
        diagnosisStatus: condition.missingEvidence.some((item) => item.toLowerCase().includes("diagnos")) ? "missing" : "suspected",
        serviceConnection: condition.likelihood === "high" ? 72 : condition.likelihood === "medium" ? 58 : 44
      }))
    });
    const evidenceSignals =
      payload.timeline.deployments.length +
      Object.values(payload.exposures).filter((item) => item.level !== "none").length +
      payload.health.filter((item) => item.occurrence !== "none").length;
    const missingItems =
      analysis.inferredConditions.reduce((sum, condition) => sum + condition.missingEvidence.length, 0) +
      analysis.clarifyingQuestions.length;

    const persisted = await persistAIRecommendation({
      userId: payload.userId,
      runType: "onboarding_intelligence",
      promptVersion: prompts.onboardingIntelligence.version,
      recommendationType: "onboarding_intelligence",
      model: analysisResult.model,
      llmConfidence: analysis.confidence ?? analysisResult.confidence,
      payload: analysis as unknown as Record<string, unknown>,
      inputPayload: {
        serviceProfile: payload.serviceProfile,
        deploymentCount: payload.timeline.deployments.length,
        exposureCount: Object.keys(payload.exposures).length,
        healthEntries: payload.health.length
      },
      evidenceSignals,
      missingItems,
      explanation: {
        whatDetected: `${analysis.inferredConditions.length} inferred conditions`,
        whyItMatters: "Onboarding intelligence drives baseline tasks and condition readiness initialization.",
        evidenceUsed: analysis.summary,
        missingItems: analysis.clarifyingQuestions.slice(0, 8).join(", "),
        actionRecommended: analysis.immediatePlan.slice(0, 3).map((item) => item.title).join(", ")
      }
    });

    return NextResponse.json({ ok: true, analysis, transitionPlan, reliability: persisted.reliability, recommendationId: persisted.recommendationId });
  } catch (error) {
    try {
      const analysis = deterministicFallback(payload);
      const transitionPlan = await upsertTransitionPlanSupabase({
        userId: payload.userId,
        active: true,
        targetDate: payload.serviceProfile.etsDate,
        triggeredReason: "Onboarding fallback catch-up plan",
        tasks: analysis.immediatePlan.map((item) => ({
          id: randomUUID(),
          title: item.title,
          rationale: `Onboarding: ${item.rationale} (${item.timeframe})`,
          urgency: item.urgency,
          completed: false,
          relatedConditions: item.relatedConditions,
          owner: "member",
          dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
          impactScore: Math.min(95, 50 + item.urgency * 8),
          sourceStage: "onboarding",
          taskType: "evidence"
        }))
      });

      await upsertUserConditionsSupabase({
        userId: payload.userId,
        conditions: analysis.inferredConditions.map((condition) => ({
          label: condition.name,
          category: condition.bodySystem.toLowerCase().replace(/\s+/g, "_"),
          confidence: mapLikelihoodToConfidence(condition.likelihood),
          readiness: mapLikelihoodToReadiness(condition.likelihood, condition.missingEvidence.length),
          diagnosisStatus: condition.missingEvidence.some((item) => item.toLowerCase().includes("diagnos")) ? "missing" : "suspected",
          serviceConnection: condition.likelihood === "high" ? 72 : condition.likelihood === "medium" ? 58 : 44
        }))
      });
      const persisted = await persistAIRecommendation({
        userId: payload.userId,
        runType: "onboarding_intelligence_fallback",
        promptVersion: `${prompts.onboardingIntelligence.version}-deterministic-fallback`,
        recommendationType: "onboarding_intelligence",
        model: "deterministic",
        llmConfidence: analysis.confidence,
        payload: analysis as unknown as Record<string, unknown>,
        inputPayload: {
          serviceProfile: payload.serviceProfile,
          deploymentCount: payload.timeline.deployments.length,
          exposureCount: Object.keys(payload.exposures).length,
          healthEntries: payload.health.length
        },
        evidenceSignals: payload.health.filter((item) => item.occurrence !== "none").length,
        missingItems: analysis.clarifyingQuestions.length,
        explanation: {
          whatDetected: `${analysis.inferredConditions.length} inferred conditions`,
          whyItMatters: "Fallback plan preserves deterministic progress when AI is unavailable.",
          evidenceUsed: analysis.summary,
          missingItems: analysis.clarifyingQuestions.slice(0, 8).join(", "),
          actionRecommended: analysis.immediatePlan.slice(0, 3).map((item) => item.title).join(", ")
        }
      });
      return NextResponse.json({
        ok: true,
        analysis,
        transitionPlan,
        reliability: persisted.reliability,
        recommendationId: persisted.recommendationId,
        warning: error instanceof Error ? error.message : "AI unavailable, generated deterministic plan."
      });
    } catch (nestedError) {
      return NextResponse.json(
        { ok: false, error: nestedError instanceof Error ? nestedError.message : "Failed to run onboarding intelligence" },
        { status: 500 }
      );
    }
  }
}
