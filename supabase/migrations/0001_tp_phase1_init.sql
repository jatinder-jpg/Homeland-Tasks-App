-- Taskopad clone Phase 1 schema (tp_ prefixed to avoid collisions with
-- pre-existing tables in this shared Supabase project)

create table tp_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  address text,
  country text,
  phone text,
  billing_email text,
  gst_number text,
  created_at timestamptz not null default now()
);

create table tp_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references tp_organizations(id) on delete cascade,
  full_name text not null,
  phone text,
  avatar_color text,
  role text not null default 'member' check (role in ('admin','member')),
  created_at timestamptz not null default now()
);
create index tp_profiles_org_idx on tp_profiles(organization_id);

create table tp_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references tp_organizations(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'open' check (status in ('open','in_progress','done')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  due_date date,
  is_pinned boolean not null default false,
  is_draft boolean not null default false,
  assignee_id uuid references tp_profiles(id) on delete set null,
  created_by uuid not null references tp_profiles(id) on delete restrict,
  position int not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tp_tasks_org_idx on tp_tasks(organization_id);
create index tp_tasks_org_due_idx on tp_tasks(organization_id, due_date);
create index tp_tasks_org_assignee_idx on tp_tasks(organization_id, assignee_id);
create index tp_tasks_org_status_idx on tp_tasks(organization_id, status);

create view tp_task_monthly_stats with (security_invoker = true) as
select organization_id,
  date_trunc('month', coalesce(completed_at, due_date, created_at)) as period,
  count(*) filter (where status = 'done') as completed,
  count(*) filter (where status != 'done') as incomplete
from tp_tasks where is_draft = false
group by organization_id, period;

-- RLS
alter table tp_organizations enable row level security;
alter table tp_profiles enable row level security;
alter table tp_tasks enable row level security;

create schema if not exists tp_private;

create function tp_private.current_org_id() returns uuid
language sql stable security definer set search_path = public as $$
  select organization_id from tp_profiles where id = auth.uid()
$$;

create policy tp_organizations_select on tp_organizations
  for select using (id = tp_private.current_org_id());

create policy tp_profiles_select on tp_profiles
  for select using (organization_id = tp_private.current_org_id());

create policy tp_profiles_update_self on tp_profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

create policy tp_profiles_update_admin on tp_profiles
  for update using (
    organization_id = tp_private.current_org_id()
    and exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy tp_tasks_select on tp_tasks
  for select using (organization_id = tp_private.current_org_id());

create policy tp_tasks_insert on tp_tasks
  for insert with check (organization_id = tp_private.current_org_id());

create policy tp_tasks_update on tp_tasks
  for update using (organization_id = tp_private.current_org_id())
  with check (organization_id = tp_private.current_org_id());

create policy tp_tasks_delete on tp_tasks
  for delete using (
    organization_id = tp_private.current_org_id()
    and (
      created_by = auth.uid()
      or exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role = 'admin')
    )
  );

-- Signup RPC: atomically creates org + admin profile, bypassing RLS via security definer
create function tp_create_organization_and_admin(org_name text, admin_full_name text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  new_org_id uuid;
  new_code text;
  attempt int := 0;
begin
  loop
    new_code := 'T-' || lpad((floor(random() * 90000) + 10000)::text, 5, '0');
    begin
      insert into tp_organizations (name, code) values (org_name, new_code) returning id into new_org_id;
      exit;
    exception when unique_violation then
      attempt := attempt + 1;
      if attempt > 10 then
        raise exception 'Could not generate unique organization code';
      end if;
    end;
  end loop;

  insert into tp_profiles (id, organization_id, full_name, role)
  values (auth.uid(), new_org_id, admin_full_name, 'admin');

  return new_org_id;
end;
$$;

revoke execute on function tp_create_organization_and_admin(text, text) from anon;
grant execute on function tp_create_organization_and_admin(text, text) to authenticated;
