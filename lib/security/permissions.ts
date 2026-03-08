import type { AppRole } from "@/types/domain";

export function canViewCoachData(role: AppRole) {
  return role === "coach" || role === "program_admin" || role === "system_admin";
}

export function canManageOrg(role: AppRole) {
  return role === "program_admin" || role === "system_admin";
}

export function canAccessSensitiveAudit(role: AppRole) {
  return role === "system_admin";
}
