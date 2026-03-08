import { describe, it, expect } from "vitest";
import { canAccessSensitiveAudit, canManageOrg, canViewCoachData } from "@/lib/security/permissions";

describe("permissions", () => {
  it("enforces role capability rules", () => {
    expect(canViewCoachData("coach")).toBe(true);
    expect(canViewCoachData("user")).toBe(false);
    expect(canManageOrg("program_admin")).toBe(true);
    expect(canAccessSensitiveAudit("system_admin")).toBe(true);
  });
});
