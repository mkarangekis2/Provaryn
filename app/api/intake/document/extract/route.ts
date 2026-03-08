import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiServices } from "@/ai/services";
import { getDocument, getDocumentExtraction, upsertDocumentExtraction } from "@/server/mock/store";
import {
  getDocumentExtractionSupabase,
  getDocumentSupabase,
  upsertDocumentExtractionSupabase
} from "@/server/persistence/supabase-intake";

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
  try {
    const existingSupabase = await getDocumentExtractionSupabase(body.documentId);
    if (existingSupabase) {
      return NextResponse.json({ ok: true, extraction: { ...existingSupabase, userId: body.userId }, cached: true });
    }
  } catch {
    // continue
  }

  let document = null as Awaited<ReturnType<typeof getDocumentSupabase>> | ReturnType<typeof getDocument>;
  try {
    document = await getDocumentSupabase(body.userId, body.documentId);
  } catch {
    // continue
  }
  if (!document) {
    document = getDocument(body.userId, body.documentId);
  }
  if (!document) return NextResponse.json({ ok: false, error: "Document not found" }, { status: 404 });

  const sourceText = document.extractedFromText ?? `${document.title} ${document.docType} ${document.conditionTags.join(" ")}`;

  try {
    const ai = await aiServices.documentExtractionService({ text: sourceText });
    let extraction: ReturnType<typeof upsertDocumentExtraction>;
    try {
      const supabaseSaved = await upsertDocumentExtractionSupabase({
        documentId: body.documentId,
        extracted: ai.data,
        status: "pending_review"
      });
      extraction = { ...supabaseSaved, userId: body.userId };
    } catch {
      extraction = upsertDocumentExtraction({
        documentId: body.documentId,
        userId: body.userId,
        extracted: ai.data,
        status: "pending_review",
        updatedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ ok: true, extraction, source: "ai" });
  } catch {
    let extraction: ReturnType<typeof upsertDocumentExtraction>;
    const fallback = fallbackExtraction(sourceText);
    try {
      const supabaseSaved = await upsertDocumentExtractionSupabase({
        documentId: body.documentId,
        extracted: fallback,
        status: "pending_review"
      });
      extraction = { ...supabaseSaved, userId: body.userId };
    } catch {
      extraction = upsertDocumentExtraction({
        documentId: body.documentId,
        userId: body.userId,
        extracted: fallback,
        status: "pending_review",
        updatedAt: new Date().toISOString()
      });
    }
    return NextResponse.json({ ok: true, extraction, source: "fallback" });
  }
}
