import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addAuditEntry, getSecurityCenter, upsertSecurityCenter } from "@/server/mock/store";
import {
  addAuditEntrySupabase,
  getSecurityCenterSupabase,
  upsertSecurityCenterSupabase
} from "@/server/persistence/supabase-settings";

const getSchema = z.object({ userId: z.string().min(5) });
const postSchema = z.object({ userId: z.string().min(5), mfaEnabled: z.boolean(), loginAlertsEnabled: z.boolean() });

export async function GET(request: NextRequest) {
  const parsed = getSchema.safeParse({ userId: request.nextUrl.searchParams.get("userId") });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });

  let existing = null as ReturnType<typeof getSecurityCenter>;
  try {
    existing = await getSecurityCenterSupabase(parsed.data.userId);
  } catch {
    existing = null;
  }
  existing = existing ?? getSecurityCenter(parsed.data.userId) ?? upsertSecurityCenter({
    userId: parsed.data.userId,
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
  let existing = null as ReturnType<typeof getSecurityCenter>;
  try {
    existing = await getSecurityCenterSupabase(body.userId);
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
      userId: body.userId,
      mfaEnabled: body.mfaEnabled,
      loginAlertsEnabled: body.loginAlertsEnabled,
      trustedDeviceCount: existing?.trustedDeviceCount ?? 1,
      recentEvents,
      updatedAt: new Date().toISOString()
    });
    await addAuditEntrySupabase({
      userId: body.userId,
      action: "security_settings_updated",
      category: "security",
      metadata: { mfaEnabled: body.mfaEnabled, loginAlertsEnabled: body.loginAlertsEnabled }
    });
  } catch {
    saved = upsertSecurityCenter({
      userId: body.userId,
      mfaEnabled: body.mfaEnabled,
      loginAlertsEnabled: body.loginAlertsEnabled,
      trustedDeviceCount: existing?.trustedDeviceCount ?? 1,
      recentEvents,
      updatedAt: new Date().toISOString()
    });
    addAuditEntry(body.userId, {
      id: randomUUID(),
      action: "security_settings_updated",
      category: "security",
      metadata: { mfaEnabled: body.mfaEnabled, loginAlertsEnabled: body.loginAlertsEnabled },
      createdAt: new Date().toISOString()
    });
  }

  return NextResponse.json({ ok: true, security: saved });
}
