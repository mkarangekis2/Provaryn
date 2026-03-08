import { AdminDashboardPanel } from "@/features/admin/admin-dashboard-panel";
import { RoleGate } from "@/features/auth/role-gate";

export default function AdminPage() {
  return (
    <RoleGate allow={["program_admin", "system_admin"]} title="Program Admin Dashboard">
      <AdminDashboardPanel />
    </RoleGate>
  );
}
