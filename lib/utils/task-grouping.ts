import type { TaskWithAssignee } from "@/lib/queries/tasks";

export type TaskGroupKey = "pinned" | "today" | "overdue" | "upcoming" | "noDate";

export const GROUP_LABELS: Record<TaskGroupKey, string> = {
  pinned: "Pin Task",
  today: "Today",
  overdue: "Overdue",
  upcoming: "Upcoming",
  noDate: "No Date",
};

export const GROUP_ORDER: TaskGroupKey[] = ["pinned", "today", "overdue", "upcoming", "noDate"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export type TaskDateType = "due" | "created";

export function groupTasksForList(
  tasks: TaskWithAssignee[],
  dateType: TaskDateType = "due",
): Record<TaskGroupKey, TaskWithAssignee[]> {
  const today = todayISO();
  const groups: Record<TaskGroupKey, TaskWithAssignee[]> = {
    pinned: [],
    today: [],
    overdue: [],
    upcoming: [],
    noDate: [],
  };

  for (const task of tasks) {
    if (task.is_pinned) {
      groups.pinned.push(task);
      continue;
    }
    const date = dateType === "created" ? task.created_at.slice(0, 10) : task.due_date;
    if (!date) {
      groups.noDate.push(task);
    } else if (date === today) {
      groups.today.push(task);
    } else if (date < today && task.status !== "done") {
      groups.overdue.push(task);
    } else if (date > today) {
      groups.upcoming.push(task);
    } else {
      // due in the past but already done
      groups.noDate.push(task);
    }
  }

  return groups;
}
