import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listAuditEntries } from "@/server/mock/store";
import { listAuditEntriesSupabase } from "@/server/persistence/supabase-settings";

const schema = z.object({ userId: z.string().min(5) });

export async function GET(request: NextRequest) {
  const parsed = schema.safeParse({ userId: request.nextUrl.searchParams.get("userId") });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });

  try {
    const logs = await listAuditEntriesSupabase(parsed.data.userId);
    return NextResponse.json({ ok: true, logs });
  } catch {
    return NextResponse.json({ ok: true, logs: listAuditEntries(parsed.data.userId) });
  }
}
