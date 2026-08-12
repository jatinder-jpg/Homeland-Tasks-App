-- Phase 10: Per-task comments (reuses tp_discussion_channels/messages via
-- type='task'), attachments (reuses tp_files via task_id), and a new
-- activity log + read-receipts system.

create table tp_task_activity_log (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tp_tasks(id) on delete cascade,
  organization_id uuid not null references tp_organizations(id) on delete cascade,
  actor_id uuid references tp_profiles(id) on delete set null,
  action text not null check (action in ('updated', 'status_changed', 'archived', 'unarchived', 'completed', 'reopened')),
  detail text,
  created_at timestamptz not null default now()
);
create index tp_task_activity_log_task_idx on tp_task_activity_log(task_id, created_at);

create table tp_task_reads (
  task_id uuid not null references tp_tasks(id) on delete cascade,
  profile_id uuid not null references tp_profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (task_id, profile_id)
);

alter table tp_discussion_messages add column attachment_file_id uuid references tp_files(id) on delete set null;
alter table tp_files add column source text not null default 'task' check (source in ('task', 'comment'));

alter table tp_task_activity_log enable row level security;
alter table tp_task_reads enable row level security;

-- Same "anyone who can see the parent task" looseness as tp_task_followers (Phase 7).
create policy tp_task_activity_log_select on tp_task_activity_log for select using (
  exists (select 1 from tp_tasks t where t.id = task_id and t.organization_id = tp_private.current_org_id())
);
create policy tp_task_activity_log_insert on tp_task_activity_log for insert with check (
  exists (select 1 from tp_tasks t where t.id = task_id and t.organization_id = tp_private.current_org_id())
);
-- No update/delete — append-only audit trail.

create policy tp_task_reads_all on tp_task_reads for all using (
  exists (select 1 from tp_tasks t where t.id = task_id and t.organization_id = tp_private.current_org_id())
) with check (
  exists (select 1 from tp_tasks t where t.id = task_id and t.organization_id = tp_private.current_org_id())
);

-- Additive policies for type='task' channels/messages — no membership rows needed.
-- Existing membership-based policies (tp_discussion_channels_select, etc. from
-- migration 0003) are untouched; Postgres OR's multiple permissive policies together.
create policy tp_discussion_channels_task_select on tp_discussion_channels for select using (
  type = 'task' and organization_id = tp_private.current_org_id()
);
create policy tp_discussion_channels_task_update on tp_discussion_channels for update using (
  type = 'task' and organization_id = tp_private.current_org_id()
);
create policy tp_discussion_messages_task_select on tp_discussion_messages for select using (
  exists (select 1 from tp_discussion_channels c where c.id = channel_id and c.type = 'task' and c.organization_id = tp_private.current_org_id())
);
create policy tp_discussion_messages_task_insert on tp_discussion_messages for insert with check (
  sender_id = auth.uid()
  and exists (select 1 from tp_discussion_channels c where c.id = channel_id and c.type = 'task' and c.organization_id = tp_private.current_org_id())
);

-- Fixes the visibility gap found in Phase 4b: a file with task_id set is
-- currently only visible to its owner. This makes it visible to anyone who
-- can see the parent task, additive to the existing owner-or-shared policy.
create policy tp_files_task_select on tp_files for select using (
  task_id is not null
  and exists (select 1 from tp_tasks t where t.id = task_id and t.organization_id = tp_private.current_org_id())
);
