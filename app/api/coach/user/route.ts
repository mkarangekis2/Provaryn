import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildUserIntelligenceAsync } from "@/services/intelligence/user-intelligence-service";

const schema = z.object({ userId: z.string().min(5), subjectUserId: z.string().min(5) });

export async function GET(request: NextRequest) {
  const parsed = schema.safeParse({
    userId: request.nextUrl.searchParams.get("userId"),
    subjectUserId: request.nextUrl.searchParams.get("subjectUserId")
  });

  if (!parsed.success) return NextResponse.json({ ok: false, error: "userId and subjectUserId required" }, { status: 400 });

  const intel = await buildUserIntelligenceAsync(parsed.data.subjectUserId);

  return NextResponse.json({
    ok: true,
    user: {
      id: parsed.data.subjectUserId,
      readiness: intel.score,
      conditionCount: intel.conditions.length,
      urgentConditions: intel.conditions.filter((c) => c.urgency === "high"),
      recommendations: intel.conditions
        .filter((c) => c.readiness < 65 || c.diagnosisStatus === "missing")
        .slice(0, 5)
        .map((c) => `Coach follow-up: ${c.label} requires ${c.diagnosisStatus === "missing" ? "diagnosis confirmation" : "evidence strengthening"}`)
    }
  });
}
