alter table tp_projects add column geofence_lat double precision;
alter table tp_projects add column geofence_lng double precision;
alter table tp_projects add column geofence_radius_m integer;

create table tp_attendance_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references tp_organizations(id) on delete cascade,
  profile_id uuid not null references tp_profiles(id) on delete cascade,
  project_id uuid references tp_projects(id) on delete set null,
  check_in_at timestamptz not null default now(),
  check_in_lat double precision not null,
  check_in_lng double precision not null,
  check_out_at timestamptz,
  check_out_lat double precision,
  check_out_lng double precision,
  created_at timestamptz not null default now()
);
create index tp_attendance_records_org_idx on tp_attendance_records(organization_id);
create index tp_attendance_records_profile_idx on tp_attendance_records(profile_id, check_in_at);

alter table tp_attendance_records enable row level security;

create policy tp_attendance_records_select on tp_attendance_records for select using (
  organization_id = tp_private.current_org_id()
);
create policy tp_attendance_records_insert on tp_attendance_records for insert with check (
  profile_id = auth.uid() and organization_id = tp_private.current_org_id()
);
create policy tp_attendance_records_update on tp_attendance_records for update using (
  profile_id = auth.uid()
);
