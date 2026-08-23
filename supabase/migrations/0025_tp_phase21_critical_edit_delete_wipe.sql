-- 3) Critical Approvals: persistent marker instead of relying on ephemeral notifications.
alter table tp_tasks add column urgent_alert_at timestamptz;

-- 4) Discussion message edit/soft-delete.
alter table tp_discussion_messages add column edited_at timestamptz;
alter table tp_discussion_messages add column is_deleted boolean not null default false;

create policy tp_discussion_messages_update on tp_discussion_messages for update using (
  sender_id = auth.uid()
) with check (
  sender_id = auth.uid()
);

-- "Delete chat" = remove your own membership row (WhatsApp-style delete-for-me;
-- does not delete the channel or messages for other participants).
create policy tp_discussion_channel_members_delete on tp_discussion_channel_members for delete using (
  profile_id = auth.uid()
);

-- 5) Wipe needs to delete whole channels (cascades to members + messages);
-- no delete policy exists on tp_discussion_channels yet. Super-admin only,
-- mirrors the tp_tasks_delete shape from Phase 13.
create policy tp_discussion_channels_delete on tp_discussion_channels for delete using (
  organization_id = tp_private.current_org_id()
  and exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role = 'super_admin')
);
