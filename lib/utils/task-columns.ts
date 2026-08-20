export type ColumnKey =
  | "dueDate"
  | "assignees"
  | "status"
  | "follower"
  | "project"
  | "service"
  | "client"
  | "createdDate";

export const COLUMN_DEFS: { key: ColumnKey; label: string; width: string; defaultOn: boolean }[] = [
  { key: "dueDate", label: "Due Date", width: "110px", defaultOn: true },
  { key: "assignees", label: "Assignee(s)", width: "130px", defaultOn: true },
  { key: "status", label: "Status", width: "130px", defaultOn: true },
  { key: "follower", label: "Follower", width: "110px", defaultOn: true },
  { key: "project", label: "Project", width: "140px", defaultOn: false },
  { key: "service", label: "Service", width: "120px", defaultOn: false },
  { key: "client", label: "Client", width: "120px", defaultOn: false },
  { key: "createdDate", label: "Created Date", width: "120px", defaultOn: false },
];

export const DEFAULT_COLUMNS: ColumnKey[] = COLUMN_DEFS.filter((c) => c.defaultOn).map((c) => c.key);

export function buildGridTemplate(columns: ColumnKey[]): string {
  const widths = columns.map((key) => COLUMN_DEFS.find((c) => c.key === key)?.width ?? "120px");
  return ["minmax(0,1fr)", ...widths].join(" ");
}
