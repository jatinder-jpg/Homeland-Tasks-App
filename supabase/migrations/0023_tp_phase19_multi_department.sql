create table tp_task_departments (
  task_id uuid not null references tp_tasks(id) on delete cascade,
  department_id uuid not null references tp_departments(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, department_id)
);
create index tp_task_departments_department_idx on tp_task_departments(department_id);

alter table tp_task_departments enable row level security;

-- Same visibility gate as every other task-linked table.
create policy tp_task_departments_all on tp_task_departments for all using (
  tp_private.can_view_task(task_id)
) with check (
  tp_private.can_view_task(task_id)
);

-- Backfill: every existing task's single department becomes its first row.
insert into tp_task_departments (task_id, department_id)
select id, department_id from tp_tasks where department_id is not null
on conflict do nothing;
