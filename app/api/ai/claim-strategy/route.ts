import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiServices } from "@/ai/services";

const schema = z.object({ readiness: z.number(), conditions: z.array(z.string()), blockers: z.array(z.string()) });

export async function POST(request: NextRequest) {
  const body = schema.parse(await request.json());
  const result = await aiServices.claimStrategyService(body);
  return NextResponse.json(result);
}
