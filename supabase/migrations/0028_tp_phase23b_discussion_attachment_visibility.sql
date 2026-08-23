-- A file attached to a general (non-task) discussion message currently has no
-- task_id, so it's only visible to its owner via the existing owner-or-shared
-- tp_files_select policy. This makes it visible to anyone who can see the
-- message it's attached to (channel member, or org-wide for task channels),
-- additive to the existing policies — same pattern as tp_files_task_select
-- from Phase 10.
create policy tp_files_discussion_select on tp_files for select using (
  exists (
    select 1 from tp_discussion_messages m
    join tp_discussion_channels c on c.id = m.channel_id
    where m.attachment_file_id = tp_files.id
      and c.organization_id = tp_private.current_org_id()
      and (tp_private.is_channel_member(c.id) or c.type = 'task')
  )
);
