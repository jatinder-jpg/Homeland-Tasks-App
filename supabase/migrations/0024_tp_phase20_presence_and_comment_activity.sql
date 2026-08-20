-- Presence tracking: heartbeat-updated last_seen_at per user, powers green/yellow online dots.
create table tp_user_presence (
  profile_id uuid primary key references tp_profiles(id) on delete cascade,
  organization_id uuid not null references tp_organizations(id) on delete cascade,
  last_seen_at timestamptz not null default now()
);
create index tp_user_presence_org_idx on tp_user_presence(organization_id);

alter table tp_user_presence enable row level security;

create policy tp_user_presence_select on tp_user_presence for select using (
  organization_id = tp_private.current_org_id()
);
create policy tp_user_presence_insert on tp_user_presence for insert with check (
  profile_id = auth.uid() and organization_id = tp_private.current_org_id()
);
create policy tp_user_presence_update on tp_user_presence for update using (
  profile_id = auth.uid()
);

-- Extend the activity log to cover "opened this task" and "commented" events,
-- so the Log Activity tab and User Activity reports capture every open/reply.
alter table tp_task_activity_log drop constraint tp_task_activity_log_action_check;
alter table tp_task_activity_log add constraint tp_task_activity_log_action_check
  check (action in ('updated','status_changed','archived','unarchived','completed','reopened','opened','commented'));
