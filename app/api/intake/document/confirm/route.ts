import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { upsertDocumentExtraction } from "@/server/mock/store";
import { upsertDocumentExtractionSupabase } from "@/server/persistence/supabase-intake";
import { requireAuthorizedUser } from "@/lib/auth/request-user";

const schema = z.object({
  userId: z.string().min(5),
  documentId: z.string().uuid(),
  extracted: z.object({
    provider: z.string().optional(),
    facility: z.string().optional(),
    encounterDate: z.string().optional(),
    diagnoses: z.array(z.string()),
    symptoms: z.array(z.string()),
    medications: z.array(z.string()),
    limitations: z.array(z.string()),
    conditionTags: z.array(z.string()),
    confidence: z.number().min(0).max(1)
  })
});

export async function POST(request: NextRequest) {
  const body = schema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;
  const userId = auth.userId;
  let saved: ReturnType<typeof upsertDocumentExtraction>;
  try {
    const supabaseSaved = await upsertDocumentExtractionSupabase({
      documentId: body.documentId,
      extracted: body.extracted,
      status: "confirmed"
    });
    saved = { ...supabaseSaved, userId };
  } catch {
    saved = upsertDocumentExtraction({
      documentId: body.documentId,
      userId,
      extracted: body.extracted,
      status: "confirmed",
      updatedAt: new Date().toISOString()
    });
  }

  return NextResponse.json({ ok: true, extraction: saved });
}
