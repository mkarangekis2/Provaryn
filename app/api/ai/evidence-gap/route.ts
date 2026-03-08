import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiServices } from "@/ai/services";
import { requireAuthorizedUser } from "@/lib/auth/request-user";

const schema = z.object({ userId: z.string().min(5), condition: z.string(), evidenceSummary: z.string() });

export async function POST(request: NextRequest) {
  const body = schema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;
  const result = await aiServices.evidenceGapService({ condition: body.condition, evidenceSummary: body.evidenceSummary });
  return NextResponse.json(result);
}
