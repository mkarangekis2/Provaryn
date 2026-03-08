import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiServices } from "@/ai/services";

const schema = z.object({ text: z.string().min(1) });

export async function POST(request: NextRequest) {
  const body = schema.parse(await request.json());
  const result = await aiServices.documentExtractionService(body);
  return NextResponse.json(result);
}
