import { NextRequest, NextResponse } from "next/server";
import { requireAuthorizedQueryUser } from "@/lib/auth/request-user";
import { getTransitionPlanSupabase } from "@/server/persistence/supabase-transition-claims";

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  try {
    const plan = await getTransitionPlanSupabase(auth.userId);
    const tasks = (plan?.tasks ?? []).sort((a, b) => (b.impactScore ?? 50) - (a.impactScore ?? 50));
    return NextResponse.json({
      ok: true,
      queue: {
        owner: auth.userId,
        completion: tasks.length === 0 ? 0 : Math.round((tasks.filter((task) => task.completed).length / tasks.length) * 100),
        tasks
      }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load action queue" },
      { status: 500 }
    );
  }
}
