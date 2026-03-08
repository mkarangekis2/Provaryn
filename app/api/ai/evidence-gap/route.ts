import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiServices } from "@/ai/services";
import { prompts } from "@/ai/prompts";
import { requireAuthorizedUser } from "@/lib/auth/request-user";
import { persistAIRecommendation } from "@/services/ai/recommendation-persistence-service";

const schema = z.object({ userId: z.string().min(5), condition: z.string(), evidenceSummary: z.string() });

export async function POST(request: NextRequest) {
  const body = schema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;

  const result = await aiServices.evidenceGapService({ condition: body.condition, evidenceSummary: body.evidenceSummary });
  const missingItems = result.data.missingItems.length;
  const persisted = await persistAIRecommendation({
    userId: auth.userId,
    runType: "evidence_gap",
    promptVersion: prompts.evidenceGap.version,
    recommendationType: "evidence_gap",
    model: result.model,
    llmConfidence: result.data.confidence ?? result.confidence,
    payload: result.data as unknown as Record<string, unknown>,
    inputPayload: {
      condition: body.condition,
      evidenceSummaryLength: body.evidenceSummary.length
    },
    evidenceSignals: Math.max(1, body.evidenceSummary.split(/\s+/).length > 50 ? 4 : 2),
    missingItems,
    explanation: {
      whatDetected: body.condition,
      whyItMatters: "Missing items reduce claim strength and readiness progression.",
      evidenceUsed: body.evidenceSummary.slice(0, 240),
      missingItems: result.data.missingItems.join(", "),
      actionRecommended: result.data.explanation
    }
  });

  return NextResponse.json({ ...result, reliability: persisted.reliability, recommendationId: persisted.recommendationId });
}
