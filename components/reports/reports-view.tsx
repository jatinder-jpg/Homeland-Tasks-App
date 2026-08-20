"use client";

import { useState } from "react";
import {
  ArrowLeft,
  User,
  Briefcase,
  ListChecks,
  Activity,
  Clock3,
  TrendingUp,
  CalendarDays,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PerformanceAnalysisChart } from "@/components/people/performance-analysis-chart";
import type { MemberWithCounts } from "@/lib/queries/people";
import type { StatusWiseRow, ProjectWiseRow, ActivityFeedRow } from "@/lib/queries/reports";
import type { PresenceEntry } from "@/lib/actions/presence";
import { formatDateTime } from "@/lib/utils/format-date";

type ReportKey =
  | "user-wise"
  | "project-wise"
  | "status-wise"
  | "user-activity"
  | "user-activity-summary"
  | "user-wise-performance"
  | "daily-report";

const TILES: { key: ReportKey; label: string; icon: typeof User; functional: boolean }[] = [
  { key: "user-wise", label: "User Wise Report", icon: User, functional: true },
  { key: "project-wise", label: "Project Wise Report", icon: Briefcase, functional: true },
  { key: "status-wise", label: "Status Wise Report", icon: ListChecks, functional: true },
  { key: "user-activity", label: "User Activity Report", icon: Activity, functional: true },
  { key: "user-activity-summary", label: "User Activity Summary", icon: Clock3, functional: false },
  { key: "user-wise-performance", label: "User Wise Performance", icon: TrendingUp, functional: true },
  { key: "daily-report", label: "Daily Report", icon: CalendarDays, functional: false },
];

const STATUS_LABELS: Record<string, string> = {
  open: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const ACTIVITY_ACTION_LABEL: Record<string, string> = {
  updated: "updated",
  status_changed: "changed status on",
  archived: "archived",
  unarchived: "unarchived",
  completed: "completed",
  reopened: "reopened",
  opened: "opened",
  commented: "commented on",
};

const ONLINE_THRESHOLD_MS = 45_000;
const IDLE_THRESHOLD_MS = 5 * 60_000;

function presenceStatus(lastSeenAt: string | undefined): "online" | "idle" | "offline" {
  if (!lastSeenAt) return "offline";
  const elapsed = Date.now() - new Date(lastSeenAt).getTime();
  if (elapsed <= ONLINE_THRESHOLD_MS) return "online";
  if (elapsed <= IDLE_THRESHOLD_MS) return "idle";
  return "offline";
}

const PRESENCE_DOT: Record<string, string> = {
  online: "bg-emerald-500",
  idle: "bg-amber-400",
  offline: "bg-muted-foreground/30",
};

const PRESENCE_LABEL: Record<string, string> = {
  online: "Online",
  idle: "Idle",
  offline: "Offline",
};

export function ReportsView({
  members,
  statusWise,
  projectWise,
  activityFeed,
  presence,
}: {
  members: MemberWithCounts[];
  statusWise: StatusWiseRow[];
  projectWise: ProjectWiseRow[];
  activityFeed: ActivityFeedRow[];
  presence: PresenceEntry[];
}) {
  const [active, setActive] = useState<ReportKey | null>(null);
  const [performanceMemberId, setPerformanceMemberId] = useState(members[0]?.id ?? "");
  const lastSeenByMember = new Map(presence.map((p) => [p.profileId, p.lastSeenAt]));

  if (active) {
    const tile = TILES.find((t) => t.key === active)!;
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
        <button
          onClick={() => setActive(null)}
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Reports / <span className="font-medium text-foreground">{tile.label}</span>
        </button>

        {active === "user-wise" && (
          <Card className="overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">User</th>
                  <th className="px-4 py-2.5 font-medium">Total</th>
                  <th className="px-4 py-2.5 font-medium">Completed</th>
                  <th className="px-4 py-2.5 font-medium">Incomplete</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3">{m.full_name}</td>
                    <td className="px-4 py-3">{m.totalTasks}</td>
                    <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">{m.completedTasks}</td>
                    <td className="px-4 py-3 text-rose-600 dark:text-rose-400">{m.incompleteTasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {active === "project-wise" && (
          <Card className="overflow-hidden p-0">
            {projectWise.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">No projects yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Project</th>
                    <th className="px-4 py-2.5 font-medium">Total</th>
                    <th className="px-4 py-2.5 font-medium">Completed</th>
                    <th className="px-4 py-2.5 font-medium">Incomplete</th>
                  </tr>
                </thead>
                <tbody>
                  {projectWise.map((p) => (
                    <tr key={p.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3">{p.name}</td>
                      <td className="px-4 py-3">{p.totalTasks}</td>
                      <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">{p.completedTasks}</td>
                      <td className="px-4 py-3 text-rose-600 dark:text-rose-400">{p.incompleteTasks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}

        {active === "status-wise" && (
          <Card className="space-y-3 p-5">
            {statusWise.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">No tasks yet.</p>
            ) : (
              statusWise.map((s) => {
                const max = Math.max(...statusWise.map((r) => r.count), 1);
                return (
                  <div key={s.status} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{STATUS_LABELS[s.status] ?? s.status}</span>
                      <span className="font-medium">{s.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(s.count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </Card>
        )}

        {active === "user-activity" && (
          <div className="space-y-6">
            <Card className="overflow-hidden p-0">
              <div className="border-b bg-muted/20 px-4 py-2.5 text-xs font-medium text-muted-foreground">
                Who&apos;s Online
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2 font-medium">User</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const lastSeenAt = lastSeenByMember.get(m.id);
                    const status = presenceStatus(lastSeenAt);
                    return (
                      <tr key={m.id} className="border-b last:border-b-0">
                        <td className="px-4 py-2.5">{m.full_name}</td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`size-2 rounded-full ${PRESENCE_DOT[status]}`} />
                            {PRESENCE_LABEL[status]}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {lastSeenAt ? formatDateTime(new Date(lastSeenAt)) : "Never"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>

            <Card className="overflow-hidden p-0">
              <div className="border-b bg-muted/20 px-4 py-2.5 text-xs font-medium text-muted-foreground">
                Activity Log — task opens, replies, and status changes
              </div>
              {activityFeed.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">No activity yet.</div>
              ) : (
                <div className="max-h-[28rem] divide-y overflow-y-auto">
                  {activityFeed.map((entry) => (
                    <div key={entry.id} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
                      <span>
                        <span className="font-medium">{entry.actor?.full_name ?? "Someone"}</span>{" "}
                        <span className="text-muted-foreground">
                          {entry.detail || ACTIVITY_ACTION_LABEL[entry.action] || entry.action}
                        </span>
                        {entry.task && (
                          <>
                            {" "}
                            <span className="text-muted-foreground">on</span>{" "}
                            <span className="font-medium">{entry.task.name}</span>
                          </>
                        )}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDateTime(new Date(entry.created_at))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {active === "user-wise-performance" && (
          <div className="space-y-4">
            <Select value={performanceMemberId} onValueChange={setPerformanceMemberId}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {performanceMemberId && <PerformanceAnalysisChart memberId={performanceMemberId} />}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Reports</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {TILES.map(({ key, label, icon: Icon, functional }) => (
          <button
            key={key}
            disabled={!functional}
            onClick={() => functional && setActive(key)}
            className={`flex flex-col items-start gap-3 rounded-lg border bg-card p-4 text-left transition-colors ${
              functional ? "cursor-pointer hover:border-primary/40 hover:bg-accent/50" : "cursor-not-allowed opacity-50"
            }`}
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-5" />
            </div>
            <span className="text-sm font-medium">{label}</span>
            {!functional && <span className="text-xs text-muted-foreground">Coming soon</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
