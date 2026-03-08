import { NextRequest, NextResponse } from "next/server";
import { buildUserIntelligenceAsync } from "@/services/intelligence/user-intelligence-service";
import { hasAnyRole } from "@/lib/auth/access-scope";
import { requireAuthorizedQueryUser } from "@/lib/auth/request-user";

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  const canViewCoachScope = await hasAnyRole(auth.userId, ["coach", "program_admin", "system_admin"]);
  if (!canViewCoachScope) {
    return NextResponse.json({ ok: false, error: "Insufficient role for coach dashboard" }, { status: 403 });
  }

  const intel = await buildUserIntelligenceAsync(auth.userId);
  const topGaps = intel.conditions
    .filter((c) => c.diagnosisStatus === "missing" || c.readiness < 60)
    .slice(0, 4)
    .map((c) => `${c.label}: ${c.diagnosisStatus === "missing" ? "diagnosis gap" : "readiness gap"}`);

  return NextResponse.json({
    ok: true,
    users: [
      {
        id: auth.userId,
        displayName: "Primary User",
        readiness: intel.score.overall,
        transitionRisk: intel.score.transitionReadiness < 65 ? "high" : intel.score.transitionReadiness < 80 ? "medium" : "low",
        topGaps,
        claimStatus: intel.claimStatus?.stage ?? "preparing"
      }
    ]
  });
}
