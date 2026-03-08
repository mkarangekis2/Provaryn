import { NextRequest, NextResponse } from "next/server";
import { buildUserIntelligenceAsync } from "@/services/intelligence/user-intelligence-service";
import { listAITraceRecordsSupabase, listAuditEntriesSupabase } from "@/server/persistence/supabase-settings";
import { listAIRecommendationQueueSupabase } from "@/server/persistence/supabase-ai";
import { requireAuthorizedQueryUser } from "@/lib/auth/request-user";

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  try {
    const [intel, aiRuns, auditLogs, reviewQueue] = await Promise.all([
      buildUserIntelligenceAsync(auth.userId),
      listAITraceRecordsSupabase(auth.userId),
      listAuditEntriesSupabase(auth.userId),
      listAIRecommendationQueueSupabase(auth.userId)
    ]);

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
          missingPieces: c.diagnosisStatus === "missing" ? ["Diagnosis confirmation"] : [],
          rationale: c.evidenceSignals[0] ?? "Pattern-based condition signal detected."
        })),
        aiTrace: aiRuns.map((run) => ({
          id: run.id,
          runType: run.runType,
          promptVersion: run.promptVersion ?? "unknown",
          model: run.model ?? process.env.OPENAI_MODEL ?? "gpt-4.1",
          confidence: run.confidence ?? 0.5,
          createdAt: run.createdAt,
          keys: Object.keys(run.output).slice(0, 8)
        })),
        aiAuditActions: auditLogs
          .filter((entry) => entry.category === "ai")
          .slice(0, 10)
          .map((entry) => ({
            id: entry.id,
            action: entry.action,
            createdAt: entry.createdAt
          })),
        reviewQueue: reviewQueue.map((item) => ({
          id: item.id,
          recommendationType: item.recommendationType,
          status: item.status,
          requiresConfirmation: item.requiresConfirmation,
          confidence: item.confidence,
          deterministicScore: item.deterministicScore,
          createdAt: item.createdAt,
          resolvedAt: item.resolvedAt
        })),
        limitations: [
          "AI outputs are assistive recommendations, not legal or medical advice.",
          "Final VA determinations depend on official review and complete records."
        ]
      }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load AI transparency data" },
      { status: 500 }
    );
  }
}
