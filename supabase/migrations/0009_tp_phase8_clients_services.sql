-- Phase 8: Client & Service linking — simple admin-managed named lists,
-- assignable to tasks, mirroring the tp_teams shape from Phase 7.

create table tp_clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references tp_organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index tp_clients_org_idx on tp_clients(organization_id);

create table tp_services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references tp_organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index tp_services_org_idx on tp_services(organization_id);

alter table tp_tasks add column client_id uuid references tp_clients(id) on delete set null;
alter table tp_tasks add column service_id uuid references tp_services(id) on delete set null;
create index tp_tasks_client_idx on tp_tasks(client_id);
create index tp_tasks_service_idx on tp_tasks(service_id);

alter table tp_clients enable row level security;
alter table tp_services enable row level security;

-- Same admin-write/org-read shape as tp_teams (migration 0008).
create policy tp_clients_select on tp_clients for select using (organization_id = tp_private.current_org_id());
create policy tp_clients_write on tp_clients for all using (
  organization_id = tp_private.current_org_id()
  and exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role = 'admin')
) with check (
  organization_id = tp_private.current_org_id()
  and exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy tp_services_select on tp_services for select using (organization_id = tp_private.current_org_id());
create policy tp_services_write on tp_services for all using (
  organization_id = tp_private.current_org_id()
  and exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role = 'admin')
) with check (
  organization_id = tp_private.current_org_id()
  and exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role = 'admin')
);
