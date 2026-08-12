export type ProjectStatus = "open" | "in_progress" | "on_hold" | "done";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  open: "Not Started",
  in_progress: "In Progress",
  on_hold: "On Hold",
  done: "Completed",
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  open: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  on_hold: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
};
