import { NextRequest, NextResponse } from "next/server";
import { buildUserIntelligenceAsync } from "@/services/intelligence/user-intelligence-service";
import { requireAuthorizedQueryUser } from "@/lib/auth/request-user";

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  const intel = await buildUserIntelligenceAsync(auth.userId);

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
