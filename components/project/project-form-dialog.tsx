"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { LocateFixed } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProjectAction, updateProjectAction } from "@/lib/actions/projects";
import { PROJECT_STATUS_LABELS } from "@/lib/utils/project-status";
import type { ProjectWithRelations } from "@/lib/queries/projects";

const schema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  status: z.enum(["open", "in_progress", "on_hold", "done"]),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  geofenceLat: z.string().optional(),
  geofenceLng: z.string().optional(),
  geofenceRadiusM: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  members,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: ProjectWithRelations | null;
  members: { id: string; full_name: string }[];
  onCreated?: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [isLocating, setIsLocating] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      status: "open",
      dueDate: "",
      assigneeId: "",
      geofenceLat: "",
      geofenceLng: "",
      geofenceRadiusM: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: project?.name ?? "",
        description: project?.description ?? "",
        status: (project?.status as FormValues["status"]) ?? "open",
        dueDate: project?.due_date ?? "",
        assigneeId: project?.assignee_id ?? "",
        geofenceLat: project?.geofence_lat != null ? String(project.geofence_lat) : "",
        geofenceLng: project?.geofence_lng != null ? String(project.geofence_lng) : "",
        geofenceRadiusM: project?.geofence_radius_m != null ? String(project.geofence_radius_m) : "",
      });
    }
  }, [open, project, reset]);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("Location isn't available in this browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("geofenceLat", String(position.coords.latitude));
        setValue("geofenceLng", String(position.coords.longitude));
        setIsLocating(false);
      },
      () => {
        toast.error("Couldn't get your location — check location permission");
        setIsLocating(false);
      },
    );
  }

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const input = {
        name: values.name,
        description: values.description || undefined,
        status: values.status,
        dueDate: values.dueDate || null,
        assigneeId: values.assigneeId || null,
        geofenceLat: values.geofenceLat ? Number(values.geofenceLat) : null,
        geofenceLng: values.geofenceLng ? Number(values.geofenceLng) : null,
        geofenceRadiusM: values.geofenceRadiusM ? Number(values.geofenceRadiusM) : null,
      };

      const result = project
        ? await updateProjectAction(project.id, input)
        : await createProjectAction(input);

      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success(project ? "Project updated" : "Project created");
      onOpenChange(false);
      if (!project && result && "id" in result) {
        onCreated?.((result as { id: string }).id);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Add Project"}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="name">Project name</Label>
            <Input id="name" autoFocus {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...register("description")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Assignee</Label>
            <Controller
              control={control}
              name="assigneeId"
              render={({ field }) => (
                <Select
                  value={field.value || "unassigned"}
                  onValueChange={(v) => field.onChange(v === "unassigned" ? "" : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label>Check-in Location (optional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={useCurrentLocation} disabled={isLocating}>
                <LocateFixed className="size-3.5" />
                {isLocating ? "Locating…" : "Use current location"}
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="geofenceLat" className="text-xs text-muted-foreground">
                  Latitude
                </Label>
                <Input id="geofenceLat" inputMode="decimal" placeholder="e.g. 28.6139" {...register("geofenceLat")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="geofenceLng" className="text-xs text-muted-foreground">
                  Longitude
                </Label>
                <Input id="geofenceLng" inputMode="decimal" placeholder="e.g. 77.2090" {...register("geofenceLng")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="geofenceRadiusM" className="text-xs text-muted-foreground">
                  Radius (m)
                </Label>
                <Input id="geofenceRadiusM" inputMode="numeric" placeholder="e.g. 200" {...register("geofenceRadiusM")} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              When set, team members can only check in to this project from within this radius.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : project ? "Save changes" : "Add Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
