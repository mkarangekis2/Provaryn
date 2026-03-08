import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiServices } from "@/ai/services";
import {
  getDocumentExtractionSupabase,
  getDocumentSupabase,
  upsertDocumentExtractionSupabase
} from "@/server/persistence/supabase-intake";
import { requireAuthorizedUser } from "@/lib/auth/request-user";

const schema = z.object({
  userId: z.string().min(5),
  documentId: z.string().uuid()
});

function fallbackExtraction(text: string) {
  const lowered = text.toLowerCase();
  const hasBackPain = lowered.includes("back") || lowered.includes("lumbar");
  const hasHeadache = lowered.includes("headache");
  const hasTinnitus = lowered.includes("tinnitus") || lowered.includes("ringing");

  return {
    provider: undefined,
    facility: undefined,
    encounterDate: undefined,
    diagnoses: hasBackPain ? ["Lumbar strain"] : [],
    symptoms: [hasBackPain ? "Back pain" : "", hasHeadache ? "Headaches" : "", hasTinnitus ? "Tinnitus" : ""].filter(Boolean),
    medications: [],
    limitations: [],
    conditionTags: [hasBackPain ? "musculoskeletal" : "", hasHeadache ? "neurological" : "", hasTinnitus ? "hearing" : ""].filter(Boolean),
    confidence: 0.42
  };
}

export async function POST(request: NextRequest) {
  const body = schema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;
  const userId = auth.userId;
  try {
    const existingSupabase = await getDocumentExtractionSupabase(body.documentId);
    if (existingSupabase) {
      return NextResponse.json({ ok: true, extraction: { ...existingSupabase, userId }, cached: true });
    }
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed checking existing extraction" },
      { status: 500 }
    );
  }

  try {
    const document = await getDocumentSupabase(userId, body.documentId);
    if (!document) return NextResponse.json({ ok: false, error: "Document not found" }, { status: 404 });

    const sourceText = document.extractedFromText ?? `${document.title} ${document.docType} ${document.conditionTags.join(" ")}`;

    try {
      const ai = await aiServices.documentExtractionService({ text: sourceText });
      const supabaseSaved = await upsertDocumentExtractionSupabase({
        documentId: body.documentId,
        extracted: ai.data,
        status: "pending_review"
      });
      return NextResponse.json({ ok: true, extraction: { ...supabaseSaved, userId }, source: "ai" });
    } catch {
      const fallback = fallbackExtraction(sourceText);
      const supabaseSaved = await upsertDocumentExtractionSupabase({
        documentId: body.documentId,
        extracted: fallback,
        status: "pending_review"
      });
      return NextResponse.json({ ok: true, extraction: { ...supabaseSaved, userId }, source: "fallback" });
    }
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to extract document intelligence" },
      { status: 500 }
    );
  }
}
