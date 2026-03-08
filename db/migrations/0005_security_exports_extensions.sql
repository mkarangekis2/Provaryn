create table if not exists user_security_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  label text not null,
  ip_address text,
  user_agent text,
  trusted boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists user_session_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  session_label text not null,
  ip_address text,
  user_agent text,
  active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists export_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  claim_package_id uuid references claim_packages(id) on delete set null,
  status text not null default 'queued',
  output_format text not null default 'json',
  artifact jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_user_security_devices_user on user_security_devices(user_id, last_seen_at desc);
create index if not exists idx_user_session_records_user on user_session_records(user_id, last_seen_at desc);
create index if not exists idx_export_jobs_user on export_jobs(user_id, created_at desc);

alter table user_security_devices enable row level security;
alter table user_session_records enable row level security;
alter table export_jobs enable row level security;

drop policy if exists "security_devices_owner_or_coach" on user_security_devices;
create policy "security_devices_owner_or_coach"
  on user_security_devices for all
  using (is_owner_or_coach(user_id))
  with check (auth.uid() = user_id);

drop policy if exists "session_records_owner_or_coach" on user_session_records;
create policy "session_records_owner_or_coach"
  on user_session_records for all
  using (is_owner_or_coach(user_id))
  with check (auth.uid() = user_id);

drop policy if exists "export_jobs_owner_or_coach" on export_jobs;
create policy "export_jobs_owner_or_coach"
  on export_jobs for all
  using (is_owner_or_coach(user_id))
  with check (auth.uid() = user_id);
