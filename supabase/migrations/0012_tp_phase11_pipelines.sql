-- Phase 11: Custom Kanban Pipelines — opt-in, user-defined stage sets that
-- coexist with the fixed open/in_progress/done board (tp_tasks.status is
-- untouched; pipeline_stage_id is a separate, independent column).

create table tp_pipelines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references tp_organizations(id) on delete cascade,
  name text not null,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  created_by uuid not null references tp_profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index tp_pipelines_org_idx on tp_pipelines(organization_id);

create table tp_pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references tp_pipelines(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index tp_pipeline_stages_pipeline_idx on tp_pipeline_stages(pipeline_id, position);

alter table tp_tasks add column pipeline_stage_id uuid references tp_pipeline_stages(id) on delete set null;
create index tp_tasks_pipeline_stage_idx on tp_tasks(pipeline_stage_id);

alter table tp_pipelines enable row level security;
alter table tp_pipeline_stages enable row level security;

create policy tp_pipelines_select on tp_pipelines for select using (
  organization_id = tp_private.current_org_id()
  and (visibility = 'public' or created_by = auth.uid())
);
create policy tp_pipelines_write on tp_pipelines for all using (
  created_by = auth.uid()
) with check (
  organization_id = tp_private.current_org_id() and created_by = auth.uid()
);

create policy tp_pipeline_stages_select on tp_pipeline_stages for select using (
  exists (
    select 1 from tp_pipelines p where p.id = pipeline_id
    and p.organization_id = tp_private.current_org_id()
    and (p.visibility = 'public' or p.created_by = auth.uid())
  )
);
create policy tp_pipeline_stages_write on tp_pipeline_stages for all using (
  exists (select 1 from tp_pipelines p where p.id = pipeline_id and p.created_by = auth.uid())
) with check (
  exists (select 1 from tp_pipelines p where p.id = pipeline_id and p.created_by = auth.uid())
);
