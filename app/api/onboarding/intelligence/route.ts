import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { onboardingIntelligenceService } from "@/ai/services";
import { requireAuthorizedUser } from "@/lib/auth/request-user";
import {
  addCheckInSupabase,
  addTimelineEntrySupabase,
  upsertServiceProfileSupabase
} from "@/server/persistence/supabase-intake";
import { upsertTransitionPlanSupabase } from "@/server/persistence/supabase-transition-claims";

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

export async function POST(request: NextRequest) {
  const body = schema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;

  const payload = { ...body, userId: auth.userId };

  try {
    const analysisResult = await onboardingIntelligenceService({
      serviceProfile: payload.serviceProfile,
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
      yearsServed: payload.serviceProfile.yearsServed,
      currentStatus: payload.serviceProfile.currentStatus,
      etsDate: payload.serviceProfile.etsDate
    });

    if (payload.serviceProfile.dateJoined) {
      await addTimelineEntrySupabase({
        userId: payload.userId,
        entryType: "service_start",
        title: "Entered military service",
        startDate: payload.serviceProfile.dateJoined,
        metadata: {
          branch: payload.serviceProfile.branch,
          component: payload.serviceProfile.component
        }
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
        rationale: `${item.rationale} (${item.timeframe})`,
        urgency: item.urgency,
        completed: false,
        relatedConditions: item.relatedConditions
      }))
    });

    return NextResponse.json({ ok: true, analysis, transitionPlan });
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
          rationale: `${item.rationale} (${item.timeframe})`,
          urgency: item.urgency,
          completed: false,
          relatedConditions: item.relatedConditions
        }))
      });
      return NextResponse.json({
        ok: true,
        analysis,
        transitionPlan,
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
