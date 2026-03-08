import { NextRequest, NextResponse } from "next/server";
import { requireAuthorizedQueryUser } from "@/lib/auth/request-user";
import { buildJourneyStatus } from "@/services/journey/mission-stage-service";

type DefectRecord = {
  defectType: string;
  description: string;
  impact: "low" | "medium" | "high";
  route: string;
  estimatedDaysToFix: number;
  frequency: number;
};

const impactWeight = { low: 1, medium: 2, high: 3 } as const;

function etaFor(defectType: string) {
  if (defectType === "missing_diagnosis") return 21;
  if (defectType === "missing_specialist_evidence") return 14;
  if (defectType === "missing_event_linkage") return 7;
  return 5;
}

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  try {
    const journey = await buildJourneyStatus(auth.userId);
    const defects: DefectRecord[] = journey.defects.map((defect) => ({
      defectType: defect.type,
      description: defect.label,
      impact: defect.impact,
      route: defect.route,
      estimatedDaysToFix: etaFor(defect.type),
      frequency: impactWeight[defect.impact]
    }));

    const pareto = defects
      .map((defect) => ({
        ...defect,
        weightedImpact: defect.frequency * impactWeight[defect.impact]
      }))
      .sort((a, b) => b.weightedImpact - a.weightedImpact);

    return NextResponse.json({
      ok: true,
      summary: {
        totalDefects: defects.length,
        highImpact: defects.filter((d) => d.impact === "high").length,
        avgDaysToFix:
          defects.length === 0
            ? 0
            : Math.round(defects.reduce((sum, item) => sum + item.estimatedDaysToFix, 0) / defects.length)
      },
      defects,
      pareto
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load defect dashboard" },
      { status: 500 }
    );
  }
}
