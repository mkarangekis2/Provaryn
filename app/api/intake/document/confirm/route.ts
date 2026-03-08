import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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
  try {
    const supabaseSaved = await upsertDocumentExtractionSupabase({
      documentId: body.documentId,
      extracted: body.extracted,
      status: "confirmed"
    });
    return NextResponse.json({ ok: true, extraction: { ...supabaseSaved, userId } });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to confirm extraction" },
      { status: 500 }
    );
  }
}
