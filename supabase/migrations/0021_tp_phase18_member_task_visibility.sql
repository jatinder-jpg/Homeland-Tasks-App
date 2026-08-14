-- Members can only see tasks they created or are assigned to.
-- Admins and Super Admins keep full org-wide visibility.
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
      and t.organization_id = tp_private.current_org_id()
      and (
        exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin'))
        or t.created_by = auth.uid()
        or exists (select 1 from tp_task_assignees ta where ta.task_id = t.id and ta.profile_id = auth.uid())
      )
  );
$$;

drop policy tp_tasks_select on tp_tasks;
create policy tp_tasks_select on tp_tasks for select using (tp_private.can_view_task(id));

drop policy tp_tasks_update on tp_tasks;
create policy tp_tasks_update on tp_tasks for update using (tp_private.can_view_task(id)) with check (tp_private.can_view_task(id));

drop policy tp_task_followers_all on tp_task_followers;
create policy tp_task_followers_all on tp_task_followers for all using (tp_private.can_view_task(task_id)) with check (tp_private.can_view_task(task_id));

drop policy tp_task_subtasks_all on tp_task_subtasks;
create policy tp_task_subtasks_all on tp_task_subtasks for all using (tp_private.can_view_task(task_id)) with check (tp_private.can_view_task(task_id));

drop policy tp_task_checklist_items_all on tp_task_checklist_items;
create policy tp_task_checklist_items_all on tp_task_checklist_items for all using (tp_private.can_view_task(task_id)) with check (tp_private.can_view_task(task_id));

drop policy tp_task_custom_field_values_all on tp_task_custom_field_values;
create policy tp_task_custom_field_values_all on tp_task_custom_field_values for all using (tp_private.can_view_task(task_id)) with check (tp_private.can_view_task(task_id));

drop policy tp_task_reads_all on tp_task_reads;
create policy tp_task_reads_all on tp_task_reads for all using (tp_private.can_view_task(task_id)) with check (tp_private.can_view_task(task_id));

drop policy tp_task_assignees_all on tp_task_assignees;
create policy tp_task_assignees_all on tp_task_assignees for all using (tp_private.can_view_task(task_id)) with check (tp_private.can_view_task(task_id));

drop policy tp_task_activity_log_select on tp_task_activity_log;
create policy tp_task_activity_log_select on tp_task_activity_log for select using (tp_private.can_view_task(task_id));

drop policy tp_task_activity_log_insert on tp_task_activity_log;
create policy tp_task_activity_log_insert on tp_task_activity_log for insert with check (tp_private.can_view_task(task_id));

drop policy tp_files_task_select on tp_files;
create policy tp_files_task_select on tp_files for select using (task_id is not null and tp_private.can_view_task(task_id));

drop policy tp_discussion_channels_task_select on tp_discussion_channels;
create policy tp_discussion_channels_task_select on tp_discussion_channels for select using (
  type = 'task' and task_id is not null and tp_private.can_view_task(task_id)
);

drop policy tp_discussion_channels_task_update on tp_discussion_channels;
create policy tp_discussion_channels_task_update on tp_discussion_channels for update using (
  type = 'task' and task_id is not null and tp_private.can_view_task(task_id)
);

drop policy tp_discussion_messages_task_select on tp_discussion_messages;
create policy tp_discussion_messages_task_select on tp_discussion_messages for select using (
  exists (
    select 1 from tp_discussion_channels c
    where c.id = channel_id and c.type = 'task' and c.task_id is not null and tp_private.can_view_task(c.task_id)
  )
);

drop policy tp_discussion_messages_task_insert on tp_discussion_messages;
create policy tp_discussion_messages_task_insert on tp_discussion_messages for insert with check (
  sender_id = auth.uid()
  and exists (
    select 1 from tp_discussion_channels c
    where c.id = channel_id and c.type = 'task' and c.task_id is not null and tp_private.can_view_task(c.task_id)
  )
);
