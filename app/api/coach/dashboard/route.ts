import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildUserIntelligenceAsync } from "@/services/intelligence/user-intelligence-service";

const schema = z.object({ userId: z.string().min(5) });

export async function GET(request: NextRequest) {
  const parsed = schema.safeParse({ userId: request.nextUrl.searchParams.get("userId") });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });

  const intel = await buildUserIntelligenceAsync(parsed.data.userId);
  const topGaps = intel.conditions
    .filter((c) => c.diagnosisStatus === "missing" || c.readiness < 60)
    .slice(0, 4)
    .map((c) => `${c.label}: ${c.diagnosisStatus === "missing" ? "diagnosis gap" : "readiness gap"}`);

  return NextResponse.json({
    ok: true,
    users: [
      {
        id: parsed.data.userId,
        displayName: "Primary User",
        readiness: intel.score.overall,
        transitionRisk: intel.score.transitionReadiness < 65 ? "high" : intel.score.transitionReadiness < 80 ? "medium" : "low",
        topGaps,
        claimStatus: intel.claimStatus?.stage ?? "preparing"
      }
    ]
  });
}
