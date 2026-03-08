import { randomUUID } from "node:crypto";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { ensureSupabaseProfile } from "@/server/persistence/supabase-common";
import type { AppRole } from "@/types/domain";

export type OrganizationInvite = {
  id: string;
  organizationId: string;
  invitedBy: string;
  inviteeEmail: string;
  role: AppRole;
  status: string;
  createdAt: string;
  sentAt?: string;
};

async function ensureAdminOrganization(userId: string) {
  await ensureSupabaseProfile(userId);
  const supabase = createServiceSupabaseClient();
  const membership = await supabase
    .from("organization_memberships")
    .select("organization_id, role")
    .eq("user_id", userId)
    .in("role", ["program_admin", "system_admin"])
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (membership.error) throw membership.error;
  if (membership.data?.organization_id) return membership.data.organization_id;

  const createdOrg = await supabase
    .from("organizations")
    .insert({
      name: "Program Organization",
      slug: `program-${randomUUID().slice(0, 8)}`
    })
    .select("id")
    .single();
  if (createdOrg.error) throw createdOrg.error;

  const createdMembership = await supabase.from("organization_memberships").insert({
    organization_id: createdOrg.data.id,
    user_id: userId,
    role: "program_admin"
  });
  if (createdMembership.error) throw createdMembership.error;

  return createdOrg.data.id;
}

export async function listOrganizationInvitesSupabase(adminUserId: string) {
  const organizationId = await ensureAdminOrganization(adminUserId);
  const supabase = createServiceSupabaseClient();
  const result = await supabase
    .from("organization_invites")
    .select("id, organization_id, invited_by, invitee_email, role, status, created_at, sent_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (result.error) throw result.error;
  return result.data.map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    invitedBy: row.invited_by,
    inviteeEmail: row.invitee_email,
    role: row.role as AppRole,
    status: row.status,
    createdAt: row.created_at,
    sentAt: row.sent_at ?? undefined
  }));
}

export async function createOrganizationInviteSupabase(input: {
  adminUserId: string;
  email: string;
  role: AppRole;
}) {
  const organizationId = await ensureAdminOrganization(input.adminUserId);
  const supabase = createServiceSupabaseClient();

  const inviteResult = await supabase.auth.admin.inviteUserByEmail(input.email, {
    redirectTo: `${env.APP_BASE_URL}/invite`,
    data: {
      invited_role: input.role,
      organization_id: organizationId,
      invited_by: input.adminUserId
    }
  });

  const insert = await supabase
    .from("organization_invites")
    .insert({
      organization_id: organizationId,
      invited_by: input.adminUserId,
      invitee_email: input.email,
      role: input.role,
      status: inviteResult.error ? "failed" : "sent",
      metadata: {
        userId: inviteResult.data.user?.id ?? null,
        error: inviteResult.error?.message ?? null
      },
      sent_at: new Date().toISOString()
    })
    .select("id, organization_id, invited_by, invitee_email, role, status, created_at, sent_at")
    .single();

  if (insert.error) throw insert.error;
  if (inviteResult.error) {
    return {
      invite: {
        id: insert.data.id,
        organizationId: insert.data.organization_id,
        invitedBy: insert.data.invited_by,
        inviteeEmail: insert.data.invitee_email,
        role: insert.data.role as AppRole,
        status: insert.data.status,
        createdAt: insert.data.created_at,
        sentAt: insert.data.sent_at ?? undefined
      },
      error: inviteResult.error.message
    };
  }

  return {
    invite: {
      id: insert.data.id,
      organizationId: insert.data.organization_id,
      invitedBy: insert.data.invited_by,
      inviteeEmail: insert.data.invitee_email,
      role: insert.data.role as AppRole,
      status: insert.data.status,
      createdAt: insert.data.created_at,
      sentAt: insert.data.sent_at ?? undefined
    },
    error: null
  };
}
