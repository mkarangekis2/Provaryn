import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildUserIntelligenceAsync } from "@/services/intelligence/user-intelligence-service";
import { requireAuthorizedUser } from "@/lib/auth/request-user";

const schema = z.object({ userId: z.string().min(5), state: z.string().optional() });

const baseBenefits = [
  { title: "Property Tax Relief", category: "Tax", state: "TX", minReadiness: 0 },
  { title: "Education Support Programs", category: "Education", state: "CA", minReadiness: 0 },
  { title: "Healthcare Enrollment Guidance", category: "Healthcare", state: "ALL", minReadiness: 40 },
  { title: "Family/Dependent Benefit Pathways", category: "Family", state: "ALL", minReadiness: 50 },
  { title: "Mobility/Adaptive Support", category: "Support", state: "ALL", minReadiness: 60 }
];

export async function GET(request: NextRequest) {
  const parsed = schema.safeParse({
    userId: request.nextUrl.searchParams.get("userId"),
    state: request.nextUrl.searchParams.get("state") ?? undefined
  });

  if (!parsed.success) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });
  const auth = await requireAuthorizedUser(request, parsed.data.userId);
  if (!auth.ok) return auth.response;

  try {
    const intel = await buildUserIntelligenceAsync(auth.userId);
    const state = parsed.data.state ?? "ALL";

    const matches = baseBenefits
      .filter((b) => (b.state === "ALL" || b.state === state) && intel.score.overall >= b.minReadiness)
      .map((b) => ({ ...b, eligibilityConfidence: Math.min(0.95, 0.45 + intel.score.overall / 200) }));

    return NextResponse.json({ ok: true, matches, state });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load benefit matches" },
      { status: 500 }
    );
  }
}
