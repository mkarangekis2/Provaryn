import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { ensureSupabaseProfile } from "@/server/persistence/supabase-common";

export type PermissionCenter = {
  userId: string;
  shareReadinessWithCoach: boolean;
  shareDocumentsWithCoach: boolean;
  organizationAccessEnabled: boolean;
  exportRequested: boolean;
  updatedAt: string;
};

export type SecurityCenter = {
  userId: string;
  mfaEnabled: boolean;
  loginAlertsEnabled: boolean;
  trustedDeviceCount: number;
  recentEvents: Array<{ id: string; label: string; at: string }>;
  updatedAt: string;
};

export type NotificationPreferences = {
  userId: string;
  weeklyCheckInReminder: boolean;
  transitionTaskReminder: boolean;
  evidenceGapReminder: boolean;
  coachUpdates: boolean;
  productAnnouncements: boolean;
  cadence: "daily" | "weekly" | "biweekly";
  updatedAt: string;
};

export async function getServiceProfileSupabase(userId: string) {
  await ensureSupabaseProfile(userId);
  const supabase = createServiceSupabaseClient();
  const result = await supabase
    .from("service_profiles")
    .select("user_id, branch, component, rank, mos, years_served, current_status, ets_date")
    .eq("user_id", userId)
    .maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) return null;

  return {
    userId: result.data.user_id,
    branch: result.data.branch ?? "",
    component: result.data.component ?? "",
    rank: result.data.rank ?? "",
    mos: result.data.mos ?? "",
    yearsServed: result.data.years_served ?? 0,
    currentStatus: result.data.current_status ?? "",
    etsDate: result.data.ets_date ?? undefined
  };
}

export async function upsertPermissionCenterSupabase(input: PermissionCenter) {
  await ensureSupabaseProfile(input.userId);
  const supabase = createServiceSupabaseClient();
  const result = await supabase
    .from("user_permission_centers")
    .upsert(
      {
        user_id: input.userId,
        share_readiness_with_coach: input.shareReadinessWithCoach,
        share_documents_with_coach: input.shareDocumentsWithCoach,
        organization_access_enabled: input.organizationAccessEnabled,
        export_requested: input.exportRequested,
        updated_at: input.updatedAt
      },
      { onConflict: "user_id" }
    )
    .select("user_id, share_readiness_with_coach, share_documents_with_coach, organization_access_enabled, export_requested, updated_at")
    .single();

  if (result.error) throw result.error;
  return {
    userId: result.data.user_id,
    shareReadinessWithCoach: result.data.share_readiness_with_coach,
    shareDocumentsWithCoach: result.data.share_documents_with_coach,
    organizationAccessEnabled: result.data.organization_access_enabled,
    exportRequested: result.data.export_requested,
    updatedAt: result.data.updated_at
  };
}

export async function getPermissionCenterSupabase(userId: string) {
  await ensureSupabaseProfile(userId);
  const supabase = createServiceSupabaseClient();
  const result = await supabase
    .from("user_permission_centers")
    .select("user_id, share_readiness_with_coach, share_documents_with_coach, organization_access_enabled, export_requested, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) return null;

  return {
    userId: result.data.user_id,
    shareReadinessWithCoach: result.data.share_readiness_with_coach,
    shareDocumentsWithCoach: result.data.share_documents_with_coach,
    organizationAccessEnabled: result.data.organization_access_enabled,
    exportRequested: result.data.export_requested,
    updatedAt: result.data.updated_at
  };
}

export async function upsertSecurityCenterSupabase(input: SecurityCenter) {
  await ensureSupabaseProfile(input.userId);
  const supabase = createServiceSupabaseClient();
  const result = await supabase
    .from("user_security_centers")
    .upsert(
      {
        user_id: input.userId,
        mfa_enabled: input.mfaEnabled,
        login_alerts_enabled: input.loginAlertsEnabled,
        trusted_device_count: input.trustedDeviceCount,
        recent_events: input.recentEvents,
        updated_at: input.updatedAt
      },
      { onConflict: "user_id" }
    )
    .select("user_id, mfa_enabled, login_alerts_enabled, trusted_device_count, recent_events, updated_at")
    .single();

  if (result.error) throw result.error;
  return {
    userId: result.data.user_id,
    mfaEnabled: result.data.mfa_enabled,
    loginAlertsEnabled: result.data.login_alerts_enabled,
    trustedDeviceCount: result.data.trusted_device_count,
    recentEvents: (result.data.recent_events as Array<{ id: string; label: string; at: string }>) ?? [],
    updatedAt: result.data.updated_at
  };
}

export async function getSecurityCenterSupabase(userId: string) {
  await ensureSupabaseProfile(userId);
  const supabase = createServiceSupabaseClient();
  const result = await supabase
    .from("user_security_centers")
    .select("user_id, mfa_enabled, login_alerts_enabled, trusted_device_count, recent_events, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) throw result.error;
  if (!result.data) return null;

  return {
    userId: result.data.user_id,
    mfaEnabled: result.data.mfa_enabled,
    loginAlertsEnabled: result.data.login_alerts_enabled,
    trustedDeviceCount: result.data.trusted_device_count,
    recentEvents: (result.data.recent_events as Array<{ id: string; label: string; at: string }>) ?? [],
    updatedAt: result.data.updated_at
  };
}

export async function getNotificationPreferencesSupabase(userId: string) {
  await ensureSupabaseProfile(userId);
  const supabase = createServiceSupabaseClient();
  const result = await supabase
    .from("user_notification_preferences")
    .select("user_id, weekly_check_in_reminder, transition_task_reminder, evidence_gap_reminder, coach_updates, product_announcements, cadence, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) throw result.error;
  if (!result.data) return null;

  return {
    userId: result.data.user_id,
    weeklyCheckInReminder: result.data.weekly_check_in_reminder,
    transitionTaskReminder: result.data.transition_task_reminder,
    evidenceGapReminder: result.data.evidence_gap_reminder,
    coachUpdates: result.data.coach_updates,
    productAnnouncements: result.data.product_announcements,
    cadence: result.data.cadence as "daily" | "weekly" | "biweekly",
    updatedAt: result.data.updated_at
  };
}

export async function upsertNotificationPreferencesSupabase(input: NotificationPreferences) {
  await ensureSupabaseProfile(input.userId);
  const supabase = createServiceSupabaseClient();
  const result = await supabase
    .from("user_notification_preferences")
    .upsert(
      {
        user_id: input.userId,
        weekly_check_in_reminder: input.weeklyCheckInReminder,
        transition_task_reminder: input.transitionTaskReminder,
        evidence_gap_reminder: input.evidenceGapReminder,
        coach_updates: input.coachUpdates,
        product_announcements: input.productAnnouncements,
        cadence: input.cadence,
        updated_at: input.updatedAt
      },
      { onConflict: "user_id" }
    )
    .select("user_id, weekly_check_in_reminder, transition_task_reminder, evidence_gap_reminder, coach_updates, product_announcements, cadence, updated_at")
    .single();

  if (result.error) throw result.error;
  return {
    userId: result.data.user_id,
    weeklyCheckInReminder: result.data.weekly_check_in_reminder,
    transitionTaskReminder: result.data.transition_task_reminder,
    evidenceGapReminder: result.data.evidence_gap_reminder,
    coachUpdates: result.data.coach_updates,
    productAnnouncements: result.data.product_announcements,
    cadence: result.data.cadence as "daily" | "weekly" | "biweekly",
    updatedAt: result.data.updated_at
  };
}

export async function listBillingEventsSupabase(userId: string) {
  await ensureSupabaseProfile(userId);
  const supabase = createServiceSupabaseClient();
  const result = await supabase
    .from("billing_events")
    .select("id, event_type, active, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (result.error) throw result.error;
  return result.data.map((item) => ({
    id: item.id,
    userId,
    eventType: item.event_type as "reconstruction_unlock" | "premium_subscription" | "claim_builder_package",
    active: item.active,
    source: "stripe" as const,
    createdAt: item.created_at
  }));
}

export async function addBillingEventSupabase(input: {
  userId: string;
  eventType: "reconstruction_unlock" | "premium_subscription" | "claim_builder_package";
  active: boolean;
  source: "manual" | "stripe";
}) {
  await ensureSupabaseProfile(input.userId);
  const supabase = createServiceSupabaseClient();
  const result = await supabase
    .from("billing_events")
    .insert({
      user_id: input.userId,
      event_type: input.eventType,
      active: input.active,
      metadata: { source: input.source }
    })
    .select("id, event_type, active, created_at")
    .single();

  if (result.error) throw result.error;
  return {
    id: result.data.id,
    userId: input.userId,
    eventType: result.data.event_type as "reconstruction_unlock" | "premium_subscription" | "claim_builder_package",
    active: result.data.active,
    source: input.source,
    createdAt: result.data.created_at
  };
}

export async function addAuditEntrySupabase(input: {
  userId: string;
  action: string;
  category: "security" | "permissions" | "billing" | "data" | "ai" | "system";
  metadata?: Record<string, unknown>;
}) {
  await ensureSupabaseProfile(input.userId);
  const supabase = createServiceSupabaseClient();
  const result = await supabase
    .from("audit_logs")
    .insert({
      actor_user_id: input.userId,
      target_user_id: input.userId,
      action: input.action,
      resource_type: input.category,
      metadata: input.metadata ?? {}
    })
    .select("id, action, resource_type, metadata, created_at")
    .single();

  if (result.error) throw result.error;
  return {
    id: result.data.id,
    userId: input.userId,
    action: result.data.action,
    category: (result.data.resource_type ?? "system") as "security" | "permissions" | "billing" | "data" | "ai" | "system",
    metadata: (result.data.metadata as Record<string, unknown>) ?? {},
    createdAt: result.data.created_at
  };
}

export async function listAuditEntriesSupabase(userId: string) {
  await ensureSupabaseProfile(userId);
  const supabase = createServiceSupabaseClient();
  const result = await supabase
    .from("audit_logs")
    .select("id, action, resource_type, metadata, created_at")
    .eq("target_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (result.error) throw result.error;
  return result.data.map((item) => ({
    id: item.id,
    userId,
    action: item.action,
    category: (item.resource_type ?? "system") as "security" | "permissions" | "billing" | "data" | "ai" | "system",
    metadata: (item.metadata as Record<string, unknown>) ?? {},
    createdAt: item.created_at
  }));
}
