import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthorizedQueryUser, requireAuthorizedUser } from "@/lib/auth/request-user";
import {
  listAIRecommendationQueueSupabase,
  updateAIRecommendationStatusSupabase
} from "@/server/persistence/supabase-ai";
import { addAuditEntrySupabase } from "@/server/persistence/supabase-settings";

const updateSchema = z.object({
  userId: z.string().uuid(),
  recommendationId: z.string().uuid(),
  status: z.enum(["confirmed", "rejected"])
});

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  try {
    const queue = await listAIRecommendationQueueSupabase(auth.userId);
    return NextResponse.json({ ok: true, queue });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load AI recommendation queue" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = updateSchema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;

  try {
    await updateAIRecommendationStatusSupabase({
      userId: auth.userId,
      recommendationId: body.recommendationId,
      status: body.status
    });
    await addAuditEntrySupabase({
      userId: auth.userId,
      action: `ai_recommendation_${body.status}`,
      category: "ai",
      metadata: { recommendationId: body.recommendationId }
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to update recommendation status" },
      { status: 500 }
    );
  }
}
