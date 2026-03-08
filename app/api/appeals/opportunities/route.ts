import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildUserIntelligenceAsync } from "@/services/intelligence/user-intelligence-service";

const schema = z.object({ userId: z.string().min(5) });

export async function GET(request: NextRequest) {
  const parsed = schema.safeParse({ userId: request.nextUrl.searchParams.get("userId") });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });

  const intel = await buildUserIntelligenceAsync(parsed.data.userId);

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
}
