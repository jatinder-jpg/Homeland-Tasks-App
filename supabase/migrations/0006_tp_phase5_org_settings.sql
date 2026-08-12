-- Phase 5: Settings needs to let admins edit organization details.
-- tp_organizations previously had select-only RLS; add an admin-only update policy.

create policy tp_organizations_update on tp_organizations for update using (
  id = tp_private.current_org_id()
  and exists (select 1 from tp_profiles p where p.id = auth.uid() and p.role = 'admin')
);
