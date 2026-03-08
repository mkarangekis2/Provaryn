-- 20260308113000_action_queue_extensions.sql

alter table if exists transition_tasks
  add column if not exists task_owner text not null default 'member',
  add column if not exists due_at timestamptz,
  add column if not exists impact_score int not null default 50,
  add column if not exists source_stage text not null default 'transition',
  add column if not exists task_type text not null default 'evidence';

create index if not exists idx_transition_tasks_due_at on transition_tasks(due_at);
