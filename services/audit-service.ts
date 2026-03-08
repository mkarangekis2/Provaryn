import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function createAuditLog(input: {
  actorUserId?: string;
  targetUserId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("audit_logs").insert({
    actor_user_id: input.actorUserId ?? null,
    target_user_id: input.targetUserId ?? null,
    action: input.action,
    resource_type: input.resourceType ?? null,
    resource_id: input.resourceId ?? null,
    metadata: input.metadata ?? {}
  });

  if (error) throw error;
}
