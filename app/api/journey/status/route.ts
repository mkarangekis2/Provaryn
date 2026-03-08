import { NextRequest, NextResponse } from "next/server";
import { requireAuthorizedQueryUser } from "@/lib/auth/request-user";
import { buildJourneyStatus } from "@/services/journey/mission-stage-service";

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  try {
    const journey = await buildJourneyStatus(auth.userId);
    return NextResponse.json({ ok: true, journey });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to build journey status" },
      { status: 500 }
    );
  }
}
