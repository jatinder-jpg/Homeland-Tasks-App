-- Taskopad clone Phase 4 schema: Documents (personal drive) + Notes.
-- Visibility is org-wide (matches real app's "Shared with Me" showing other
-- members' items); only the owner can insert/update/delete their own rows.

create table tp_folders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references tp_organizations(id) on delete cascade,
  owner_id uuid not null references tp_profiles(id) on delete cascade,
  parent_id uuid references tp_folders(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index tp_folders_org_idx on tp_folders(organization_id);
create index tp_folders_parent_idx on tp_folders(parent_id);
create index tp_folders_owner_idx on tp_folders(owner_id);

create table tp_files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references tp_organizations(id) on delete cascade,
  owner_id uuid not null references tp_profiles(id) on delete cascade,
  folder_id uuid references tp_folders(id) on delete cascade,
  task_id uuid references tp_tasks(id) on delete set null,
  name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);
create index tp_files_org_idx on tp_files(organization_id);
create index tp_files_folder_idx on tp_files(folder_id);
create index tp_files_owner_idx on tp_files(owner_id);

create table tp_folder_stars (
  profile_id uuid not null references tp_profiles(id) on delete cascade,
  folder_id uuid not null references tp_folders(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, folder_id)
);
create index tp_folder_stars_folder_idx on tp_folder_stars(folder_id);

create table tp_file_stars (
  profile_id uuid not null references tp_profiles(id) on delete cascade,
  file_id uuid not null references tp_files(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, file_id)
);
create index tp_file_stars_file_idx on tp_file_stars(file_id);

create table tp_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references tp_organizations(id) on delete cascade,
  owner_id uuid not null references tp_profiles(id) on delete cascade,
  title text not null default '',
  body_html text not null default '',
  color text not null default 'yellow',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tp_notes_org_idx on tp_notes(organization_id);
create index tp_notes_owner_idx on tp_notes(owner_id);

create table tp_note_stars (
  profile_id uuid not null references tp_profiles(id) on delete cascade,
  note_id uuid not null references tp_notes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, note_id)
);
create index tp_note_stars_note_idx on tp_note_stars(note_id);

alter table tp_folders enable row level security;
alter table tp_files enable row level security;
alter table tp_folder_stars enable row level security;
alter table tp_file_stars enable row level security;
alter table tp_notes enable row level security;
alter table tp_note_stars enable row level security;

create policy tp_folders_select on tp_folders for select using (organization_id = tp_private.current_org_id());
create policy tp_folders_insert on tp_folders for insert with check (organization_id = tp_private.current_org_id() and owner_id = auth.uid());
create policy tp_folders_update on tp_folders for update using (owner_id = auth.uid());
create policy tp_folders_delete on tp_folders for delete using (owner_id = auth.uid());

create policy tp_files_select on tp_files for select using (organization_id = tp_private.current_org_id());
create policy tp_files_insert on tp_files for insert with check (organization_id = tp_private.current_org_id() and owner_id = auth.uid());
create policy tp_files_update on tp_files for update using (owner_id = auth.uid());
create policy tp_files_delete on tp_files for delete using (owner_id = auth.uid());

create policy tp_folder_stars_select on tp_folder_stars for select using (profile_id = auth.uid());
create policy tp_folder_stars_insert on tp_folder_stars for insert with check (
  profile_id = auth.uid()
  and exists (select 1 from tp_folders f where f.id = folder_id and f.organization_id = tp_private.current_org_id())
);
create policy tp_folder_stars_delete on tp_folder_stars for delete using (profile_id = auth.uid());

create policy tp_file_stars_select on tp_file_stars for select using (profile_id = auth.uid());
create policy tp_file_stars_insert on tp_file_stars for insert with check (
  profile_id = auth.uid()
  and exists (select 1 from tp_files fl where fl.id = file_id and fl.organization_id = tp_private.current_org_id())
);
create policy tp_file_stars_delete on tp_file_stars for delete using (profile_id = auth.uid());

create policy tp_notes_select on tp_notes for select using (organization_id = tp_private.current_org_id());
create policy tp_notes_insert on tp_notes for insert with check (organization_id = tp_private.current_org_id() and owner_id = auth.uid());
create policy tp_notes_update on tp_notes for update using (owner_id = auth.uid());
create policy tp_notes_delete on tp_notes for delete using (owner_id = auth.uid());

create policy tp_note_stars_select on tp_note_stars for select using (profile_id = auth.uid());
create policy tp_note_stars_insert on tp_note_stars for insert with check (
  profile_id = auth.uid()
  and exists (select 1 from tp_notes n where n.id = note_id and n.organization_id = tp_private.current_org_id())
);
create policy tp_note_stars_delete on tp_note_stars for delete using (profile_id = auth.uid());
