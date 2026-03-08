import { NextRequest, NextResponse } from "next/server";
import { buildUserIntelligenceAsync } from "@/services/intelligence/user-intelligence-service";
import { hasAnyRole } from "@/lib/auth/access-scope";
import { requireAuthorizedQueryUser } from "@/lib/auth/request-user";

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  const canViewAdminScope = await hasAnyRole(auth.userId, ["program_admin", "system_admin"]);
  if (!canViewAdminScope) {
    return NextResponse.json({ ok: false, error: "Insufficient role for admin dashboard" }, { status: 403 });
  }

  try {
    const intel = await buildUserIntelligenceAsync(auth.userId);
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
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load cohort analytics" },
      { status: 500 }
    );
  }
}
