import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { isUuid } from "@/server/persistence/ids";
import type { AppRole } from "@/types/domain";

const elevatedRoles: AppRole[] = ["coach", "program_admin", "system_admin"];

export async function hasAnyRole(userId: string, roles: AppRole[]) {
  if (!isUuid(userId) || roles.length === 0) return false;
  const supabase = createServiceSupabaseClient();
  const result = await supabase.from("roles").select("role").eq("user_id", userId).in("role", roles).limit(1);
  if (result.error) return false;
  return (result.data?.length ?? 0) > 0;
}

export async function canAccessUserScope(requesterUserId: string, subjectUserId: string) {
  if (requesterUserId === subjectUserId) return true;
  if (!isUuid(requesterUserId) || !isUuid(subjectUserId)) return false;

  const supabase = createServiceSupabaseClient();

  const directCoachRel = await supabase
    .from("coach_relationships")
    .select("id")
    .eq("coach_id", requesterUserId)
    .eq("user_id", subjectUserId)
    .eq("status", "active")
    .limit(1);
  if (!directCoachRel.error && (directCoachRel.data?.length ?? 0) > 0) return true;

  const explicitGrant = await supabase
    .from("access_grants")
    .select("id")
    .eq("grantee_user_id", requesterUserId)
    .eq("granter_user_id", subjectUserId)
    .eq("active", true)
    .limit(1);
  if (!explicitGrant.error && (explicitGrant.data?.length ?? 0) > 0) return true;

  const requesterRoles = await supabase
    .from("roles")
    .select("role")
    .eq("user_id", requesterUserId)
    .in("role", elevatedRoles);

  if (!requesterRoles.error) {
    const roleSet = new Set((requesterRoles.data ?? []).map((row) => row.role as AppRole));
    if (roleSet.has("system_admin")) return true;
    if (roleSet.has("program_admin")) {
      const subjectOrgs = await supabase
        .from("organization_memberships")
        .select("organization_id")
        .eq("user_id", subjectUserId);
      if (!subjectOrgs.error) {
        const orgIds = (subjectOrgs.data ?? []).map((row) => row.organization_id);
        if (orgIds.length > 0) {
          const adminMembership = await supabase
            .from("organization_memberships")
            .select("id")
            .eq("user_id", requesterUserId)
            .in("organization_id", orgIds)
            .in("role", ["program_admin", "system_admin"])
            .limit(1);
          if (!adminMembership.error && (adminMembership.data?.length ?? 0) > 0) return true;
        }
      }
    }
  }

  return false;
}
