-- Demo task seed data for Phase 1 verification.
--
-- Auth users/profiles are NOT created here. Real accounts must be created
-- through the app's own sign-up flow (a real person entering their own
-- credentials) rather than fabricated via SQL. After signing up once through
-- /sign-up, replace the placeholders below with the real org id and profile
-- id (find them with: select id from tp_organizations; select id from tp_profiles;)
-- and run this script to populate demo tasks for that org.

-- Replace before running:
--   :org_id      -- the organization id created by the RPC during sign-up
--   :profile_id  -- the admin profile id (same as the auth user id)

insert into tp_tasks (organization_id, name, status, priority, due_date, is_pinned, is_draft, assignee_id, created_by, completed_at, created_at)
values
  -- Pinned
  (:'org_id', 'Qwik Print quotation', 'done', 'medium', current_date - 3, true, false, :'profile_id', :'profile_id', now() - interval '1 day', now() - interval '5 day'),

  -- Today
  (:'org_id', 'Send weekly status update', 'open', 'medium', current_date, false, false, :'profile_id', :'profile_id', null, now()),
  (:'org_id', 'Review vendor contract', 'in_progress', 'high', current_date, false, false, null, :'profile_id', null, now()),

  -- Overdue
  (:'org_id', 'Corporate office entry door lock fix', 'open', 'high', current_date - 6, false, false, :'profile_id', :'profile_id', null, now() - interval '10 day'),
  (:'org_id', 'Prepaid system rollout for all accounts', 'open', 'high', current_date - 4, false, false, null, :'profile_id', null, now() - interval '8 day'),
  (:'org_id', 'G-Suite user pricing improvements', 'in_progress', 'medium', current_date - 2, false, false, :'profile_id', :'profile_id', null, now() - interval '6 day'),
  (:'org_id', 'Dancing balls display on 4th floor', 'done', 'low', current_date - 5, false, false, null, :'profile_id', now() - interval '1 day', now() - interval '7 day'),

  -- Upcoming
  (:'org_id', 'Prepare Q3 board deck', 'open', 'high', current_date + 3, false, false, :'profile_id', :'profile_id', null, now()),
  (:'org_id', 'Renew office internet contract', 'open', 'low', current_date + 7, false, false, null, :'profile_id', null, now()),
  (:'org_id', 'Plan team offsite', 'open', 'medium', current_date + 14, false, false, :'profile_id', :'profile_id', null, now()),

  -- No due date
  (:'org_id', 'Research alternative CRM vendors', 'open', 'low', null, false, false, null, :'profile_id', null, now()),
  (:'org_id', 'Draft new employee handbook section', 'open', 'medium', null, false, true, :'profile_id', :'profile_id', null, now()),

  -- Closed today (for Today's Summary)
  (:'org_id', 'Approve marketing budget', 'done', 'medium', current_date, false, false, :'profile_id', :'profile_id', now(), now()),

  -- Spread across past months (for the Statistics chart)
  (:'org_id', 'March infra review', 'done', 'medium', date_trunc('month', current_date) - interval '5 month', false, false, :'profile_id', :'profile_id', date_trunc('month', current_date) - interval '5 month', date_trunc('month', current_date) - interval '5 month'),
  (:'org_id', 'April vendor audit', 'done', 'medium', date_trunc('month', current_date) - interval '4 month', false, false, null, :'profile_id', date_trunc('month', current_date) - interval '4 month', date_trunc('month', current_date) - interval '4 month'),
  (:'org_id', 'May client onboarding batch', 'done', 'high', date_trunc('month', current_date) - interval '3 month', false, false, :'profile_id', :'profile_id', date_trunc('month', current_date) - interval '3 month', date_trunc('month', current_date) - interval '3 month'),
  (:'org_id', 'May follow-ups', 'open', 'medium', date_trunc('month', current_date) - interval '3 month', false, false, null, :'profile_id', null, date_trunc('month', current_date) - interval '3 month'),
  (:'org_id', 'June compliance checklist', 'done', 'low', date_trunc('month', current_date) - interval '2 month', false, false, :'profile_id', :'profile_id', date_trunc('month', current_date) - interval '2 month', date_trunc('month', current_date) - interval '2 month'),
  (:'org_id', 'July hiring pipeline review', 'open', 'medium', date_trunc('month', current_date) - interval '1 month', false, false, null, :'profile_id', null, date_trunc('month', current_date) - interval '1 month');
