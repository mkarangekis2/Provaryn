import { CoachUserDetailPanel } from "@/features/coach/coach-user-detail-panel";

export default async function CoachUserDetailPage({
  params
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <CoachUserDetailPanel subjectUserId={userId} />;
}
