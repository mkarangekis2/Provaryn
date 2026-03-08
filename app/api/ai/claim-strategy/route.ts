import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiServices } from "@/ai/services";
import { prompts } from "@/ai/prompts";
import { requireAuthorizedUser } from "@/lib/auth/request-user";
import { persistAIRecommendation } from "@/services/ai/recommendation-persistence-service";

const schema = z.object({
  userId: z.string().min(5),
  readiness: z.number(),
  conditions: z.array(z.string()),
  blockers: z.array(z.string())
});

export async function POST(request: NextRequest) {
  const body = schema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;

  const result = await aiServices.claimStrategyService({
    readiness: body.readiness,
    conditions: body.conditions,
    blockers: body.blockers
  });
  const persisted = await persistAIRecommendation({
    userId: auth.userId,
    runType: "claim_strategy",
    promptVersion: prompts.claimStrategy.version,
    recommendationType: "claim_strategy",
    model: result.model,
    llmConfidence: result.data.confidence ?? result.confidence,
    payload: result.data as unknown as Record<string, unknown>,
    inputPayload: {
      readiness: body.readiness,
      conditions: body.conditions,
      blockers: body.blockers
    },
    evidenceSignals: body.conditions.length,
    missingItems: body.blockers.length,
    explanation: {
      whatDetected: `Detected ${body.conditions.length} conditions with ${body.blockers.length} blockers.`,
      whyItMatters: "Claim sequencing quality depends on readiness and blocker closure.",
      evidenceUsed: body.conditions.slice(0, 8).join(", "),
      missingItems: body.blockers.slice(0, 8).join(", "),
      actionRecommended: result.data.rationale
    }
  });

  return NextResponse.json({ ...result, reliability: persisted.reliability, recommendationId: persisted.recommendationId });
}
