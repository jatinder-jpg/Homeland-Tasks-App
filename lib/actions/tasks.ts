"use server";

import { revalidatePath } from "next/cache";
import { addDays, addWeeks, addMonths } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/actions/notifications";
import { getTaskDetail, type TaskDetail } from "@/lib/queries/tasks";
import { logTaskActivity, markTaskReadAction } from "@/lib/actions/task-activity";

function revalidateTaskViews() {
  revalidatePath("/dashboard");
  revalidatePath("/task");
  revalidatePath("/task/kanban");
  revalidatePath("/task/calendar");
  revalidatePath("/project", "layout");
}

export type WorkflowStatus =
  | "pending"
  | "approval_awaiting"
  | "in_progress"
  | "on_hold"
  | "third_party_pending"
  | "under_review";

export type TaskInput = {
  name: string;
  description?: string;
  priority: "low" | "medium" | "high";
  dueDate?: string | null;
  assigneeIds?: string[];
  projectId?: string | null;
  isPinned?: boolean;
  isDraft?: boolean;
  siteVisit?: boolean;
  departmentIds?: string[];
  clientId?: string | null;
  serviceId?: string | null;
  progress?: number;
  remindAt?: string | null;
  workflowStatus?: WorkflowStatus;
  subtasksMandatory?: boolean;
  checklistMandatory?: boolean;
  followerIds?: string[];
  customFieldValues?: Record<string, string>;
  isRecurring?: boolean;
  recurrenceFrequency?: "daily" | "weekly" | "monthly" | null;
  recurrenceInterval?: number;
  recurrenceEndDate?: string | null;
};

async function syncTaskFollowers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string,
  followerIds: string[],
) {
  const { data: current } = await supabase.from("tp_task_followers").select("profile_id").eq("task_id", taskId);
  const currentIds = new Set((current ?? []).map((r) => r.profile_id));
  const nextIds = new Set(followerIds);

  const toAdd = followerIds.filter((id) => !currentIds.has(id));
  const toRemove = [...currentIds].filter((id) => !nextIds.has(id));

  if (toAdd.length > 0) {
    await supabase.from("tp_task_followers").insert(toAdd.map((profile_id) => ({ task_id: taskId, profile_id })));
  }
  if (toRemove.length > 0) {
    await supabase.from("tp_task_followers").delete().eq("task_id", taskId).in("profile_id", toRemove);
  }
}

async function syncTaskAssignees(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string,
  assigneeIds: string[],
): Promise<{ added: string[]; removed: string[] }> {
  const { data: current } = await supabase.from("tp_task_assignees").select("profile_id").eq("task_id", taskId);
  const currentIds = new Set((current ?? []).map((r) => r.profile_id));
  const nextIds = new Set(assigneeIds);

  const added = assigneeIds.filter((id) => !currentIds.has(id));
  const removed = [...currentIds].filter((id) => !nextIds.has(id));

  if (added.length > 0) {
    await supabase.from("tp_task_assignees").insert(added.map((profile_id) => ({ task_id: taskId, profile_id })));
  }
  if (removed.length > 0) {
    await supabase.from("tp_task_assignees").delete().eq("task_id", taskId).in("profile_id", removed);
  }
  return { added, removed };
}

async function syncTaskDepartments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string,
  departmentIds: string[],
) {
  const { data: current } = await supabase
    .from("tp_task_departments")
    .select("department_id")
    .eq("task_id", taskId);
  const currentIds = new Set((current ?? []).map((r) => r.department_id));
  const nextIds = new Set(departmentIds);

  const toAdd = departmentIds.filter((id) => !currentIds.has(id));
  const toRemove = [...currentIds].filter((id) => !nextIds.has(id));

  if (toAdd.length > 0) {
    await supabase
      .from("tp_task_departments")
      .insert(toAdd.map((department_id) => ({ task_id: taskId, department_id })));
  }
  if (toRemove.length > 0) {
    await supabase.from("tp_task_departments").delete().eq("task_id", taskId).in("department_id", toRemove);
  }
}

async function upsertCustomFieldValues(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string,
  values: Record<string, string>,
) {
  const rows = Object.entries(values).map(([custom_field_id, value]) => ({
    task_id: taskId,
    custom_field_id,
    value,
  }));
  if (rows.length === 0) return;
  await supabase.from("tp_task_custom_field_values").upsert(rows, { onConflict: "task_id,custom_field_id" });
}

async function spawnNextRecurrence(
  supabase: Awaited<ReturnType<typeof createClient>>,
  task: {
    id: string;
    name: string;
    description: string | null;
    priority: string;
    due_date: string | null;
    assignee_id: string | null;
    project_id: string | null;
    department_id: string | null;
    client_id: string | null;
    service_id: string | null;
    organization_id: string;
    created_by: string;
    is_recurring: boolean;
    recurrence_frequency: string | null;
    recurrence_interval: number;
    recurrence_end_date: string | null;
    parent_recurring_task_id: string | null;
  },
) {
  if (!task.is_recurring || !task.recurrence_frequency) return;

  const base = task.due_date ? new Date(task.due_date + "T00:00:00") : new Date();
  const interval = task.recurrence_interval || 1;
  const next =
    task.recurrence_frequency === "daily"
      ? addDays(base, interval)
      : task.recurrence_frequency === "weekly"
        ? addWeeks(base, interval)
        : addMonths(base, interval);

  if (task.recurrence_end_date && next > new Date(task.recurrence_end_date + "T00:00:00")) return;

  const { data: newTask } = await supabase
    .from("tp_tasks")
    .insert({
      organization_id: task.organization_id,
      name: task.name,
      description: task.description,
      priority: task.priority,
      due_date: next.toISOString().slice(0, 10),
      assignee_id: task.assignee_id,
      project_id: task.project_id,
      department_id: task.department_id,
      client_id: task.client_id,
      service_id: task.service_id,
      is_recurring: true,
      recurrence_frequency: task.recurrence_frequency,
      recurrence_interval: task.recurrence_interval,
      recurrence_end_date: task.recurrence_end_date,
      parent_recurring_task_id: task.parent_recurring_task_id ?? task.id,
      created_by: task.created_by,
    })
    .select("id")
    .single();

  if (!newTask) return;

  const { data: assignees } = await supabase.from("tp_task_assignees").select("profile_id").eq("task_id", task.id);
  if (assignees && assignees.length > 0) {
    await supabase
      .from("tp_task_assignees")
      .insert(assignees.map((a) => ({ task_id: newTask.id, profile_id: a.profile_id })));
  }

  const { data: departments } = await supabase
    .from("tp_task_departments")
    .select("department_id")
    .eq("task_id", task.id);
  if (departments && departments.length > 0) {
    await supabase
      .from("tp_task_departments")
      .insert(departments.map((d) => ({ task_id: newTask.id, department_id: d.department_id })));
  }
}

export async function createTaskAction(input: TaskInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("tp_profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "No profile found" };

  const { data: task, error } = await supabase
    .from("tp_tasks")
    .insert({
      organization_id: profile.organization_id,
      name: input.name,
      description: input.description || null,
      priority: input.priority,
      due_date: input.dueDate || null,
      assignee_id: input.assigneeIds?.[0] || null,
      project_id: input.projectId || null,
      is_pinned: input.isPinned ?? false,
      is_draft: input.isDraft ?? false,
      site_visit: input.siteVisit ?? false,
      department_id: input.departmentIds?.[0] || null,
      client_id: input.clientId || null,
      service_id: input.serviceId || null,
      progress: input.progress ?? 0,
      remind_at: input.remindAt || null,
      workflow_status: input.workflowStatus ?? "pending",
      subtasks_mandatory: input.subtasksMandatory ?? false,
      checklist_mandatory: input.checklistMandatory ?? false,
      is_recurring: input.isRecurring ?? false,
      recurrence_frequency: input.recurrenceFrequency || null,
      recurrence_interval: input.recurrenceInterval ?? 1,
      recurrence_end_date: input.recurrenceEndDate || null,
      created_by: user.id,
    })
    .select("id, name")
    .single();

  if (error) return { error: error.message };

  if (input.followerIds && input.followerIds.length > 0) {
    await syncTaskFollowers(supabase, task.id, input.followerIds);
  }

  if (input.departmentIds && input.departmentIds.length > 0) {
    await syncTaskDepartments(supabase, task.id, input.departmentIds);
  }

  if (input.customFieldValues) {
    await upsertCustomFieldValues(supabase, task.id, input.customFieldValues);
  }

  if (input.assigneeIds && input.assigneeIds.length > 0) {
    const { added } = await syncTaskAssignees(supabase, task.id, input.assigneeIds);
    const notifyIds = added.filter((id) => id !== user.id);

    if (notifyIds.length > 0) {
      const { data: actorProfile } = await supabase
        .from("tp_profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      await Promise.all(
        notifyIds.map((recipientId) =>
          createNotification({
            organizationId: profile.organization_id,
            recipientId,
            actorId: user.id,
            type: "task_assigned",
            title: `${actorProfile?.full_name ?? "Someone"} assigned you a task`,
            body: task.name,
            link: "/task",
          }),
        ),
      );
    }
  }

  revalidateTaskViews();
  return { success: true, id: task.id };
}

export async function updateTaskAction(taskId: string, input: Partial<TaskInput>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existingTask } = await supabase
    .from("tp_tasks")
    .select("assignee_id, name, organization_id, workflow_status")
    .eq("id", taskId)
    .single();

  const { error } = await supabase
    .from("tp_tasks")
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description || null }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.dueDate !== undefined && { due_date: input.dueDate || null }),
      ...(input.assigneeIds !== undefined && { assignee_id: input.assigneeIds[0] || null }),
      ...(input.projectId !== undefined && { project_id: input.projectId || null }),
      ...(input.isPinned !== undefined && { is_pinned: input.isPinned }),
      ...(input.isDraft !== undefined && { is_draft: input.isDraft }),
      ...(input.siteVisit !== undefined && { site_visit: input.siteVisit }),
      ...(input.departmentIds !== undefined && { department_id: input.departmentIds[0] || null }),
      ...(input.clientId !== undefined && { client_id: input.clientId || null }),
      ...(input.serviceId !== undefined && { service_id: input.serviceId || null }),
      ...(input.progress !== undefined && { progress: input.progress }),
      ...(input.remindAt !== undefined && { remind_at: input.remindAt || null }),
      ...(input.workflowStatus !== undefined && { workflow_status: input.workflowStatus }),
      ...(input.subtasksMandatory !== undefined && { subtasks_mandatory: input.subtasksMandatory }),
      ...(input.checklistMandatory !== undefined && { checklist_mandatory: input.checklistMandatory }),
      ...(input.isRecurring !== undefined && { is_recurring: input.isRecurring }),
      ...(input.recurrenceFrequency !== undefined && { recurrence_frequency: input.recurrenceFrequency || null }),
      ...(input.recurrenceInterval !== undefined && { recurrence_interval: input.recurrenceInterval }),
      ...(input.recurrenceEndDate !== undefined && { recurrence_end_date: input.recurrenceEndDate || null }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) return { error: error.message };

  if (input.followerIds !== undefined) {
    await syncTaskFollowers(supabase, taskId, input.followerIds);
  }

  if (input.departmentIds !== undefined) {
    await syncTaskDepartments(supabase, taskId, input.departmentIds);
  }

  if (input.customFieldValues) {
    await upsertCustomFieldValues(supabase, taskId, input.customFieldValues);
  }

  if (
    existingTask &&
    input.workflowStatus !== undefined &&
    input.workflowStatus !== existingTask.workflow_status
  ) {
    await logTaskActivity(supabase, {
      taskId,
      actorId: user.id,
      action: "status_changed",
      detail: `Status changed to ${input.workflowStatus}`,
    });
  } else {
    await logTaskActivity(supabase, { taskId, actorId: user.id, action: "updated" });
  }

  if (existingTask && input.assigneeIds !== undefined) {
    const { added } = await syncTaskAssignees(supabase, taskId, input.assigneeIds);
    const notifyIds = added.filter((id) => id !== user.id);

    if (notifyIds.length > 0) {
      const { data: actorProfile } = await supabase
        .from("tp_profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      await Promise.all(
        notifyIds.map((recipientId) =>
          createNotification({
            organizationId: existingTask.organization_id,
            recipientId,
            actorId: user.id,
            type: "task_assigned",
            title: `${actorProfile?.full_name ?? "Someone"} assigned you a task`,
            body: input.name ?? existingTask.name,
            link: "/task",
          }),
        ),
      );
    }
  }

  revalidateTaskViews();
  return { success: true };
}

export async function toggleTaskCompleteAction(taskId: string, done: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let task: Record<string, any> | null = null;

  if (done) {
    const { data } = await supabase
      .from("tp_tasks")
      .select(
        "subtasks_mandatory, checklist_mandatory, id, name, description, priority, due_date, assignee_id, project_id, department_id, client_id, service_id, organization_id, created_by, is_recurring, recurrence_frequency, recurrence_interval, recurrence_end_date, parent_recurring_task_id",
      )
      .eq("id", taskId)
      .single();
    task = data;

    if (task?.subtasks_mandatory) {
      const { count } = await supabase
        .from("tp_task_subtasks")
        .select("id", { count: "exact", head: true })
        .eq("task_id", taskId)
        .eq("is_done", false);
      if (count && count > 0) return { error: "Complete all mandatory subtasks first" };
    }

    if (task?.checklist_mandatory) {
      const { count } = await supabase
        .from("tp_task_checklist_items")
        .select("id", { count: "exact", head: true })
        .eq("task_id", taskId)
        .eq("is_done", false);
      if (count && count > 0) return { error: "Complete all mandatory checklist items first" };
    }
  }

  const isCreatorClosing = done && task && task.created_by === user?.id;

  // Someone other than the creator ticking a task doesn't finish it outright —
  // it goes to the creator for review instead of silently completing.
  if (done && task && !isCreatorClosing) {
    const { error } = await supabase
      .from("tp_tasks")
      .update({ workflow_status: "under_review", updated_at: new Date().toISOString() })
      .eq("id", taskId);
    if (error) return { error: error.message };

    await logTaskActivity(supabase, {
      taskId,
      actorId: user?.id ?? null,
      action: "status_changed",
      detail: "Marked as under review",
    });

    if (task.created_by && task.created_by !== user?.id) {
      const { data: actorProfile } = await supabase
        .from("tp_profiles")
        .select("full_name")
        .eq("id", user?.id ?? "")
        .single();

      await createNotification({
        organizationId: task.organization_id,
        recipientId: task.created_by,
        actorId: user?.id ?? null,
        type: "task_review_requested",
        title: `${actorProfile?.full_name ?? "Someone"} marked a task ready for your review`,
        body: task.name,
        link: "/task",
      });
    }

    revalidateTaskViews();
    return { success: true };
  }

  const { error } = await supabase
    .from("tp_tasks")
    .update({
      status: done ? "done" : "open",
      completed_at: done ? new Date().toISOString() : null,
      ...(isCreatorClosing && { is_archived: true, archived_at: new Date().toISOString() }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) return { error: error.message };

  if (done && task) {
    await spawnNextRecurrence(supabase, task as Parameters<typeof spawnNextRecurrence>[1]);
  }

  await logTaskActivity(supabase, {
    taskId,
    actorId: user?.id ?? null,
    action: done ? "completed" : "reopened",
  });

  if (isCreatorClosing) {
    await logTaskActivity(supabase, { taskId, actorId: user?.id ?? null, action: "archived" });
  }

  revalidateTaskViews();
  return { success: true };
}

export async function togglePinAction(taskId: string, pinned: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tp_tasks")
    .update({ is_pinned: pinned, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) return { error: error.message };

  revalidateTaskViews();
  return { success: true };
}

export async function updateTaskStatusAction(
  taskId: string,
  status: "open" | "in_progress" | "done",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("tp_tasks")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) return { error: error.message };

  await logTaskActivity(supabase, {
    taskId,
    actorId: user?.id ?? null,
    action: "status_changed",
    detail: `Status changed to ${status}`,
  });

  revalidateTaskViews();
  return { success: true };
}

export async function updateTaskPositionAction(taskId: string, position: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tp_tasks")
    .update({ position, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) return { error: error.message };

  revalidateTaskViews();
  return { success: true };
}

export async function updateTaskPipelineStageAction(taskId: string, stageId: string | null) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tp_tasks")
    .update({ pipeline_stage_id: stageId, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) return { error: error.message };

  revalidateTaskViews();
  return { success: true };
}

export async function archiveTaskAction(taskId: string, archived: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("tp_tasks")
    .update({
      is_archived: archived,
      archived_at: archived ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) return { error: error.message };

  await logTaskActivity(supabase, {
    taskId,
    actorId: user?.id ?? null,
    action: archived ? "archived" : "unarchived",
  });

  revalidateTaskViews();
  return { success: true };
}

export async function sendUrgentAlertAction(taskId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: task } = await supabase
    .from("tp_tasks")
    .select("name, organization_id, created_by")
    .eq("id", taskId)
    .single();
  if (!task) return { error: "Task not found" };
  if (!task.created_by) return { error: "This task has no creator to alert" };
  if (task.created_by === user.id) return { error: "You created this task" };

  const { data: actorProfile } = await supabase
    .from("tp_profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  await createNotification({
    organizationId: task.organization_id,
    recipientId: task.created_by,
    actorId: user.id,
    type: "task_urgent_alert",
    title: `${actorProfile?.full_name ?? "Someone"} needs your urgent approval`,
    body: task.name,
    link: "/task",
  });

  await supabase.from("tp_tasks").update({ urgent_alert_at: new Date().toISOString() }).eq("id", taskId);
  revalidateTaskViews();

  return { success: true };
}

export async function resolveUrgentAlertAction(taskId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tp_tasks").update({ urgent_alert_at: null }).eq("id", taskId);
  if (error) return { error: error.message };

  revalidateTaskViews();
  return { success: true };
}

export async function deleteTaskAction(taskId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tp_tasks").delete().eq("id", taskId);

  if (error) return { error: error.message };

  revalidateTaskViews();
  return { success: true };
}

export async function getOrgMembersAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("tp_profiles")
    .select("id, full_name, phone")
    .order("full_name", { ascending: true });

  return data ?? [];
}

export async function getTaskDetailAction(taskId: string): Promise<TaskDetail | null> {
  const supabase = await createClient();
  const detail = await getTaskDetail(supabase, taskId);
  if (detail) await markTaskReadAction(taskId);
  return detail;
}

export async function addSubtaskAction(taskId: string, input: { title: string; assigneeId?: string | null }) {
  const supabase = await createClient();
  const { data: task } = await supabase.from("tp_tasks").select("organization_id").eq("id", taskId).single();
  if (!task) return { error: "Task not found" };

  const { error } = await supabase.from("tp_task_subtasks").insert({
    task_id: taskId,
    organization_id: task.organization_id,
    title: input.title,
    assignee_id: input.assigneeId || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/task");
  return { success: true };
}

export async function toggleSubtaskAction(id: string, isDone: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("tp_task_subtasks").update({ is_done: isDone }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/task");
  return { success: true };
}

export async function deleteSubtaskAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tp_task_subtasks").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/task");
  return { success: true };
}

export async function addChecklistItemAction(taskId: string, label: string) {
  const supabase = await createClient();
  const { data: task } = await supabase.from("tp_tasks").select("organization_id").eq("id", taskId).single();
  if (!task) return { error: "Task not found" };

  const { error } = await supabase
    .from("tp_task_checklist_items")
    .insert({ task_id: taskId, organization_id: task.organization_id, label });
  if (error) return { error: error.message };

  revalidatePath("/task");
  return { success: true };
}

export async function toggleChecklistItemAction(id: string, isDone: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("tp_task_checklist_items").update({ is_done: isDone }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/task");
  return { success: true };
}

export async function deleteChecklistItemAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tp_task_checklist_items").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/task");
  return { success: true };
}

export async function bulkUpdateStatusAction(taskIds: string[], status: "open" | "in_progress" | "done") {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tp_tasks")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .in("id", taskIds);

  if (error) return { error: error.message };

  revalidateTaskViews();
  return { success: true };
}

export async function bulkAssignAction(taskIds: string[], assigneeId: string | null) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tp_tasks")
    .update({ assignee_id: assigneeId, updated_at: new Date().toISOString() })
    .in("id", taskIds);

  if (error) return { error: error.message };

  await supabase.from("tp_task_assignees").delete().in("task_id", taskIds);
  if (assigneeId) {
    await supabase
      .from("tp_task_assignees")
      .insert(taskIds.map((task_id) => ({ task_id, profile_id: assigneeId })));
  }

  revalidateTaskViews();
  return { success: true };
}

export async function bulkArchiveAction(taskIds: string[], archived: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tp_tasks")
    .update({
      is_archived: archived,
      archived_at: archived ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .in("id", taskIds);

  if (error) return { error: error.message };

  revalidateTaskViews();
  return { success: true };
}

export async function bulkDeleteAction(taskIds: string[]) {
  const supabase = await createClient();
  const { error } = await supabase.from("tp_tasks").delete().in("id", taskIds);

  if (error) return { error: error.message };

  revalidateTaskViews();
  return { success: true };
}
