-- 0004_analytics_events.sql

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  event_name text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table analytics_events enable row level security;

create policy "analytics_owner_select" on analytics_events
for select using (user_id is not null and auth.uid() = user_id);

create policy "analytics_owner_insert" on analytics_events
for insert with check (user_id is null or auth.uid() = user_id);
