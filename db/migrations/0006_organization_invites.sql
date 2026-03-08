create table if not exists organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  invited_by uuid not null references profiles(id) on delete cascade,
  invitee_email text not null,
  role app_role not null default 'user',
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists idx_organization_invites_org on organization_invites(organization_id, created_at desc);
create index if not exists idx_organization_invites_email on organization_invites(invitee_email);

alter table organization_invites enable row level security;

drop policy if exists "organization_invites_by_inviter" on organization_invites;
create policy "organization_invites_by_inviter"
  on organization_invites for all
  using (auth.uid() = invited_by)
  with check (auth.uid() = invited_by);
