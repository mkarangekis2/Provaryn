-- 0003_transition_task_extensions.sql

alter table if exists transition_tasks
  add column if not exists related_conditions jsonb not null default '[]'::jsonb;
