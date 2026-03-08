import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addAuditEntry, getPermissionCenter, upsertPermissionCenter } from "@/server/mock/store";
import { randomUUID } from "node:crypto";
import {
  addAuditEntrySupabase,
  getPermissionCenterSupabase,
  upsertPermissionCenterSupabase
} from "@/server/persistence/supabase-settings";

const getSchema = z.object({ userId: z.string().min(5) });
const postSchema = z.object({
  userId: z.string().min(5),
  shareReadinessWithCoach: z.boolean(),
  shareDocumentsWithCoach: z.boolean(),
  organizationAccessEnabled: z.boolean(),
  exportRequested: z.boolean()
});

export async function GET(request: NextRequest) {
  const parsed = getSchema.safeParse({ userId: request.nextUrl.searchParams.get("userId") });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });

  let existing = null as ReturnType<typeof getPermissionCenter>;
  try {
    existing = await getPermissionCenterSupabase(parsed.data.userId);
  } catch {
    existing = null;
  }
  existing = existing ?? getPermissionCenter(parsed.data.userId) ?? upsertPermissionCenter({
    userId: parsed.data.userId,
    shareReadinessWithCoach: false,
    shareDocumentsWithCoach: false,
    organizationAccessEnabled: false,
    exportRequested: false,
    updatedAt: new Date().toISOString()
  });

  return NextResponse.json({ ok: true, permissions: existing });
}

export async function POST(request: NextRequest) {
  const body = postSchema.parse(await request.json());
  let saved: ReturnType<typeof upsertPermissionCenter>;
  try {
    saved = await upsertPermissionCenterSupabase({ ...body, updatedAt: new Date().toISOString() });
    await addAuditEntrySupabase({
      userId: body.userId,
      action: "permissions_updated",
      category: "permissions",
      metadata: {
        shareReadinessWithCoach: body.shareReadinessWithCoach,
        shareDocumentsWithCoach: body.shareDocumentsWithCoach,
        organizationAccessEnabled: body.organizationAccessEnabled,
        exportRequested: body.exportRequested
      }
    });
  } catch {
    saved = upsertPermissionCenter({ ...body, updatedAt: new Date().toISOString() });
    addAuditEntry(body.userId, {
      id: randomUUID(),
      action: "permissions_updated",
      category: "permissions",
      metadata: {
        shareReadinessWithCoach: body.shareReadinessWithCoach,
        shareDocumentsWithCoach: body.shareDocumentsWithCoach,
        organizationAccessEnabled: body.organizationAccessEnabled,
        exportRequested: body.exportRequested
      },
      createdAt: new Date().toISOString()
    });
  }
  return NextResponse.json({ ok: true, permissions: saved });
}
