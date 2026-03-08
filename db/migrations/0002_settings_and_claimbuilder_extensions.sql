-- 0002_settings_and_claimbuilder_extensions.sql

create table if not exists user_permission_centers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  share_readiness_with_coach boolean not null default false,
  share_documents_with_coach boolean not null default false,
  organization_access_enabled boolean not null default false,
  export_requested boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists user_security_centers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  mfa_enabled boolean not null default false,
  login_alerts_enabled boolean not null default true,
  trusted_device_count int not null default 1,
  recent_events jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists user_notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  weekly_check_in_reminder boolean not null default true,
  transition_task_reminder boolean not null default true,
  evidence_gap_reminder boolean not null default true,
  coach_updates boolean not null default true,
  product_announcements boolean not null default false,
  cadence text not null default 'weekly',
  updated_at timestamptz not null default now()
);

alter table if exists claim_packages add column if not exists selected_conditions jsonb not null default '[]'::jsonb;
alter table if exists claim_packages add column if not exists forms jsonb not null default '{}'::jsonb;
alter table if exists claim_packages add column if not exists updated_at timestamptz not null default now();
create unique index if not exists idx_claim_packages_user_unique on claim_packages(user_id);

alter table if exists generated_narratives add column if not exists package_id uuid references claim_packages(id) on delete cascade;
alter table if exists generated_narratives add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table user_permission_centers enable row level security;
alter table user_security_centers enable row level security;
alter table user_notification_preferences enable row level security;

create policy "permission_center_owner_or_coach" on user_permission_centers for all using (is_owner_or_coach(user_id)) with check (auth.uid() = user_id);
create policy "security_center_owner_or_coach" on user_security_centers for all using (is_owner_or_coach(user_id)) with check (auth.uid() = user_id);
create policy "notification_prefs_owner_or_coach" on user_notification_preferences for all using (is_owner_or_coach(user_id)) with check (auth.uid() = user_id);
