import { createClient } from "@supabase/supabase-js";
import { env, requireServerEnv } from "@/lib/env";

export function createServiceSupabaseClient() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL missing");
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
