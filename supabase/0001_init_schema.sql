-- 0001_init_schema.sql
create extension if not exists "pgcrypto";

create type app_role as enum ('user','coach','program_admin','system_admin');
create type condition_status as enum ('detected','tracking','ready','filed','denied','appeal');
create type task_status as enum ('todo','in_progress','blocked','done');
create type doc_type as enum ('medical_record','imaging','orders','profile','visit_note','statement','other');
create type evidence_impact as enum ('low','medium','high');

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  role app_role not null default 'user',
  unique(user_id, role)
);

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_at timestamptz not null default now()
);

create table if not exists organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique(organization_id,user_id)
);

create table if not exists coach_relationships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  coach_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique(user_id,coach_id)
);

create table if not exists access_grants (
  id uuid primary key default gen_random_uuid(),
  granter_user_id uuid not null references profiles(id) on delete cascade,
  grantee_user_id uuid not null references profiles(id) on delete cascade,
  permission_key text not null,
  scope jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists service_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  branch text,
  component text,
  rank text,
  mos text,
  years_served int,
  current_status text,
  ets_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists service_timeline_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  entry_type text not null,
  title text not null,
  start_date date,
  end_date date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_timeline_user on service_timeline_entries(user_id);

create table if not exists occupational_exposures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  exposure_type text not null,
  confidence numeric not null default 0.5,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists exposure_instances (
  id uuid primary key default gen_random_uuid(),
  exposure_id uuid not null references occupational_exposures(id) on delete cascade,
  occurred_on date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists check_in_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  session_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists symptom_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references check_in_sessions(id) on delete cascade,
  category text not null,
  severity int not null,
  frequency int,
  impact text,
  care_sought boolean,
  created_at timestamptz not null default now()
);

create table if not exists event_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  event_type text not null,
  occurred_at timestamptz,
  location text,
  unit text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists diagnoses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  condition_name text not null,
  diagnosed_on date,
  provider text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  storage_path text not null,
  filename text not null,
  mime_type text,
  doc_type doc_type not null default 'other',
  uploaded_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists idx_documents_user on documents(user_id);

create table if not exists document_extractions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  extracted jsonb not null,
  confidence numeric not null default 0.5,
  status text not null default 'pending_review',
  created_at timestamptz not null default now()
);

create table if not exists evidence_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  source_type text not null,
  source_id uuid,
  summary text,
  impact evidence_impact not null default 'medium',
  created_at timestamptz not null default now()
);

create table if not exists condition_catalog (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  body_system text,
  category text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists user_conditions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  condition_catalog_id uuid references condition_catalog(id),
  label text not null,
  status condition_status not null default 'detected',
  confidence numeric not null default 0.5,
  readiness_score int not null default 0,
  service_connection_confidence numeric not null default 0.5,
  created_at timestamptz not null default now()
);
create index if not exists idx_user_conditions_user on user_conditions(user_id);

create table if not exists user_condition_relationships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  primary_condition_id uuid not null references user_conditions(id) on delete cascade,
  secondary_condition_id uuid not null references user_conditions(id) on delete cascade,
  confidence numeric not null default 0.5,
  rationale text,
  created_at timestamptz not null default now()
);

create table if not exists secondary_condition_rules (
  id uuid primary key default gen_random_uuid(),
  primary_condition text not null,
  secondary_condition text not null,
  rationale text,
  weight numeric not null default 1.0,
  active boolean not null default true
);

create table if not exists evidence_gap_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  user_condition_id uuid references user_conditions(id) on delete cascade,
  gap_type text not null,
  description text not null,
  impact evidence_impact not null,
  urgency int not null default 3,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists readiness_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  overall int not null,
  evidence_completeness int not null,
  diagnosis_coverage int not null,
  service_connection_strength int not null,
  transition_readiness int not null,
  computed_at timestamptz not null default now()
);

create table if not exists claim_strategy_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  strategy jsonb not null,
  confidence numeric not null default 0.5,
  created_at timestamptz not null default now()
);

create table if not exists rating_estimates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  expected_range text,
  conservative_range text,
  best_case_range text,
  confidence numeric not null default 0.5,
  created_at timestamptz not null default now()
);

create table if not exists transition_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  active boolean not null default false,
  triggered_reason text,
  target_date date,
  created_at timestamptz not null default now()
);

create table if not exists transition_tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references transition_plans(id) on delete cascade,
  title text not null,
  status task_status not null default 'todo',
  urgency int not null default 3,
  rationale text,
  created_at timestamptz not null default now()
);

create table if not exists claim_packages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists claim_package_conditions (
  id uuid primary key default gen_random_uuid(),
  claim_package_id uuid not null references claim_packages(id) on delete cascade,
  user_condition_id uuid not null references user_conditions(id) on delete cascade,
  included boolean not null default true
);

create table if not exists generated_narratives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  user_condition_id uuid references user_conditions(id) on delete set null,
  narrative_type text not null,
  content text not null,
  version int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists claim_status_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  status text not null,
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists benefits_catalog (
  id uuid primary key default gen_random_uuid(),
  state_code text,
  title text not null,
  category text not null,
  min_rating int,
  details text,
  url text
);

create table if not exists user_benefit_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  benefit_id uuid not null references benefits_catalog(id) on delete cascade,
  eligibility_confidence numeric not null default 0.5,
  created_at timestamptz not null default now(),
  unique(user_id, benefit_id)
);

create table if not exists appeal_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  rationale text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists ai_prompt_versions (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  version text not null,
  prompt text not null,
  created_at timestamptz not null default now(),
  unique(key, version)
);

create table if not exists ai_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  run_type text not null,
  prompt_version text,
  model text,
  input_redacted jsonb,
  output jsonb,
  confidence numeric,
  created_at timestamptz not null default now()
);

create table if not exists ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  run_id uuid references ai_runs(id) on delete set null,
  recommendation_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists recommendation_explanations (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references ai_recommendations(id) on delete cascade,
  what_detected text,
  why_it_matters text,
  evidence_used text,
  missing_items text,
  action_recommended text,
  created_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists structured_extractions_from_chat (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  extraction jsonb not null,
  status text not null default 'pending_review',
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  enabled boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  event_type text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  metadata jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references profiles(id) on delete set null,
  target_user_id uuid references profiles(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table roles enable row level security;
alter table organizations enable row level security;
alter table organization_memberships enable row level security;
alter table coach_relationships enable row level security;
alter table access_grants enable row level security;
alter table service_profiles enable row level security;
alter table service_timeline_entries enable row level security;
alter table occupational_exposures enable row level security;
alter table exposure_instances enable row level security;
alter table check_in_sessions enable row level security;
alter table symptom_entries enable row level security;
alter table event_logs enable row level security;
alter table diagnoses enable row level security;
alter table documents enable row level security;
alter table document_extractions enable row level security;
alter table evidence_items enable row level security;
alter table user_conditions enable row level security;
alter table user_condition_relationships enable row level security;
alter table evidence_gap_items enable row level security;
alter table readiness_scores enable row level security;
alter table claim_strategy_snapshots enable row level security;
alter table rating_estimates enable row level security;
alter table transition_plans enable row level security;
alter table transition_tasks enable row level security;
alter table claim_packages enable row level security;
alter table claim_package_conditions enable row level security;
alter table generated_narratives enable row level security;
alter table claim_status_records enable row level security;
alter table user_benefit_matches enable row level security;
alter table appeal_opportunities enable row level security;
alter table ai_runs enable row level security;
alter table ai_recommendations enable row level security;
alter table recommendation_explanations enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table structured_extractions_from_chat enable row level security;
alter table notifications enable row level security;
alter table billing_events enable row level security;
alter table audit_logs enable row level security;

create or replace function is_owner_or_coach(target_user uuid)
returns boolean language sql stable as $$
  select
    auth.uid() = target_user
    or exists (
      select 1 from coach_relationships cr
      where cr.user_id = target_user and cr.coach_id = auth.uid() and cr.status = 'active'
    );
$$;

create policy "profiles_owner_or_coach" on profiles for select using (is_owner_or_coach(id));
create policy "profiles_owner_update" on profiles for update using (auth.uid() = id);

create policy "service_profiles_owner_or_coach" on service_profiles for all using (is_owner_or_coach(user_id)) with check (auth.uid() = user_id);
create policy "timeline_owner_or_coach" on service_timeline_entries for all using (is_owner_or_coach(user_id)) with check (auth.uid() = user_id);
create policy "exposures_owner_or_coach" on occupational_exposures for all using (is_owner_or_coach(user_id)) with check (auth.uid() = user_id);
create policy "checkins_owner_or_coach" on check_in_sessions for all using (is_owner_or_coach(user_id)) with check (auth.uid() = user_id);
create policy "events_owner_or_coach" on event_logs for all using (is_owner_or_coach(user_id)) with check (auth.uid() = user_id);
create policy "diagnoses_owner_or_coach" on diagnoses for all using (is_owner_or_coach(user_id)) with check (auth.uid() = user_id);
create policy "docs_owner_or_coach" on documents for all using (is_owner_or_coach(user_id)) with check (auth.uid() = user_id);
create policy "evidence_owner_or_coach" on evidence_items for all using (is_owner_or_coach(user_id)) with check (auth.uid() = user_id);
create policy "conditions_owner_or_coach" on user_conditions for all using (is_owner_or_coach(user_id)) with check (auth.uid() = user_id);
create policy "gaps_owner_or_coach" on evidence_gap_items for all using (is_owner_or_coach(user_id)) with check (auth.uid() = user_id);
create policy "scores_owner_or_coach" on readiness_scores for all using (is_owner_or_coach(user_id)) with check (auth.uid() = user_id);
create policy "strategy_owner_or_coach" on claim_strategy_snapshots for all using (is_owner_or_coach(user_id)) with check (auth.uid() = user_id);
create policy "ratings_owner_or_coach" on rating_estimates for all using (is_owner_or_coach(user_id)) with check (auth.uid() = user_id);
create policy "plans_owner_or_coach" on transition_plans for all using (is_owner_or_coach(user_id)) with check (auth.uid() = user_id);
create policy "packages_owner_or_coach" on claim_packages for all using (is_owner_or_coach(user_id)) with check (auth.uid() = user_id);
create policy "narratives_owner_or_coach" on generated_narratives for all using (is_owner_or_coach(user_id)) with check (auth.uid() = user_id);
create policy "status_owner_or_coach" on claim_status_records for all using (is_owner_or_coach(user_id)) with check (auth.uid() = user_id);
create policy "benefits_owner_or_coach" on user_benefit_matches for all using (is_owner_or_coach(user_id)) with check (auth.uid() = user_id);
create policy "appeals_owner_or_coach" on appeal_opportunities for all using (is_owner_or_coach(user_id)) with check (auth.uid() = user_id);
create policy "ai_runs_owner_or_coach" on ai_runs for all using (user_id is null or is_owner_or_coach(user_id)) with check (user_id is null or auth.uid() = user_id);
create policy "ai_reco_owner_or_coach" on ai_recommendations for all using (is_owner_or_coach(user_id)) with check (auth.uid() = user_id);
create policy "conversations_owner" on conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications_owner" on notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "billing_owner" on billing_events for select using (auth.uid() = user_id);
create policy "audit_owner" on audit_logs for select using (auth.uid() = target_user_id or auth.uid() = actor_user_id);

insert into storage.buckets (id, name, public)
values ('medical-records', 'medical-records', false), ('user-uploads', 'user-uploads', false), ('generated-exports', 'generated-exports', false), ('statement-assets', 'statement-assets', false)
on conflict (id) do nothing;
