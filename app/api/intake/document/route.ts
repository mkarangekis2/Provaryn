import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { addDocument, listDocuments } from "@/server/mock/store";
import { addDocumentSupabase, listDocumentsSupabase } from "@/server/persistence/supabase-intake";
import { requireAuthorizedQueryUser, requireAuthorizedUser } from "@/lib/auth/request-user";

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
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;
  const payload = { ...body, userId: auth.userId };
  let saved: ReturnType<typeof addDocument>;
  try {
    saved = await addDocumentSupabase(payload);
  } catch {
    saved = addDocument({
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...payload
    });
  }

  return NextResponse.json({ ok: true, document: saved });
}

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;
  try {
    const documents = await listDocumentsSupabase(auth.userId);
    return NextResponse.json({ ok: true, documents });
  } catch {
    return NextResponse.json({ ok: true, documents: listDocuments(auth.userId) });
  }
}
