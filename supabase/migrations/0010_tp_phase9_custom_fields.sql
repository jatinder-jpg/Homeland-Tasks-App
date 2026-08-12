-- Phase 9: Custom Fields — a small per-org form-builder. Admins define named
-- text-or-select fields; every task gets an optional value for each.

create table tp_custom_fields (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references tp_organizations(id) on delete cascade,
  name text not null,
  field_type text not null default 'text' check (field_type in ('text', 'select')),
  options jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index tp_custom_fields_org_idx on tp_custom_fields(organization_id);

create table tp_task_custom_field_values (
  task_id uuid not null references tp_tasks(id) on delete cascade,
  custom_field_id uuid not null references tp_custom_fields(id) on delete cascade,
  value text,
  primary key (task_id, custom_field_id)
);
create index tp_task_custom_field_values_field_idx on tp_task_custom_field_values(custom_field_id);

alter table tp_custom_fields enable row level security;
alter table tp_task_custom_field_values enable row level security;

-- Same admin-write/org-read shape as tp_teams (migration 0008).
create policy tp_custom_fields_select on tp_custom_fields for select using (organization_id = tp_private.current_org_id());
create policy tp_custom_fields_write on tp_custom_fields for all using (
  organization_id = tp_private.current_org_id()
  and exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role = 'admin')
) with check (
  organization_id = tp_private.current_org_id()
  and exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Values: same looseness as tp_task_followers (migration 0008) — anyone who
-- can see the parent task can set its field values.
create policy tp_task_custom_field_values_all on tp_task_custom_field_values for all using (
  exists (select 1 from tp_tasks t where t.id = task_id and t.organization_id = tp_private.current_org_id())
) with check (
  exists (select 1 from tp_tasks t where t.id = task_id and t.organization_id = tp_private.current_org_id())
);
