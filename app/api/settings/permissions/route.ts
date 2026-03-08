import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addAuditEntry, getPermissionCenter, upsertPermissionCenter } from "@/server/mock/store";
import { randomUUID } from "node:crypto";
import {
  addAuditEntrySupabase,
  getPermissionCenterSupabase,
  upsertPermissionCenterSupabase
} from "@/server/persistence/supabase-settings";
import { requireAuthorizedQueryUser, requireAuthorizedUser } from "@/lib/auth/request-user";

const getSchema = z.object({ userId: z.string().min(5) });
const postSchema = z.object({
  userId: z.string().min(5),
  shareReadinessWithCoach: z.boolean(),
  shareDocumentsWithCoach: z.boolean(),
  organizationAccessEnabled: z.boolean(),
  exportRequested: z.boolean()
});

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  let existing = null as ReturnType<typeof getPermissionCenter>;
  try {
    existing = await getPermissionCenterSupabase(auth.userId);
  } catch {
    existing = null;
  }
  existing = existing ?? getPermissionCenter(auth.userId) ?? upsertPermissionCenter({
    userId: auth.userId,
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
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;
  const payload = { ...body, userId: auth.userId };
  let saved: ReturnType<typeof upsertPermissionCenter>;
  try {
    saved = await upsertPermissionCenterSupabase({ ...payload, updatedAt: new Date().toISOString() });
    await addAuditEntrySupabase({
      userId: payload.userId,
      action: "permissions_updated",
      category: "permissions",
      metadata: {
        shareReadinessWithCoach: payload.shareReadinessWithCoach,
        shareDocumentsWithCoach: payload.shareDocumentsWithCoach,
        organizationAccessEnabled: payload.organizationAccessEnabled,
        exportRequested: payload.exportRequested
      }
    });
  } catch {
    saved = upsertPermissionCenter({ ...payload, updatedAt: new Date().toISOString() });
    addAuditEntry(payload.userId, {
      id: randomUUID(),
      action: "permissions_updated",
      category: "permissions",
      metadata: {
        shareReadinessWithCoach: payload.shareReadinessWithCoach,
        shareDocumentsWithCoach: payload.shareDocumentsWithCoach,
        organizationAccessEnabled: payload.organizationAccessEnabled,
        exportRequested: payload.exportRequested
      },
      createdAt: new Date().toISOString()
    });
  }
  return NextResponse.json({ ok: true, permissions: saved });
}
