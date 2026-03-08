import { HomeDashboard } from "@/features/dashboard/home-dashboard";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect("/login");
  }

  const serviceClient = createServiceSupabaseClient();
  const profileResult = await serviceClient
    .from("service_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profileResult.data) {
    redirect("/onboarding");
  }

  return <HomeDashboard />;
}
