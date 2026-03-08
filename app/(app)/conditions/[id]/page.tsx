import { ConditionDetailPanel } from "@/features/conditions/condition-detail-panel";

export default async function ConditionDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ConditionDetailPanel conditionId={id} />;
}
