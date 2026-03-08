import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiServices } from "@/ai/services";

const schema = z.object({ condition: z.string(), evidenceSummary: z.string() });

export async function POST(request: NextRequest) {
  const body = schema.parse(await request.json());
  const result = await aiServices.evidenceGapService(body);
  return NextResponse.json(result);
}
