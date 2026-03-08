import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addAuditEntry, getSecurityCenter, upsertSecurityCenter } from "@/server/mock/store";
import {
  addAuditEntrySupabase,
  getSecurityCenterSupabase,
  upsertSecurityCenterSupabase
} from "@/server/persistence/supabase-settings";
import { requireAuthorizedQueryUser, requireAuthorizedUser } from "@/lib/auth/request-user";

const getSchema = z.object({ userId: z.string().min(5) });
const postSchema = z.object({ userId: z.string().min(5), mfaEnabled: z.boolean(), loginAlertsEnabled: z.boolean() });

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  let existing = null as ReturnType<typeof getSecurityCenter>;
  try {
    existing = await getSecurityCenterSupabase(auth.userId);
  } catch {
    existing = null;
  }
  existing = existing ?? getSecurityCenter(auth.userId) ?? upsertSecurityCenter({
    userId: auth.userId,
    mfaEnabled: false,
    loginAlertsEnabled: true,
    trustedDeviceCount: 1,
    recentEvents: [
      { id: randomUUID(), label: "Successful login", at: new Date().toISOString() },
      { id: randomUUID(), label: "API key rotation reminder", at: new Date().toISOString() }
    ],
    updatedAt: new Date().toISOString()
  });

  return NextResponse.json({ ok: true, security: existing });
}

export async function POST(request: NextRequest) {
  const body = postSchema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;
  const payload = { ...body, userId: auth.userId };
  let existing = null as ReturnType<typeof getSecurityCenter>;
  try {
    existing = await getSecurityCenterSupabase(payload.userId);
  } catch {
    existing = null;
  }

  let saved: ReturnType<typeof upsertSecurityCenter>;
  const recentEvents = [
    { id: randomUUID(), label: "Security settings updated", at: new Date().toISOString() },
    ...(existing?.recentEvents ?? [])
  ].slice(0, 8);

  try {
    saved = await upsertSecurityCenterSupabase({
      userId: payload.userId,
      mfaEnabled: payload.mfaEnabled,
      loginAlertsEnabled: payload.loginAlertsEnabled,
      trustedDeviceCount: existing?.trustedDeviceCount ?? 1,
      recentEvents,
      updatedAt: new Date().toISOString()
    });
    await addAuditEntrySupabase({
      userId: payload.userId,
      action: "security_settings_updated",
      category: "security",
      metadata: { mfaEnabled: payload.mfaEnabled, loginAlertsEnabled: payload.loginAlertsEnabled }
    });
  } catch {
    saved = upsertSecurityCenter({
      userId: payload.userId,
      mfaEnabled: payload.mfaEnabled,
      loginAlertsEnabled: payload.loginAlertsEnabled,
      trustedDeviceCount: existing?.trustedDeviceCount ?? 1,
      recentEvents,
      updatedAt: new Date().toISOString()
    });
    addAuditEntry(payload.userId, {
      id: randomUUID(),
      action: "security_settings_updated",
      category: "security",
      metadata: { mfaEnabled: payload.mfaEnabled, loginAlertsEnabled: payload.loginAlertsEnabled },
      createdAt: new Date().toISOString()
    });
  }

  return NextResponse.json({ ok: true, security: saved });
}
