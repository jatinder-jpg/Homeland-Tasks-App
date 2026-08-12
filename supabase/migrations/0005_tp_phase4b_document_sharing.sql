-- Phase 4b: explicit file/folder sharing with specific employees.
-- Documents move from org-wide visibility to owner-or-shared. A folder share
-- cascades to files inside it without needing individual file shares.

create table tp_folder_shares (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references tp_folders(id) on delete cascade,
  shared_with_id uuid not null references tp_profiles(id) on delete cascade,
  shared_by_id uuid not null references tp_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (folder_id, shared_with_id)
);
create index tp_folder_shares_shared_with_idx on tp_folder_shares(shared_with_id);

create table tp_file_shares (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references tp_files(id) on delete cascade,
  shared_with_id uuid not null references tp_profiles(id) on delete cascade,
  shared_by_id uuid not null references tp_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (file_id, shared_with_id)
);
create index tp_file_shares_shared_with_idx on tp_file_shares(shared_with_id);

alter table tp_folder_shares enable row level security;
alter table tp_file_shares enable row level security;

create policy tp_folder_shares_select on tp_folder_shares for select using (
  shared_with_id = auth.uid() or shared_by_id = auth.uid()
);
create policy tp_folder_shares_insert on tp_folder_shares for insert with check (
  shared_by_id = auth.uid()
  and exists (select 1 from tp_folders f where f.id = folder_id and f.owner_id = auth.uid())
  and exists (select 1 from tp_profiles p where p.id = shared_with_id and p.organization_id = tp_private.current_org_id())
);
create policy tp_folder_shares_delete on tp_folder_shares for delete using (
  shared_by_id = auth.uid() or shared_with_id = auth.uid()
);

create policy tp_file_shares_select on tp_file_shares for select using (
  shared_with_id = auth.uid() or shared_by_id = auth.uid()
);
create policy tp_file_shares_insert on tp_file_shares for insert with check (
  shared_by_id = auth.uid()
  and exists (select 1 from tp_files fl where fl.id = file_id and fl.owner_id = auth.uid())
  and exists (select 1 from tp_profiles p where p.id = shared_with_id and p.organization_id = tp_private.current_org_id())
);
create policy tp_file_shares_delete on tp_file_shares for delete using (
  shared_by_id = auth.uid() or shared_with_id = auth.uid()
);

-- Tighten existing select policies: owner OR explicitly shared OR (for files) parent folder is shared.
-- Note: the exists() subqueries below must qualify the outer table's `id`
-- explicitly (tp_folders.id / tp_files.id) rather than a bare `id` — the
-- share tables also have their own `id` primary key column, so an
-- unqualified `id` resolves to the innermost scope (fs.id) instead of the
-- outer row, silently turning the check into `fs.folder_id = fs.id` and
-- breaking sharing entirely. Caught via live RLS simulation.
drop policy tp_folders_select on tp_folders;
create policy tp_folders_select on tp_folders for select using (
  organization_id = tp_private.current_org_id()
  and (
    owner_id = auth.uid()
    or exists (select 1 from tp_folder_shares fs where fs.folder_id = tp_folders.id and fs.shared_with_id = auth.uid())
  )
);

drop policy tp_files_select on tp_files;
create policy tp_files_select on tp_files for select using (
  organization_id = tp_private.current_org_id()
  and (
    owner_id = auth.uid()
    or exists (select 1 from tp_file_shares fs where fs.file_id = tp_files.id and fs.shared_with_id = auth.uid())
    or exists (select 1 from tp_folder_shares fs where fs.folder_id = tp_files.folder_id and fs.shared_with_id = auth.uid())
  )
);

alter table tp_notifications drop constraint tp_notifications_type_check;
alter table tp_notifications add constraint tp_notifications_type_check
  check (type in ('task_assigned','project_assigned','discussion_message','folder_shared','file_shared'));
