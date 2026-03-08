import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildUserIntelligenceAsync } from "@/services/intelligence/user-intelligence-service";

const schema = z.object({ userId: z.string().min(5) });

export async function GET(request: NextRequest) {
  const parsed = schema.safeParse({ userId: request.nextUrl.searchParams.get("userId") });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });

  const intel = await buildUserIntelligenceAsync(parsed.data.userId);

  return NextResponse.json({
    ok: true,
    transparency: {
      model: process.env.OPENAI_MODEL ?? "gpt-4.1",
      confidenceInputs: {
        conditionsDetected: intel.conditions.length,
        symptomSignals: intel.snapshot.counts.symptomEntries,
        evidenceSignals: intel.snapshot.counts.documents,
        eventSignals: intel.snapshot.counts.events
      },
      recommendationBasis: intel.conditions.slice(0, 4).map((c) => ({
        condition: c.label,
        confidence: c.confidence,
        evidenceSignals: c.evidenceSignals,
        missingPieces: c.diagnosisStatus === "missing" ? ["Diagnosis confirmation"] : []
      })),
      limitations: [
        "AI outputs are assistive recommendations, not legal or medical advice.",
        "Final VA determinations depend on official review and complete records."
      ]
    }
  });
}
