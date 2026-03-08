import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiServices } from "@/ai/services";
import { prompts } from "@/ai/prompts";
import { requireAuthorizedUser } from "@/lib/auth/request-user";
import { persistAIRecommendation } from "@/services/ai/recommendation-persistence-service";

const schema = z.object({ userId: z.string().min(5), text: z.string().min(1) });

export async function POST(request: NextRequest) {
  const body = schema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;

  const result = await aiServices.documentExtractionService({ text: body.text });
  const missingItems =
    (result.data.provider ? 0 : 1) +
    (result.data.encounterDate ? 0 : 1) +
    (result.data.diagnoses.length > 0 ? 0 : 1);
  const evidenceSignals = result.data.diagnoses.length + result.data.symptoms.length + result.data.limitations.length;

  const persisted = await persistAIRecommendation({
    userId: auth.userId,
    runType: "document_extraction",
    promptVersion: prompts.documentExtraction.version,
    recommendationType: "document_extraction",
    model: result.model,
    llmConfidence: result.data.confidence ?? result.confidence,
    payload: result.data as unknown as Record<string, unknown>,
    inputPayload: { textLength: body.text.length },
    evidenceSignals,
    missingItems,
    explanation: {
      whatDetected: `Diagnoses:${result.data.diagnoses.length}, symptoms:${result.data.symptoms.length}`,
      whyItMatters: "Structured extraction must be reviewed before becoming claim evidence.",
      evidenceUsed: body.text.slice(0, 240),
      missingItems: [
        result.data.provider ? null : "Provider missing",
        result.data.encounterDate ? null : "Encounter date missing",
        result.data.diagnoses.length > 0 ? null : "Diagnosis list missing"
      ]
        .filter(Boolean)
        .join(", "),
      actionRecommended: "Confirm extracted fields before linking to conditions."
    }
  });

  return NextResponse.json({ ...result, reliability: persisted.reliability, recommendationId: persisted.recommendationId });
}
