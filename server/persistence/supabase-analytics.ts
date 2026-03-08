import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { ensureSupabaseProfile } from "@/server/persistence/supabase-common";

export async function addAnalyticsEventSupabase(input: {
  id: string;
  userId?: string;
  name: string;
  payload: Record<string, unknown>;
  createdAt: string;
}) {
  const supabase = createServiceSupabaseClient();

  if (input.userId) {
    await ensureSupabaseProfile(input.userId);
  }

  const result = await supabase
    .from("analytics_events")
    .insert({
      id: input.id,
      user_id: input.userId ?? null,
      event_name: input.name,
      payload: input.payload,
      created_at: input.createdAt
    })
    .select("id, user_id, event_name, payload, created_at")
    .single();

  if (result.error) throw result.error;

  return {
    id: result.data.id,
    userId: result.data.user_id ?? undefined,
    name: result.data.event_name,
    payload: (result.data.payload as Record<string, unknown>) ?? {},
    createdAt: result.data.created_at
  };
}
