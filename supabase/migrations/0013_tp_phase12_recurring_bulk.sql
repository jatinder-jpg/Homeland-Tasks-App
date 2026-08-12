alter table tp_tasks add column is_recurring boolean not null default false;
alter table tp_tasks add column recurrence_frequency text check (recurrence_frequency in ('daily', 'weekly', 'monthly'));
alter table tp_tasks add column recurrence_interval smallint not null default 1;
alter table tp_tasks add column recurrence_end_date date;
alter table tp_tasks add column parent_recurring_task_id uuid references tp_tasks(id) on delete set null;
create index tp_tasks_recurring_idx on tp_tasks(organization_id, is_recurring);
