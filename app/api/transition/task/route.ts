import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateTransitionTaskSupabase } from "@/server/persistence/supabase-transition-claims";
import { requireAuthorizedUser } from "@/lib/auth/request-user";

const schema = z.object({
  userId: z.string().min(5),
  taskId: z.string().uuid(),
  completed: z.boolean()
});

export async function POST(request: NextRequest) {
  const body = schema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;
  try {
    const plan = await updateTransitionTaskSupabase(auth.userId, body.taskId, body.completed);
    if (!plan) return NextResponse.json({ ok: false, error: "Transition plan not found" }, { status: 404 });
    return NextResponse.json({ ok: true, plan });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to update transition task" },
      { status: 500 }
    );
  }
}
