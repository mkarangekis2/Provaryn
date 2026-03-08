-- 0008_ai_recommendation_reliability.sql
alter table ai_recommendations
  add column if not exists status text not null default 'pending_review',
  add column if not exists requires_confirmation boolean not null default true,
  add column if not exists confidence numeric not null default 0.5,
  add column if not exists deterministic_score numeric not null default 0.5,
  add column if not exists resolved_at timestamptz,
  add column if not exists reviewed_by_user_id uuid references profiles(id) on delete set null;

create index if not exists idx_ai_recommendations_user_status on ai_recommendations(user_id, status, created_at desc);
