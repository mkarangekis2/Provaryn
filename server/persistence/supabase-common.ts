import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { isUuid } from "@/server/persistence/ids";

export async function ensureSupabaseProfile(userId: string) {
  if (!isUuid(userId)) throw new Error("non_uuid_user_id");

  const supabase = createServiceSupabaseClient();
  const userResult = await supabase.auth.admin.getUserById(userId);
  if (userResult.error || !userResult.data.user) {
    throw new Error("auth_user_not_found");
  }

  const user = userResult.data.user;
  const upsert = await supabase.from("profiles").upsert(
    {
      id: userId,
      email: user.email ?? null,
      full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
      avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  if (upsert.error) throw upsert.error;
}
