-- Taskopad clone Phase 2 schema: Project module + task-project linkage.
-- People module reuses existing tp_profiles/tp_tasks — no new tables needed for it.

create table tp_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references tp_organizations(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'open' check (status in ('open','in_progress','on_hold','done')),
  due_date date,
  assignee_id uuid references tp_profiles(id) on delete set null,
  created_by uuid not null references tp_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tp_projects_org_idx on tp_projects(organization_id);
create index tp_projects_org_status_idx on tp_projects(organization_id, status);
create index tp_projects_org_assignee_idx on tp_projects(organization_id, assignee_id);
create index tp_projects_org_created_by_idx on tp_projects(organization_id, created_by);

create table tp_project_stars (
  profile_id uuid not null references tp_profiles(id) on delete cascade,
  project_id uuid not null references tp_projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, project_id)
);
create index tp_project_stars_project_idx on tp_project_stars(project_id);

alter table tp_tasks add column project_id uuid references tp_projects(id) on delete set null;
create index tp_tasks_org_project_idx on tp_tasks(organization_id, project_id);

alter table tp_projects enable row level security;
alter table tp_project_stars enable row level security;

create policy tp_projects_select on tp_projects for select using (organization_id = tp_private.current_org_id());
create policy tp_projects_insert on tp_projects for insert with check (organization_id = tp_private.current_org_id());
create policy tp_projects_update on tp_projects for update using (organization_id = tp_private.current_org_id()) with check (organization_id = tp_private.current_org_id());
create policy tp_projects_delete on tp_projects for delete using (
  organization_id = tp_private.current_org_id()
  and (created_by = auth.uid() or exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role = 'admin'))
);

create policy tp_project_stars_select on tp_project_stars for select using (profile_id = auth.uid());
create policy tp_project_stars_insert on tp_project_stars for insert with check (
  profile_id = auth.uid()
  and exists (select 1 from tp_projects p where p.id = project_id and p.organization_id = tp_private.current_org_id())
);
create policy tp_project_stars_delete on tp_project_stars for delete using (profile_id = auth.uid());
