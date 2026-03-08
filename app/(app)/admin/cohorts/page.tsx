import { CohortManagementPanel } from "@/features/admin/cohort-management-panel";
import { RoleGate } from "@/features/auth/role-gate";

export default function AdminCohortsPage() {
  return (
    <RoleGate allow={["program_admin", "system_admin"]} title="Program & Cohort Management">
      <CohortManagementPanel />
    </RoleGate>
  );
}
