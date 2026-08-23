-- Read receipts + unread badges: track when each member last opened a channel.
alter table tp_discussion_channel_members add column last_read_at timestamptz;

create policy tp_discussion_channel_members_update on tp_discussion_channel_members for update using (
  profile_id = auth.uid()
) with check (
  profile_id = auth.uid()
);

-- Reply-to-message.
alter table tp_discussion_messages add column reply_to_message_id uuid references tp_discussion_messages(id) on delete set null;

-- Emoji reactions, one active reaction per user per message.
create table tp_discussion_message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references tp_discussion_messages(id) on delete cascade,
  profile_id uuid not null references tp_profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (message_id, profile_id)
);
create index tp_discussion_message_reactions_message_idx on tp_discussion_message_reactions(message_id);

alter table tp_discussion_message_reactions enable row level security;

create policy tp_discussion_message_reactions_select on tp_discussion_message_reactions for select using (
  exists (
    select 1 from tp_discussion_messages m
    join tp_discussion_channels c on c.id = m.channel_id
    where m.id = message_id
      and c.organization_id = tp_private.current_org_id()
      and (tp_private.is_channel_member(c.id) or c.type = 'task')
  )
);
create policy tp_discussion_message_reactions_mutate on tp_discussion_message_reactions for all using (
  profile_id = auth.uid()
) with check (
  profile_id = auth.uid()
);
