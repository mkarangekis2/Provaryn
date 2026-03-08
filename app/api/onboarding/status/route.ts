import { NextRequest, NextResponse } from "next/server";
import { requireAuthorizedQueryUser } from "@/lib/auth/request-user";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  try {
    const supabase = createServiceSupabaseClient();
    const result = await supabase
      .from("service_profiles")
      .select("user_id")
      .eq("user_id", auth.userId)
      .maybeSingle();

    return NextResponse.json({ ok: true, hasServiceProfile: Boolean(result.data) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load onboarding status" },
      { status: 500 }
    );
  }
}
