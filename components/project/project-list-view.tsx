"use client";

import { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectCard } from "@/components/project/project-card";
import { ProjectFormDialog } from "@/components/project/project-form-dialog";
import { PROJECT_STATUS_LABELS } from "@/lib/utils/project-status";
import type { ProjectWithRelations } from "@/lib/queries/projects";

export function ProjectListView({
  createdProjects,
  assignedProjects,
  starredIds,
  members,
}: {
  createdProjects: ProjectWithRelations[];
  assignedProjects: ProjectWithRelations[];
  starredIds: string[];
  members: { id: string; full_name: string }[];
}) {
  const [tab, setTab] = useState<"created" | "assigned">("created");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const starredSet = useMemo(() => new Set(starredIds), [starredIds]);

  const source = tab === "created" ? createdProjects : assignedProjects;

  const filtered = useMemo(() => {
    return source.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [source, search, status]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Project</h1>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Add Project
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "created" | "assigned")}>
        <TabsList>
          <TabsTrigger value="created">Created By Me</TabsTrigger>
          <TabsTrigger value="assigned">Assignee To Me</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <p className="font-medium">No started Projects</p>
          <p className="text-sm text-muted-foreground">
            Add Stars to things you want to easily find later
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} starred={starredSet.has(project.id)} />
          ))}
        </div>
      )}

      <ProjectFormDialog open={dialogOpen} onOpenChange={setDialogOpen} members={members} />
    </div>
  );
}
