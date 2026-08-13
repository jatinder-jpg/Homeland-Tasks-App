create table tp_task_assignees (
  task_id uuid not null references tp_tasks(id) on delete cascade,
  profile_id uuid not null references tp_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, profile_id)
);
create index tp_task_assignees_profile_idx on tp_task_assignees(profile_id);

alter table tp_task_assignees enable row level security;

-- Same looseness as tp_task_followers: anyone who can see the parent task can manage its assignees.
create policy tp_task_assignees_all on tp_task_assignees for all using (
  exists (select 1 from tp_tasks t where t.id = task_id and t.organization_id = tp_private.current_org_id())
) with check (
  exists (select 1 from tp_tasks t where t.id = task_id and t.organization_id = tp_private.current_org_id())
);

-- Backfill: every existing task's single assignee becomes its first assignee row.
insert into tp_task_assignees (task_id, profile_id)
select id, assignee_id from tp_tasks where assignee_id is not null
on conflict do nothing;
