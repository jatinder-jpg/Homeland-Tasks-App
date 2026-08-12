-- Taskopad clone Phase 3 schema: Discussion (chat) module + real Notifications.
-- First-time Realtime integration: tp_discussion_messages and tp_notifications
-- are added to the supabase_realtime publication for Postgres Changes.

create table tp_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references tp_organizations(id) on delete cascade,
  recipient_id uuid not null references tp_profiles(id) on delete cascade,
  actor_id uuid references tp_profiles(id) on delete set null,
  type text not null check (type in ('task_assigned', 'project_assigned', 'discussion_message')),
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index tp_notifications_recipient_idx on tp_notifications(recipient_id, created_at desc);
create index tp_notifications_recipient_unread_idx on tp_notifications(recipient_id) where is_read = false;

create table tp_discussion_channels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references tp_organizations(id) on delete cascade,
  type text not null check (type in ('group', 'direct', 'task')),
  name text,
  task_id uuid references tp_tasks(id) on delete cascade,
  created_by uuid not null references tp_profiles(id) on delete restrict,
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz not null default now()
);
create index tp_discussion_channels_org_idx on tp_discussion_channels(organization_id);
create index tp_discussion_channels_org_type_idx on tp_discussion_channels(organization_id, type);
create index tp_discussion_channels_task_idx on tp_discussion_channels(task_id);

create table tp_discussion_channel_members (
  channel_id uuid not null references tp_discussion_channels(id) on delete cascade,
  profile_id uuid not null references tp_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (channel_id, profile_id)
);
create index tp_discussion_channel_members_profile_idx on tp_discussion_channel_members(profile_id);

create table tp_discussion_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references tp_discussion_channels(id) on delete cascade,
  sender_id uuid not null references tp_profiles(id) on delete restrict,
  body text not null,
  created_at timestamptz not null default now()
);
create index tp_discussion_messages_channel_idx on tp_discussion_messages(channel_id, created_at);

alter table tp_notifications enable row level security;
alter table tp_discussion_channels enable row level security;
alter table tp_discussion_channel_members enable row level security;
alter table tp_discussion_messages enable row level security;

-- Membership helper (security definer — avoids self-referential RLS on
-- tp_discussion_channel_members, same reason tp_private.current_org_id()
-- exists for tp_profiles).
create function tp_private.is_channel_member(p_channel_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tp_discussion_channel_members
    where channel_id = p_channel_id and profile_id = auth.uid()
  )
$$;

create policy tp_notifications_select on tp_notifications
  for select using (recipient_id = auth.uid());
create policy tp_notifications_update on tp_notifications
  for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy tp_notifications_insert on tp_notifications
  for insert with check (organization_id = tp_private.current_org_id());

create policy tp_discussion_channels_select on tp_discussion_channels
  for select using (tp_private.is_channel_member(id));
create policy tp_discussion_channels_insert on tp_discussion_channels
  for insert with check (
    organization_id = tp_private.current_org_id() and created_by = auth.uid()
  );

-- Bootstrap problem: a brand-new channel has zero membership rows, so an
-- "is_channel_member" check can never pass for the first insert. Instead,
-- authorize against tp_discussion_channels.created_by (already enforced
-- above), letting the creator insert membership rows for themselves AND
-- every invitee on a channel with no prior membership row in one request.
-- Deliberately does NOT allow adding members later (no such UI this phase)
-- — extend with "or tp_private.is_channel_member(channel_id)" if that lands.
create policy tp_discussion_channel_members_insert on tp_discussion_channel_members
  for insert with check (
    exists (
      select 1 from tp_discussion_channels c
      where c.id = channel_id
        and c.organization_id = tp_private.current_org_id()
        and c.created_by = auth.uid()
    )
  );
create policy tp_discussion_channel_members_select on tp_discussion_channel_members
  for select using (
    profile_id = auth.uid() or tp_private.is_channel_member(channel_id)
  );

create policy tp_discussion_messages_select on tp_discussion_messages
  for select using (tp_private.is_channel_member(channel_id));
create policy tp_discussion_messages_insert on tp_discussion_messages
  for insert with check (
    tp_private.is_channel_member(channel_id) and sender_id = auth.uid()
  );

-- No update/delete policies: no edit/delete-message or rename-channel UI
-- planned this phase, so RLS denies those operations by default.

alter publication supabase_realtime add table tp_discussion_messages;
alter publication supabase_realtime add table tp_notifications;
