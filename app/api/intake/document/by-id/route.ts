import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDocumentExtractionSupabase, getDocumentSupabase } from "@/server/persistence/supabase-intake";
import { requireAuthorizedUser } from "@/lib/auth/request-user";

const schema = z.object({ userId: z.string().min(5), documentId: z.string().uuid() });

export async function GET(request: NextRequest) {
  const parsed = schema.safeParse({
    userId: request.nextUrl.searchParams.get("userId"),
    documentId: request.nextUrl.searchParams.get("documentId")
  });

  if (!parsed.success) return NextResponse.json({ ok: false, error: "userId and documentId required" }, { status: 400 });
  const auth = await requireAuthorizedUser(request, parsed.data.userId);
  if (!auth.ok) return auth.response;
  const userId = auth.userId;

  try {
    const document = await getDocumentSupabase(userId, parsed.data.documentId);
    if (!document) return NextResponse.json({ ok: false, error: "Document not found" }, { status: 404 });
    const extraction = await getDocumentExtractionSupabase(parsed.data.documentId);
    return NextResponse.json({ ok: true, document, extraction: extraction ? { ...extraction, userId } : null });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load document detail" },
      { status: 500 }
    );
  }
}
