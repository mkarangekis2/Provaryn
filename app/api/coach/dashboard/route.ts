import { NextRequest, NextResponse } from "next/server";
import { buildUserIntelligenceAsync } from "@/services/intelligence/user-intelligence-service";
import { hasAnyRole } from "@/lib/auth/access-scope";
import { requireAuthorizedQueryUser } from "@/lib/auth/request-user";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

async function getScopedCoachUserIds(userId: string) {
  const supabase = createServiceSupabaseClient();
  const relationships = await supabase
    .from("coach_relationships")
    .select("user_id")
    .eq("coach_id", userId)
    .eq("status", "active");
  if (relationships.error) return [userId];
  const ids = relationships.data.map((row) => row.user_id);
  return Array.from(new Set([userId, ...ids]));
}

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  const canViewCoachScope = await hasAnyRole(auth.userId, ["coach", "program_admin", "system_admin"]);
  if (!canViewCoachScope) {
    return NextResponse.json({ ok: false, error: "Insufficient role for coach dashboard" }, { status: 403 });
  }

  try {
    const scopedUsers = await getScopedCoachUserIds(auth.userId);
    const intelRows = await Promise.all(scopedUsers.map((userId) => buildUserIntelligenceAsync(userId)));
    const users = intelRows.map((intel) => {
      const topGaps = intel.conditions
        .filter((c) => c.diagnosisStatus === "missing" || c.readiness < 60)
        .slice(0, 4)
        .map((c) => `${c.label}: ${c.diagnosisStatus === "missing" ? "diagnosis gap" : "readiness gap"}`);
      return {
        id: intel.userId,
        displayName: intel.userId === auth.userId ? "Primary User" : `Assigned User ${intel.userId.slice(0, 8)}`,
        readiness: intel.score.overall,
        transitionRisk: intel.score.transitionReadiness < 65 ? "high" : intel.score.transitionReadiness < 80 ? "medium" : "low",
        topGaps,
        claimStatus: intel.claimStatus?.stage ?? "preparing"
      };
    });
    const usersAtRisk = users.filter((row) => row.transitionRisk === "high").length;

    return NextResponse.json({
      ok: true,
      users,
      summary: {
        assignedCount: users.length,
        usersAtRisk,
        avgReadiness: users.length > 0 ? Math.round(users.reduce((sum, row) => sum + row.readiness, 0) / users.length) : 0
      }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load coach dashboard" },
      { status: 500 }
    );
  }
}
