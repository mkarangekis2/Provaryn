import { NextRequest, NextResponse } from "next/server";
import { buildUserIntelligenceAsync } from "@/services/intelligence/user-intelligence-service";
import { requireAuthorizedQueryUser } from "@/lib/auth/request-user";

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  try {
    const intel = await buildUserIntelligenceAsync(auth.userId);

    const opportunities = intel.conditions
      .filter((c) => c.readiness >= 45)
      .map((c) => ({
        condition: c.label,
        type: c.readiness >= 75 ? "increase_opportunity" : c.diagnosisStatus === "missing" ? "appeal_prep" : "secondary_candidate",
        rationale:
          c.readiness >= 75
            ? "Strong evidence maturity suggests potential rating optimization."
            : c.diagnosisStatus === "missing"
            ? "Develop diagnosis and specialist documentation for appeal strength."
            : "Condition signals support additional secondary review.",
        priority: c.urgency === "high" ? 5 : c.urgency === "medium" ? 3 : 2
      }))
      .sort((a, b) => b.priority - a.priority);

    return NextResponse.json({ ok: true, opportunities });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load appeal opportunities" },
      { status: 500 }
    );
  }
}
