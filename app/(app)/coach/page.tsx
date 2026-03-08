import { CoachDashboardPanel } from "@/features/coach/coach-dashboard-panel";
import { RoleGate } from "@/features/auth/role-gate";

export default function CoachPage() {
  return (
    <RoleGate allow={["coach", "program_admin", "system_admin"]} title="Coach Dashboard">
      <CoachDashboardPanel />
    </RoleGate>
  );
}
