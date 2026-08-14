-- 0021's tp_private.can_view_task(task_id) re-queried tp_tasks from within
-- tp_tasks' own SELECT policy. That self-reference is fine for plain SELECTs,
-- but Postgres raises "new row violates row-level security policy" when an
-- INSERT ... RETURNING against tp_tasks has to re-check the SELECT policy on
-- the row it just inserted (e.g. createTaskAction's `.insert().select()`,
-- including the task-list-view auto-draft-on-close safety net).
--
-- Fix: give tp_tasks' own select/update policies a variant that takes the
-- row's own organization_id/created_by directly, so it never has to look
-- tp_tasks back up. Child-table policies keep using can_view_task(task_id),
-- which is safe since it queries a *different* table than the one it's used on.
create or replace function tp_private.can_view_task_row(p_task_id uuid, p_organization_id uuid, p_created_by uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    p_organization_id = tp_private.current_org_id()
    and (
      exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin'))
      or p_created_by = auth.uid()
      or exists (select 1 from tp_task_assignees ta where ta.task_id = p_task_id and ta.profile_id = auth.uid())
    );
$$;

create or replace function tp_private.can_view_task(p_task_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from tp_tasks t
    where t.id = p_task_id
      and tp_private.can_view_task_row(t.id, t.organization_id, t.created_by)
  );
$$;

drop policy tp_tasks_select on tp_tasks;
create policy tp_tasks_select on tp_tasks for select using (
  tp_private.can_view_task_row(id, organization_id, created_by)
);

drop policy tp_tasks_update on tp_tasks;
create policy tp_tasks_update on tp_tasks for update using (
  tp_private.can_view_task_row(id, organization_id, created_by)
) with check (
  tp_private.can_view_task_row(id, organization_id, created_by)
);
