"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { X, Search } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AvatarBadge } from "@/components/task/avatar-badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TaskCommentThread } from "@/components/task/task-comment-thread";
import { TaskAttachmentList } from "@/components/task/task-attachment-list";
import { TaskActivityLog } from "@/components/task/task-activity-log";
import { cn } from "@/lib/utils";
import {
  createTaskAction,
  updateTaskAction,
  archiveTaskAction,
  getTaskDetailAction,
  addSubtaskAction,
  toggleSubtaskAction,
  deleteSubtaskAction,
  addChecklistItemAction,
  toggleChecklistItemAction,
  deleteChecklistItemAction,
  type WorkflowStatus,
} from "@/lib/actions/tasks";
import { getOrgDepartmentsAction, getDepartmentMembersAction } from "@/lib/actions/departments";
import { getOrgCustomFieldsAction } from "@/lib/actions/custom-fields";
import type { TaskWithAssignee, TaskSubtask, TaskChecklistItem } from "@/lib/queries/tasks";
import type { CustomFieldDef } from "@/lib/queries/custom-fields";

const WORKFLOW_STATUS_OPTIONS: { value: WorkflowStatus; label: string; color: string }[] = [
  { value: "pending", label: "Pending", color: "bg-amber-500" },
  { value: "approval_awaiting", label: "Approval Awaiting", color: "bg-rose-700" },
  { value: "in_progress", label: "In Progress", color: "bg-fuchsia-700" },
  { value: "on_hold", label: "On Hold", color: "bg-violet-600" },
  { value: "third_party_pending", label: "Third Party Pending", color: "bg-pink-500" },
  { value: "under_review", label: "Under Review", color: "bg-blue-500" },
];

function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const schema = z
  .object({
    name: z.string().min(1, "Task name is required"),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]),
    dueDate: z.string().optional(),
    assigneeIds: z.array(z.string()),
    projectId: z.string().optional(),
    siteVisit: z.boolean(),
    isPinned: z.boolean(),
    isDraft: z.boolean(),
    departmentId: z.string().optional(),
    progress: z.number().min(0).max(100),
    reminderEnabled: z.boolean(),
    remindAt: z.string().optional(),
    workflowStatus: z.enum([
      "pending",
      "approval_awaiting",
      "in_progress",
      "on_hold",
      "third_party_pending",
      "under_review",
    ]),
    subtasksMandatory: z.boolean(),
    checklistMandatory: z.boolean(),
    followerIds: z.array(z.string()),
    recurringEnabled: z.boolean(),
    recurrenceFrequency: z.enum(["daily", "weekly", "monthly"]),
    recurrenceInterval: z.number().min(1),
    recurrenceEndDate: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.isDraft && !data.projectId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Project is required", path: ["projectId"] });
    }
    if (data.departmentId && data.assigneeIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one POC is required when a department is selected",
        path: ["assigneeIds"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  members,
  projects = [],
  defaultProjectId,
  defaultAssigneeId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskWithAssignee | null;
  members: { id: string; full_name: string }[];
  projects?: { id: string; name: string }[];
  defaultProjectId?: string;
  defaultAssigneeId?: string;
  onSaved?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [departmentRoster, setDepartmentRoster] = useState<string[] | null>(null);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [followerSearch, setFollowerSearch] = useState("");
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>([]);
  const [checklist, setChecklist] = useState<TaskChecklistItem[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newChecklistLabel, setNewChecklistLabel] = useState("");

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      priority: "medium",
      dueDate: "",
      assigneeIds: [],
      projectId: "",
      siteVisit: false,
      isPinned: false,
      isDraft: false,
      departmentId: "",
      progress: 0,
      reminderEnabled: false,
      remindAt: "",
      workflowStatus: "pending",
      subtasksMandatory: false,
      checklistMandatory: false,
      followerIds: [],
      recurringEnabled: false,
      recurrenceFrequency: "daily",
      recurrenceInterval: 1,
      recurrenceEndDate: "",
    },
  });

  const isDraftValue = watch("isDraft");
  const progressValue = watch("progress");
  const reminderEnabled = watch("reminderEnabled");
  const recurringEnabled = watch("recurringEnabled");
  const followerIds = watch("followerIds");
  const assigneeIdsValue = watch("assigneeIds");
  const departmentIdValue = watch("departmentId");
  const noProjectsAvailable = projects.length === 0;
  const [sidePanelTab, setSidePanelTab] = useState("comment");
  const relevantProfileIds = [...assigneeIdsValue, ...followerIds];
  const assignableMembers = departmentIdValue
    ? members.filter((m) => (departmentRoster ?? []).includes(m.id))
    : members;
  const filteredAssignableMembers = assignableMembers.filter((m) =>
    m.full_name.toLowerCase().includes(assigneeSearch.trim().toLowerCase()),
  );
  const filteredFollowerMembers = members.filter((m) =>
    m.full_name.toLowerCase().includes(followerSearch.trim().toLowerCase()),
  );

  useEffect(() => {
    if (!open) return;
    getOrgDepartmentsAction().then(setDepartments);
    getOrgCustomFieldsAction().then(setCustomFields);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!departmentIdValue) {
      setDepartmentRoster(null);
      return;
    }
    getDepartmentMembersAction(departmentIdValue).then((roster) => {
      setDepartmentRoster(roster);
      const stillValid = assigneeIdsValue.filter((id) => roster.includes(id));
      if (stillValid.length !== assigneeIdsValue.length) {
        setValue("assigneeIds", stillValid);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, departmentIdValue]);

  useEffect(() => {
    if (!open) return;

    reset({
      name: task?.name ?? "",
      description: task?.description ?? "",
      priority: (task?.priority as "low" | "medium" | "high") ?? "medium",
      dueDate: task?.due_date ?? "",
      assigneeIds: task ? task.assignees.map((a) => a.id) : defaultAssigneeId ? [defaultAssigneeId] : [],
      projectId: task?.project_id ?? defaultProjectId ?? "",
      siteVisit: task?.site_visit ?? false,
      isPinned: task?.is_pinned ?? false,
      isDraft: task?.is_draft ?? false,
      departmentId: task?.department_id ?? "",
      progress: task?.progress ?? 0,
      reminderEnabled: Boolean(task?.remind_at),
      remindAt: task?.remind_at ? toDatetimeLocalValue(task.remind_at) : "",
      workflowStatus: (task?.workflow_status as WorkflowStatus) ?? "pending",
      subtasksMandatory: task?.subtasks_mandatory ?? false,
      checklistMandatory: task?.checklist_mandatory ?? false,
      followerIds: [],
      recurringEnabled: task?.is_recurring ?? false,
      recurrenceFrequency: (task?.recurrence_frequency as "daily" | "weekly" | "monthly") ?? "daily",
      recurrenceInterval: task?.recurrence_interval ?? 1,
      recurrenceEndDate: task?.recurrence_end_date ?? "",
    });

    setSubtasks([]);
    setChecklist([]);
    setCustomFieldValues({});
    setAssigneeSearch("");
    setFollowerSearch("");

    if (task) {
      getTaskDetailAction(task.id).then((detail) => {
        if (!detail) return;
        reset((prev) => ({
          ...prev,
          followerIds: detail.followers.map((f) => f.id),
          assigneeIds: detail.assignees.map((a) => a.id),
        }));
        setSubtasks(detail.subtasks);
        setChecklist(detail.checklist);
        setCustomFieldValues(detail.customFieldValues);
      });
    }
  }, [open, task, defaultProjectId, defaultAssigneeId, reset]);

  function setCustomFieldValue(fieldId: string, value: string) {
    setCustomFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  function refreshDetail() {
    if (!task) return;
    getTaskDetailAction(task.id).then((detail) => {
      if (!detail) return;
      setSubtasks(detail.subtasks);
      setChecklist(detail.checklist);
    });
  }

  function toggleFollower(id: string, current: string[], onChange: (next: string[]) => void) {
    onChange(current.includes(id) ? current.filter((f) => f !== id) : [...current, id]);
  }

  function handleAddSubtask() {
    if (!task || !newSubtaskTitle.trim()) return;
    const title = newSubtaskTitle.trim();
    setNewSubtaskTitle("");
    startTransition(async () => {
      const result = await addSubtaskAction(task.id, { title });
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      refreshDetail();
    });
  }

  function handleToggleSubtask(id: string, isDone: boolean) {
    startTransition(async () => {
      await toggleSubtaskAction(id, isDone);
      refreshDetail();
    });
  }

  function handleDeleteSubtask(id: string) {
    startTransition(async () => {
      await deleteSubtaskAction(id);
      refreshDetail();
    });
  }

  function handleAddChecklistItem() {
    if (!task || !newChecklistLabel.trim()) return;
    const label = newChecklistLabel.trim();
    setNewChecklistLabel("");
    startTransition(async () => {
      const result = await addChecklistItemAction(task.id, label);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      refreshDetail();
    });
  }

  function handleToggleChecklistItem(id: string, isDone: boolean) {
    startTransition(async () => {
      await toggleChecklistItemAction(id, isDone);
      refreshDetail();
    });
  }

  function handleDeleteChecklistItem(id: string) {
    startTransition(async () => {
      await deleteChecklistItemAction(id);
      refreshDetail();
    });
  }

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const input = {
        name: values.name,
        description: values.description || undefined,
        priority: values.priority,
        dueDate: values.dueDate || null,
        assigneeIds: values.assigneeIds,
        projectId: values.projectId || null,
        siteVisit: values.siteVisit,
        isPinned: values.isPinned,
        isDraft: values.isDraft,
        departmentId: values.departmentId || null,
        progress: values.progress,
        remindAt: values.reminderEnabled && values.remindAt ? new Date(values.remindAt).toISOString() : null,
        workflowStatus: values.workflowStatus,
        subtasksMandatory: values.subtasksMandatory,
        checklistMandatory: values.checklistMandatory,
        followerIds: values.followerIds,
        customFieldValues,
        isRecurring: values.recurringEnabled,
        recurrenceFrequency: values.recurringEnabled ? values.recurrenceFrequency : null,
        recurrenceInterval: values.recurrenceInterval,
        recurrenceEndDate: values.recurringEnabled && values.recurrenceEndDate ? values.recurrenceEndDate : null,
      };

      const result = task
        ? await updateTaskAction(task.id, input)
        : await createTaskAction(input);

      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success(task ? "Task updated" : "Task created");
      onOpenChange(false);
      onSaved?.();
    });
  };

  function handleArchiveToggle() {
    if (!task) return;
    startTransition(async () => {
      const result = await archiveTaskAction(task.id, !task.is_archived);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(task.is_archived ? "Task unarchived" : "Task archived");
      onOpenChange(false);
      onSaved?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Add Task"}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4">
        <form
          className="max-h-[70vh] w-[380px] shrink-0 space-y-4 overflow-y-auto pr-1"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Task name</Label>
            <Input id="name" autoFocus {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} placeholder="Add more detail…" {...register("description")} />
          </div>

          <div className="space-y-1.5">
            <Label>Site Visit</Label>
            <Controller
              control={control}
              name="siteVisit"
              render={({ field }) => (
                <Select
                  value={field.value ? "yes" : "no"}
                  onValueChange={(v) => field.onChange(v === "yes")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Controller
                control={control}
                name="workflowStatus"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKFLOW_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-2">
                            <span className={cn("size-2 rounded-full", opt.color)} />
                            {opt.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
            </div>

            <div className="space-y-1.5">
              <Label>Department</Label>
              <Controller
                control={control}
                name="departmentId"
                render={({ field }) => (
                  <Select
                    value={field.value || "none"}
                    onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No department</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              {departmentIdValue ? "POC (Point of Contact)" : "Assignee"}
              {departmentIdValue && <span className="text-destructive"> *</span>}
            </Label>
            <Controller
              control={control}
              name="assigneeIds"
              render={({ field }) => (
                <div className="space-y-1 rounded-md border p-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={assigneeSearch}
                      onChange={(e) => setAssigneeSearch(e.target.value)}
                      placeholder="Search people…"
                      className="h-8 pl-7 text-sm"
                    />
                  </div>
                  <div className="max-h-32 space-y-1 overflow-y-auto">
                    {assignableMembers.length === 0 && (
                      <p className="p-2 text-center text-sm text-muted-foreground">
                        {departmentIdValue
                          ? "No members in this department yet — add them in Settings → Departments."
                          : "No teammates yet."}
                      </p>
                    )}
                    {assignableMembers.length > 0 && filteredAssignableMembers.length === 0 && (
                      <p className="p-2 text-center text-sm text-muted-foreground">No matches.</p>
                    )}
                    {filteredAssignableMembers.map((m) => (
                      <label
                        key={m.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
                      >
                        <Checkbox
                          checked={field.value.includes(m.id)}
                          onCheckedChange={() => toggleFollower(m.id, field.value, field.onChange)}
                        />
                        <AvatarBadge name={m.full_name} />
                        <span className="text-sm">{m.full_name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            />
            {assigneeIdsValue.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {assigneeIdsValue.length} {departmentIdValue ? "POC" : "assignee"}(s) selected
              </p>
            )}
            {errors.assigneeIds && <p className="text-xs text-destructive">{errors.assigneeIds.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Project {!isDraftValue && <span className="text-destructive">*</span>}</Label>
            {noProjectsAvailable ? (
              <p className="text-xs text-muted-foreground">
                No projects yet — create one first, or save this task as a draft.
              </p>
            ) : (
              <Controller
                control={control}
                name="projectId"
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={(v) => field.onChange(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
            {errors.projectId && <p className="text-xs text-destructive">{errors.projectId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Progress</Label>
              <span className="text-xs text-muted-foreground">{progressValue}%</span>
            </div>
            <Controller
              control={control}
              name="progress"
              render={({ field }) => (
                <Slider
                  value={[field.value]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(v) => field.onChange(v[0])}
                />
              )}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Reminder</Label>
              <Controller
                control={control}
                name="reminderEnabled"
                render={({ field }) => (
                  <Switch size="sm" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
            {reminderEnabled && <Input type="datetime-local" {...register("remindAt")} />}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Recurring</Label>
              <Controller
                control={control}
                name="recurringEnabled"
                render={({ field }) => (
                  <Switch size="sm" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
            {recurringEnabled && (
              <div className="grid grid-cols-2 gap-3">
                <Controller
                  control={control}
                  name="recurrenceFrequency"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <Input
                  type="number"
                  min={1}
                  {...register("recurrenceInterval", { valueAsNumber: true })}
                  placeholder="Every N"
                />
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs font-normal text-muted-foreground">End date (optional)</Label>
                  <Input type="date" {...register("recurrenceEndDate")} />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Follower</Label>
            <Controller
              control={control}
              name="followerIds"
              render={({ field }) => (
                <div className="space-y-1 rounded-md border p-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={followerSearch}
                      onChange={(e) => setFollowerSearch(e.target.value)}
                      placeholder="Search people…"
                      className="h-8 pl-7 text-sm"
                    />
                  </div>
                  <div className="max-h-32 space-y-1 overflow-y-auto">
                    {members.length === 0 && (
                      <p className="p-2 text-center text-sm text-muted-foreground">No teammates yet.</p>
                    )}
                    {members.length > 0 && filteredFollowerMembers.length === 0 && (
                      <p className="p-2 text-center text-sm text-muted-foreground">No matches.</p>
                    )}
                    {filteredFollowerMembers.map((m) => (
                      <label
                        key={m.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
                      >
                        <Checkbox
                          checked={field.value.includes(m.id)}
                          onCheckedChange={() => toggleFollower(m.id, field.value, field.onChange)}
                        />
                        <AvatarBadge name={m.full_name} />
                        <span className="text-sm">{m.full_name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            />
            {followerIds.length > 0 && (
              <p className="text-xs text-muted-foreground">{followerIds.length} follower(s) selected</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Subtasks</Label>
              {task && (
                <Controller
                  control={control}
                  name="subtasksMandatory"
                  render={({ field }) => (
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Switch size="sm" checked={field.value} onCheckedChange={field.onChange} />
                      Mandatory
                    </label>
                  )}
                />
              )}
            </div>
            {!task ? (
              <p className="text-xs text-muted-foreground">Save the task first to add subtasks.</p>
            ) : (
              <div className="space-y-1 rounded-md border p-2">
                {subtasks.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 py-0.5">
                    <Checkbox
                      checked={s.is_done}
                      onCheckedChange={(v) => handleToggleSubtask(s.id, Boolean(v))}
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        s.is_done && "text-muted-foreground line-through",
                      )}
                    >
                      {s.title}
                    </span>
                    {s.assignee && <AvatarBadge name={s.assignee.full_name} />}
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(s.id)}
                      aria-label="Delete subtask"
                    >
                      <X className="size-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <Input
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add a subtask"
                    className="h-8 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                  />
                  <Button type="button" size="sm" variant="outline" onClick={handleAddSubtask}>
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Checklist</Label>
              {task && (
                <Controller
                  control={control}
                  name="checklistMandatory"
                  render={({ field }) => (
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Switch size="sm" checked={field.value} onCheckedChange={field.onChange} />
                      Mandatory
                    </label>
                  )}
                />
              )}
            </div>
            {!task ? (
              <p className="text-xs text-muted-foreground">Save the task first to add a checklist.</p>
            ) : (
              <div className="space-y-1 rounded-md border p-2">
                {checklist.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 py-0.5">
                    <Checkbox
                      checked={c.is_done}
                      onCheckedChange={(v) => handleToggleChecklistItem(c.id, Boolean(v))}
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        c.is_done && "text-muted-foreground line-through",
                      )}
                    >
                      {c.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteChecklistItem(c.id)}
                      aria-label="Delete checklist item"
                    >
                      <X className="size-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <Input
                    value={newChecklistLabel}
                    onChange={(e) => setNewChecklistLabel(e.target.value)}
                    placeholder="Add a checklist item"
                    className="h-8 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                  />
                  <Button type="button" size="sm" variant="outline" onClick={handleAddChecklistItem}>
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>

          {customFields.length > 0 && (
            <div className="space-y-3">
              <Label>Custom Fields</Label>
              {customFields.map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <Label className="text-xs font-normal text-muted-foreground">{field.name}</Label>
                  {field.field_type === "select" ? (
                    <Select
                      value={customFieldValues[field.id] || undefined}
                      onValueChange={(v) => setCustomFieldValue(field.id, v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={customFieldValues[field.id] || ""}
                      onChange={(e) => setCustomFieldValue(field.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-6">
            <Controller
              control={control}
              name="isPinned"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  Pin task
                </label>
              )}
            />
            <Controller
              control={control}
              name="isDraft"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  Save as draft
                </label>
              )}
            />
          </div>
        </form>

        <div className="flex max-h-[70vh] min-h-0 w-[340px] shrink-0 flex-col border-l pl-4">
          <Tabs value={sidePanelTab} onValueChange={setSidePanelTab} className="flex min-h-0 flex-1 flex-col">
            <TabsList className="w-full">
              <TabsTrigger value="comment" className="flex-1">
                Comment
              </TabsTrigger>
              <TabsTrigger value="attachment" className="flex-1">
                Attachment
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex-1">
                Log Activity
              </TabsTrigger>
            </TabsList>
            {task ? (
              <>
                <TabsContent value="comment" className="flex min-h-0 flex-1 flex-col">
                  <TaskCommentThread taskId={task.id} />
                </TabsContent>
                <TabsContent value="attachment" className="flex min-h-0 flex-1 flex-col">
                  <TaskAttachmentList taskId={task.id} />
                </TabsContent>
                <TabsContent value="activity" className="flex min-h-0 flex-1 flex-col">
                  <TaskActivityLog taskId={task.id} relevantProfileIds={relevantProfileIds} />
                </TabsContent>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
                Save the task first to comment, attach files, or see activity.
              </div>
            )}
          </Tabs>
        </div>
        </div>

        <DialogFooter className="sm:justify-between">
          {task && (
            <Button
              type="button"
              variant="outline"
              onClick={handleArchiveToggle}
              disabled={isPending}
            >
              {task.is_archived ? "Unarchive" : "Archive"}
            </Button>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isPending || (!isDraftValue && noProjectsAvailable)}
            >
              {isPending ? "Saving…" : task ? "Save changes" : "Add Task"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
