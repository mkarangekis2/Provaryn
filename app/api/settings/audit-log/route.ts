import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listAuditEntries } from "@/server/mock/store";
import { listAuditEntriesSupabase } from "@/server/persistence/supabase-settings";
import { requireAuthorizedQueryUser } from "@/lib/auth/request-user";

const schema = z.object({ userId: z.string().min(5) });

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  try {
    const logs = await listAuditEntriesSupabase(auth.userId);
    return NextResponse.json({ ok: true, logs });
  } catch {
    return NextResponse.json({ ok: true, logs: listAuditEntries(auth.userId) });
  }
}
