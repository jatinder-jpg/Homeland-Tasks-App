create table tp_quick_replies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references tp_organizations(id) on delete cascade,
  created_by uuid not null references tp_profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);
create index tp_quick_replies_org_idx on tp_quick_replies(organization_id);

alter table tp_quick_replies enable row level security;

-- Org-wide read (any member can use a saved quick reply); only the
-- author can delete their own; no update — add a new one instead.
create policy tp_quick_replies_select on tp_quick_replies for select using (
  organization_id = tp_private.current_org_id()
);
create policy tp_quick_replies_insert on tp_quick_replies for insert with check (
  organization_id = tp_private.current_org_id() and created_by = auth.uid()
);
create policy tp_quick_replies_delete on tp_quick_replies for delete using (
  created_by = auth.uid()
);
