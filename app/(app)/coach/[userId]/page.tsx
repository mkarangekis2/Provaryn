import { CoachUserDetailPanel } from "@/features/coach/coach-user-detail-panel";
import { RoleGate } from "@/features/auth/role-gate";

export default async function CoachUserDetailPage({
  params
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return (
    <RoleGate allow={["coach", "program_admin", "system_admin"]} title="Coach User Detail">
      <CoachUserDetailPanel subjectUserId={userId} />
    </RoleGate>
  );
}
