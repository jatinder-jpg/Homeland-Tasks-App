-- Phase 7: Task modal core rebuild — teams, followers, subtasks, checklist,
-- progress, reminder, and an expanded workflow status field.

create table tp_teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references tp_organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index tp_teams_org_idx on tp_teams(organization_id);

alter table tp_tasks add column team_id uuid references tp_teams(id) on delete set null;
alter table tp_tasks add column progress smallint not null default 0 check (progress between 0 and 100);
alter table tp_tasks add column remind_at timestamptz;
alter table tp_tasks add column workflow_status text not null default 'pending'
  check (workflow_status in ('pending','approval_awaiting','in_progress','on_hold','third_party_pending','under_review'));
alter table tp_tasks add column subtasks_mandatory boolean not null default false;
alter table tp_tasks add column checklist_mandatory boolean not null default false;
create index tp_tasks_team_idx on tp_tasks(team_id);

create table tp_task_followers (
  task_id uuid not null references tp_tasks(id) on delete cascade,
  profile_id uuid not null references tp_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, profile_id)
);
create index tp_task_followers_profile_idx on tp_task_followers(profile_id);

create table tp_task_subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tp_tasks(id) on delete cascade,
  organization_id uuid not null references tp_organizations(id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  assignee_id uuid references tp_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index tp_task_subtasks_task_idx on tp_task_subtasks(task_id);

create table tp_task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tp_tasks(id) on delete cascade,
  organization_id uuid not null references tp_organizations(id) on delete cascade,
  label text not null,
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);
create index tp_task_checklist_items_task_idx on tp_task_checklist_items(task_id);

alter table tp_teams enable row level security;
alter table tp_task_followers enable row level security;
alter table tp_task_subtasks enable row level security;
alter table tp_task_checklist_items enable row level security;

-- Teams: org-wide read, admin-only write (mirrors tp_organizations_update from migration 0006).
create policy tp_teams_select on tp_teams for select using (organization_id = tp_private.current_org_id());
create policy tp_teams_write on tp_teams for all using (
  organization_id = tp_private.current_org_id()
  and exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role = 'admin')
) with check (
  organization_id = tp_private.current_org_id()
  and exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Followers/Subtasks/Checklist: any org member who can see the parent task can manage its
-- child rows (same looseness as tp_tasks_update itself — no extra ownership check today).
create policy tp_task_followers_all on tp_task_followers for all using (
  exists (select 1 from tp_tasks t where t.id = task_id and t.organization_id = tp_private.current_org_id())
) with check (
  exists (select 1 from tp_tasks t where t.id = task_id and t.organization_id = tp_private.current_org_id())
);
create policy tp_task_subtasks_all on tp_task_subtasks for all using (
  organization_id = tp_private.current_org_id()
) with check (
  organization_id = tp_private.current_org_id()
);
create policy tp_task_checklist_items_all on tp_task_checklist_items for all using (
  organization_id = tp_private.current_org_id()
) with check (
  organization_id = tp_private.current_org_id()
);
