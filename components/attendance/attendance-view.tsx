"use client";

import { useState, useTransition } from "react";
import { MapPin, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { checkInAction, checkOutAction } from "@/lib/actions/attendance";
import { formatDateTime } from "@/lib/utils/format-date";
import type { AttendanceRecord, GeofencedProject } from "@/lib/queries/attendance";

function getLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location isn't available in this browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, () =>
      reject(new Error("Couldn't get your location — check location permission")),
    );
  });
}

function formatDuration(startISO: string, endISO: string | null) {
  const start = new Date(startISO).getTime();
  const end = endISO ? new Date(endISO).getTime() : Date.now();
  const minutes = Math.max(0, Math.round((end - start) / 60_000));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export function AttendanceView({
  openRecord,
  myRecords,
  allRecords,
  projects,
}: {
  openRecord: AttendanceRecord | null;
  myRecords: AttendanceRecord[];
  allRecords: AttendanceRecord[];
  projects: GeofencedProject[];
}) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("none");
  const [tab, setTab] = useState<"mine" | "all">("mine");
  const [isPending, startTransition] = useTransition();

  function handleCheckIn() {
    startTransition(async () => {
      try {
        const position = await getLocation();
        const result = await checkInAction({
          projectId: selectedProjectId === "none" ? null : selectedProjectId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        if (result && "error" in result) {
          toast.error(result.error);
          return;
        }
        toast.success("Checked in");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Check-in failed");
      }
    });
  }

  function handleCheckOut() {
    if (!openRecord) return;
    startTransition(async () => {
      try {
        const position = await getLocation();
        const result = await checkOutAction(openRecord.id, {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        if (result && "error" in result) {
          toast.error(result.error);
          return;
        }
        toast.success("Checked out");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Check-out failed");
      }
    });
  }

  const records = tab === "mine" ? myRecords : allRecords;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Attendance</h1>

      <Card className="p-5">
        {openRecord ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <MapPin className="size-4" />
                Checked in{openRecord.project ? ` to ${openRecord.project.name}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                Since {formatDateTime(new Date(openRecord.check_in_at))}
              </p>
            </div>
            <Button variant="destructive" onClick={handleCheckOut} disabled={isPending}>
              <LogOut className="size-4" />
              {isPending ? "Working…" : "Check Out"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-48 space-y-1.5">
              <p className="text-sm font-medium">Project (optional)</p>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCheckIn} disabled={isPending}>
              <LogIn className="size-4" />
              {isPending ? "Locating…" : "Check In"}
            </Button>
          </div>
        )}
      </Card>

      <div className="space-y-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "mine" | "all")}>
          <TabsList>
            <TabsTrigger value="mine">My Log</TabsTrigger>
            <TabsTrigger value="all">Team Log</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className="overflow-hidden p-0">
          {records.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No attendance records yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20 text-left text-xs text-muted-foreground">
                  {tab === "all" && <th className="px-4 py-2.5 font-medium">User</th>}
                  <th className="px-4 py-2.5 font-medium">Project</th>
                  <th className="px-4 py-2.5 font-medium">Check In</th>
                  <th className="px-4 py-2.5 font-medium">Check Out</th>
                  <th className="px-4 py-2.5 font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b last:border-b-0">
                    {tab === "all" && <td className="px-4 py-3">{r.profile?.full_name ?? "—"}</td>}
                    <td className="px-4 py-3 text-muted-foreground">{r.project?.name ?? "—"}</td>
                    <td className="px-4 py-3">{formatDateTime(new Date(r.check_in_at))}</td>
                    <td className="px-4 py-3">
                      {r.check_out_at ? (
                        formatDateTime(new Date(r.check_out_at))
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{formatDuration(r.check_in_at, r.check_out_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
