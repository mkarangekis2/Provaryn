import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDocument, getDocumentExtraction } from "@/server/mock/store";
import { getDocumentExtractionSupabase, getDocumentSupabase } from "@/server/persistence/supabase-intake";

const schema = z.object({ userId: z.string().min(5), documentId: z.string().uuid() });

export async function GET(request: NextRequest) {
  const parsed = schema.safeParse({
    userId: request.nextUrl.searchParams.get("userId"),
    documentId: request.nextUrl.searchParams.get("documentId")
  });

  if (!parsed.success) return NextResponse.json({ ok: false, error: "userId and documentId required" }, { status: 400 });

  try {
    const document = await getDocumentSupabase(parsed.data.userId, parsed.data.documentId);
    if (document) {
      const extraction = await getDocumentExtractionSupabase(parsed.data.documentId);
      return NextResponse.json({ ok: true, document, extraction: extraction ? { ...extraction, userId: parsed.data.userId } : null });
    }
  } catch {
    // fallback below
  }

  const document = getDocument(parsed.data.userId, parsed.data.documentId);
  if (!document) return NextResponse.json({ ok: false, error: "Document not found" }, { status: 404 });
  const extraction = getDocumentExtraction(parsed.data.documentId);
  return NextResponse.json({ ok: true, document, extraction });
}
