-- Lets a not-yet-signed-up visitor check an organization code before creating
-- an account (so bad codes fail fast in the sign-up form, not after an email
-- confirmation round-trip). Returns only the org name — no sensitive data.
-- Lives in public (not tp_private) because PostgREST only exposes .rpc()
-- calls for functions in the public schema.
create or replace function tp_lookup_org_name_by_code(p_code text)
returns text
language sql security definer set search_path = public stable as $$
  select name from tp_organizations where code = p_code;
$$;

revoke execute on function tp_lookup_org_name_by_code(text) from public;
grant execute on function tp_lookup_org_name_by_code(text) to anon, authenticated;

-- Joins an existing organization as a member (mirrors tp_create_organization_and_admin,
-- but attaches to an existing org by code instead of creating a new one).
create or replace function tp_join_organization(org_code text, member_full_name text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  target_org_id uuid;
begin
  select id into target_org_id from tp_organizations where code = org_code;
  if target_org_id is null then
    raise exception 'Invalid organization code';
  end if;

  insert into tp_profiles (id, organization_id, full_name, role)
  values (auth.uid(), target_org_id, member_full_name, 'member');

  return target_org_id;
end;
$$;

revoke execute on function tp_join_organization(text, text) from anon;
grant execute on function tp_join_organization(text, text) to authenticated;
