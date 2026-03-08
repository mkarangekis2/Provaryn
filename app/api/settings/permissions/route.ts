import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

  try {
    const existing = (await getPermissionCenterSupabase(auth.userId)) ?? await upsertPermissionCenterSupabase({
      userId: auth.userId,
      shareReadinessWithCoach: false,
      shareDocumentsWithCoach: false,
      organizationAccessEnabled: false,
      exportRequested: false,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ ok: true, permissions: existing });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load permission settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = postSchema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;
  const payload = { ...body, userId: auth.userId };
  try {
    const permissions = await upsertPermissionCenterSupabase({ ...payload, updatedAt: new Date().toISOString() });
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
    return NextResponse.json({ ok: true, permissions });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to save permission settings" },
      { status: 500 }
    );
  }
}
