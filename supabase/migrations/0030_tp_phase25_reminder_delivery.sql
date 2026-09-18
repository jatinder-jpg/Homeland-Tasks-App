alter table tp_tasks add column reminder_sent_at timestamptz;

alter table tp_notifications drop constraint tp_notifications_type_check;
alter table tp_notifications add constraint tp_notifications_type_check
  check (type in ('task_assigned','project_assigned','discussion_message','folder_shared','file_shared','task_urgent_alert','task_review_requested','task_reminder'));

-- Runs every 5 minutes via pg_cron below. Notifies every assignee of a task
-- whose remind_at has passed (or the creator, if unassigned), then marks it
-- sent so it never fires twice. tp_private (not public) — same convention as
-- current_org_id() and the other internal helper functions in this schema.
create or replace function tp_private.send_due_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  recipient uuid;
  has_assignee boolean;
begin
  for r in
    select t.id, t.name, t.organization_id, t.created_by
    from tp_tasks t
    where t.remind_at is not null
      and t.remind_at <= now()
      and t.reminder_sent_at is null
      and t.is_archived = false
  loop
    has_assignee := false;

    for recipient in
      select a.profile_id from tp_task_assignees a where a.task_id = r.id
    loop
      has_assignee := true;
      insert into tp_notifications (organization_id, recipient_id, actor_id, type, title, body, link)
      values (r.organization_id, recipient, null, 'task_reminder', 'Reminder: ' || r.name, 'This task''s reminder is due', '/task?open=' || r.id);
    end loop;

    if not has_assignee and r.created_by is not null then
      insert into tp_notifications (organization_id, recipient_id, actor_id, type, title, body, link)
      values (r.organization_id, r.created_by, null, 'task_reminder', 'Reminder: ' || r.name, 'This task''s reminder is due', '/task?open=' || r.id);
    end if;

    update tp_tasks set reminder_sent_at = now() where id = r.id;
  end loop;
end;
$$;

create extension if not exists pg_cron;

select cron.schedule('send-due-task-reminders', '*/5 * * * *', $$select tp_private.send_due_reminders();$$);
