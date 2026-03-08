import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { addDocument, listDocuments } from "@/server/mock/store";
import { addDocumentSupabase, listDocumentsSupabase } from "@/server/persistence/supabase-intake";

const createSchema = z.object({
  userId: z.string().min(5),
  title: z.string().min(3),
  docType: z.string().min(1),
  filename: z.string().min(1),
  conditionTags: z.array(z.string()).default([]),
  provider: z.string().optional(),
  dateOfService: z.string().optional(),
  extractedFromText: z.string().optional()
});

export async function POST(request: NextRequest) {
  const body = createSchema.parse(await request.json());
  let saved: ReturnType<typeof addDocument>;
  try {
    saved = await addDocumentSupabase(body);
  } catch {
    saved = addDocument({
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...body
    });
  }

  return NextResponse.json({ ok: true, document: saved });
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });
  try {
    const documents = await listDocumentsSupabase(userId);
    return NextResponse.json({ ok: true, documents });
  } catch {
    return NextResponse.json({ ok: true, documents: listDocuments(userId) });
  }
}
