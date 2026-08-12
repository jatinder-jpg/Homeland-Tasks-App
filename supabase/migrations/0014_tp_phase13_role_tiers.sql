alter table tp_profiles drop constraint tp_profiles_role_check;
alter table tp_profiles add constraint tp_profiles_role_check check (role in ('super_admin','admin','member'));

-- Backfill: the earliest-created 'admin' profile per org (the founder) becomes super_admin.
update tp_profiles p set role = 'super_admin'
where role = 'admin'
  and p.created_at = (
    select min(p2.created_at) from tp_profiles p2
    where p2.organization_id = p.organization_id and p2.role = 'admin'
  );

-- New signups: founder becomes super_admin instead of admin.
create or replace function tp_create_organization_and_admin(org_name text, admin_full_name text)
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
  values (auth.uid(), new_org_id, admin_full_name, 'super_admin');

  return new_org_id;
end;
$$;

-- Column-level guard: only a super_admin may change anyone's role, and the last
-- super_admin in an org can never be demoted.
create or replace function tp_private.enforce_profile_role_change()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  actor_role text;
  remaining int;
begin
  if new.role is distinct from old.role then
    select role into actor_role from tp_profiles where id = auth.uid();
    if actor_role is distinct from 'super_admin' then
      raise exception 'Only a super admin can change member roles';
    end if;
    if old.role = 'super_admin' and new.role != 'super_admin' then
      select count(*) into remaining from tp_profiles
        where organization_id = old.organization_id and role = 'super_admin' and id != old.id;
      if remaining = 0 then
        raise exception 'An organization must always have a super admin';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tp_profiles_role_change_guard on tp_profiles;
create trigger tp_profiles_role_change_guard
  before update on tp_profiles
  for each row execute function tp_private.enforce_profile_role_change();

-- Widen existing admin-gated RLS policies to admin OR super_admin.
drop policy tp_tasks_delete on tp_tasks;
create policy tp_tasks_delete on tp_tasks
  for delete using (
    organization_id = tp_private.current_org_id()
    and (
      created_by = auth.uid()
      or exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin'))
    )
  );

drop policy tp_projects_delete on tp_projects;
create policy tp_projects_delete on tp_projects for delete using (
  organization_id = tp_private.current_org_id()
  and (created_by = auth.uid() or exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin')))
);

drop policy tp_teams_write on tp_teams;
create policy tp_teams_write on tp_teams for all using (
  organization_id = tp_private.current_org_id()
  and exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin'))
) with check (
  organization_id = tp_private.current_org_id()
  and exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin'))
);

drop policy tp_clients_write on tp_clients;
create policy tp_clients_write on tp_clients for all using (
  organization_id = tp_private.current_org_id()
  and exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin'))
) with check (
  organization_id = tp_private.current_org_id()
  and exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin'))
);

drop policy tp_services_write on tp_services;
create policy tp_services_write on tp_services for all using (
  organization_id = tp_private.current_org_id()
  and exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin'))
) with check (
  organization_id = tp_private.current_org_id()
  and exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin'))
);

drop policy tp_custom_fields_write on tp_custom_fields;
create policy tp_custom_fields_write on tp_custom_fields for all using (
  organization_id = tp_private.current_org_id()
  and exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin'))
) with check (
  organization_id = tp_private.current_org_id()
  and exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin'))
);

drop policy tp_profiles_update_admin on tp_profiles;
create policy tp_profiles_update_admin on tp_profiles
  for update using (
    organization_id = tp_private.current_org_id()
    and exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin'))
  );

-- Org settings become super_admin-exclusive.
drop policy tp_organizations_update on tp_organizations;
create policy tp_organizations_update on tp_organizations for update using (
  id = tp_private.current_org_id()
  and exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role = 'super_admin')
);
