alter table tp_notifications drop constraint tp_notifications_type_check;
alter table tp_notifications add constraint tp_notifications_type_check
  check (type in ('task_assigned', 'project_assigned', 'discussion_message', 'folder_shared', 'file_shared', 'task_urgent_alert', 'task_review_requested'));
