-- Rename Team -> Department (replaces Team entirely; Client/Service tables untouched).
alter table tp_teams rename to tp_departments;
alter table tp_tasks rename column team_id to department_id;

alter index tp_teams_org_idx rename to tp_departments_org_idx;
alter index tp_tasks_team_idx rename to tp_tasks_department_idx;

alter policy tp_teams_select on tp_departments rename to tp_departments_select;
alter policy tp_teams_write on tp_departments rename to tp_departments_write;

-- Department roster: purely informational membership list, managed by Admin + Super Admin
-- (tp_departments_write already allows admin+super_admin, matching this new table's intent).
create table tp_department_members (
  department_id uuid not null references tp_departments(id) on delete cascade,
  profile_id uuid not null references tp_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (department_id, profile_id)
);
create index tp_department_members_profile_idx on tp_department_members(profile_id);

alter table tp_department_members enable row level security;

create policy tp_department_members_select on tp_department_members for select using (
  exists (
    select 1 from tp_departments d
    where d.id = department_id and d.organization_id = tp_private.current_org_id()
  )
);
create policy tp_department_members_write on tp_department_members for all using (
  exists (
    select 1 from tp_departments d
    join tp_profiles p on p.id = auth.uid()
    where d.id = department_id
      and d.organization_id = tp_private.current_org_id()
      and p.role in ('admin', 'super_admin')
  )
) with check (
  exists (
    select 1 from tp_departments d
    join tp_profiles p on p.id = auth.uid()
    where d.id = department_id
      and d.organization_id = tp_private.current_org_id()
      and p.role in ('admin', 'super_admin')
  )
);
