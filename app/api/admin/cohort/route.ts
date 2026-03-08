import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildUserIntelligenceAsync } from "@/services/intelligence/user-intelligence-service";

const schema = z.object({ userId: z.string().min(5) });

export async function GET(request: NextRequest) {
  const parsed = schema.safeParse({ userId: request.nextUrl.searchParams.get("userId") });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });

  const intel = await buildUserIntelligenceAsync(parsed.data.userId);
  const readiness = intel.score.overall;

  return NextResponse.json({
    ok: true,
    cohort: {
      participantCount: 1,
      avgReadiness: readiness,
      atRiskCount: readiness < 65 ? 1 : 0,
      transitionsSoon: intel.score.transitionReadiness < 70 ? 1 : 0,
      completionMetrics: {
        onboardingCompletion: intel.snapshot.counts.timelineEntries > 0 ? 100 : 40,
        checkInCadence: Math.min(100, intel.snapshot.counts.checkIns * 12),
        evidenceCoverage: intel.score.evidenceCompleteness
      }
    }
  });
}
