import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasAnyRole } from "@/lib/auth/access-scope";
import { requireAuthorizedQueryUser, requireAuthorizedUser } from "@/lib/auth/request-user";
import { addAuditEntrySupabase } from "@/server/persistence/supabase-settings";
import { createOrganizationInviteSupabase, listOrganizationInvitesSupabase } from "@/server/persistence/supabase-org";

const postSchema = z.object({
  userId: z.string().min(5),
  email: z.string().email(),
  role: z.enum(["user", "coach", "program_admin"]).default("user")
});

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  const isAdmin = await hasAnyRole(auth.userId, ["program_admin", "system_admin"]);
  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "Insufficient role for invite management" }, { status: 403 });
  }

  try {
    const invites = await listOrganizationInvitesSupabase(auth.userId);
    return NextResponse.json({ ok: true, invites });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load invites" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = postSchema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;

  const isAdmin = await hasAnyRole(auth.userId, ["program_admin", "system_admin"]);
  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "Insufficient role for invite management" }, { status: 403 });
  }

  try {
    const result = await createOrganizationInviteSupabase({
      adminUserId: auth.userId,
      email: body.email,
      role: body.role
    });

    await addAuditEntrySupabase({
      userId: auth.userId,
      action: "organization_invite_created",
      category: "system",
      metadata: { inviteeEmail: body.email, role: body.role, status: result.invite.status, error: result.error }
    });

    return NextResponse.json({ ok: true, invite: result.invite, deliveryError: result.error });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to create invite" },
      { status: 500 }
    );
  }
}
