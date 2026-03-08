import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateClaimReadiness } from "@/services/readiness-service";

const schema = z.object({
  symptomLogCount: z.number().int().nonnegative(),
  diagnosisCount: z.number().int().nonnegative(),
  serviceEventsLinked: z.number().int().nonnegative(),
  exposureLinks: z.number().int().nonnegative(),
  documentCount: z.number().int().nonnegative(),
  narrativeCount: z.number().int().nonnegative(),
  specialistEvaluations: z.number().int().nonnegative()
});

export async function POST(request: NextRequest) {
  const body = schema.parse(await request.json());
  return NextResponse.json(calculateClaimReadiness(body));
}
