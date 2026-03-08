import { NextRequest, NextResponse } from "next/server";
import { buildUserIntelligenceAsync } from "@/services/intelligence/user-intelligence-service";
import { hasAnyRole } from "@/lib/auth/access-scope";
import { requireAuthorizedQueryUser } from "@/lib/auth/request-user";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

async function getAdminScopedUserIds(userId: string) {
  const supabase = createServiceSupabaseClient();
  const isSystemAdmin = await hasAnyRole(userId, ["system_admin"]);
  if (isSystemAdmin) {
    const allProfiles = await supabase.from("profiles").select("id").limit(100);
    if (allProfiles.error) return [userId];
    return Array.from(new Set(allProfiles.data.map((row) => row.id)));
  }

  const memberships = await supabase
    .from("organization_memberships")
    .select("organization_id")
    .eq("user_id", userId)
    .in("role", ["program_admin", "system_admin"]);
  if (memberships.error) return [userId];
  const orgIds = memberships.data.map((row) => row.organization_id);
  if (orgIds.length === 0) return [userId];

  const orgMembers = await supabase
    .from("organization_memberships")
    .select("user_id")
    .in("organization_id", orgIds);
  if (orgMembers.error) return [userId];
  return Array.from(new Set(orgMembers.data.map((row) => row.user_id)));
}

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  const canViewAdminScope = await hasAnyRole(auth.userId, ["program_admin", "system_admin"]);
  if (!canViewAdminScope) {
    return NextResponse.json({ ok: false, error: "Insufficient role for admin dashboard" }, { status: 403 });
  }

  try {
    const scopedUsers = await getAdminScopedUserIds(auth.userId);
    const intelligence = await Promise.all(scopedUsers.map((userId) => buildUserIntelligenceAsync(userId)));
    const participantCount = intelligence.length;
    const avgReadiness = participantCount > 0
      ? Math.round(intelligence.reduce((sum, row) => sum + row.score.overall, 0) / participantCount)
      : 0;
    const atRiskCount = intelligence.filter((row) => row.score.transitionReadiness < 65).length;
    const transitionsSoon = intelligence.filter((row) => row.score.transitionReadiness < 70).length;
    const readinessDistribution = {
      low: intelligence.filter((row) => row.score.overall < 60).length,
      medium: intelligence.filter((row) => row.score.overall >= 60 && row.score.overall < 80).length,
      high: intelligence.filter((row) => row.score.overall >= 80).length
    };
    const usersNeedingIntervention = intelligence
      .filter((row) => row.score.overall < 65 || row.score.transitionReadiness < 65)
      .slice(0, 10)
      .map((row) => ({
        userId: row.userId,
        readiness: row.score.overall,
        transitionReadiness: row.score.transitionReadiness,
        topCondition: row.conditions[0]?.label ?? "No condition data"
      }));

    const totalTimeline = intelligence.reduce((sum, row) => sum + row.snapshot.counts.timelineEntries, 0);
    const totalCheckIns = intelligence.reduce((sum, row) => sum + row.snapshot.counts.checkIns, 0);
    const totalDocuments = intelligence.reduce((sum, row) => sum + row.snapshot.counts.documents, 0);
    const checkInCadence = participantCount > 0 ? Math.min(100, Math.round((totalCheckIns / participantCount) * 12)) : 0;
    const onboardingCompletion = participantCount > 0 ? Math.min(100, Math.round((totalTimeline / participantCount) * 20)) : 0;
    const evidenceCoverage = participantCount > 0 ? Math.min(100, Math.round((totalDocuments / participantCount) * 20)) : 0;

    return NextResponse.json({
      ok: true,
      cohort: {
        participantCount,
        avgReadiness,
        atRiskCount,
        transitionsSoon,
        readinessDistribution,
        usersNeedingIntervention,
        completionMetrics: {
          onboardingCompletion,
          checkInCadence,
          evidenceCoverage
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
