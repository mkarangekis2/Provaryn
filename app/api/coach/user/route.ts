import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildUserIntelligenceAsync } from "@/services/intelligence/user-intelligence-service";
import { canAccessUserScope, hasAnyRole } from "@/lib/auth/access-scope";
import { requireAuthorizedUser } from "@/lib/auth/request-user";

const schema = z.object({ userId: z.string().min(5), subjectUserId: z.string().min(5) });

export async function GET(request: NextRequest) {
  const parsed = schema.safeParse({
    userId: request.nextUrl.searchParams.get("userId"),
    subjectUserId: request.nextUrl.searchParams.get("subjectUserId")
  });

  if (!parsed.success) return NextResponse.json({ ok: false, error: "userId and subjectUserId required" }, { status: 400 });
  const auth = await requireAuthorizedUser(request, parsed.data.userId);
  if (!auth.ok) return auth.response;

  const canViewCoachScope = await hasAnyRole(auth.userId, ["coach", "program_admin", "system_admin"]);
  if (!canViewCoachScope) {
    return NextResponse.json({ ok: false, error: "Insufficient role for coach access" }, { status: 403 });
  }

  const canAccessSubject = await canAccessUserScope(auth.userId, parsed.data.subjectUserId);
  if (!canAccessSubject) {
    return NextResponse.json({ ok: false, error: "Access denied for requested user scope" }, { status: 403 });
  }

  try {
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
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load coach user detail" },
      { status: 500 }
    );
  }
}
