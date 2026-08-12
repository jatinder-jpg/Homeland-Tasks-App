-- Phase 6: Project-mandatory task creation (app-level, no schema change), Site Visit
-- field, and Archive for Tasks + Discussions.

alter table tp_tasks add column site_visit boolean not null default false;
alter table tp_tasks add column is_archived boolean not null default false;
alter table tp_tasks add column archived_at timestamptz;
create index tp_tasks_org_archived_idx on tp_tasks(organization_id, is_archived);

alter table tp_discussion_channels add column is_archived boolean not null default false;
alter table tp_discussion_channels add column archived_at timestamptz;

-- Fixes a pre-existing bug: tp_discussion_channels had no UPDATE policy at all,
-- so sendMessageAction's last_message_at/preview update has been silently
-- affecting 0 rows since Phase 3. Any member can update (needed for both that
-- bookkeeping and archiving).
create policy tp_discussion_channels_update on tp_discussion_channels for update using (
  tp_private.is_channel_member(id)
);
