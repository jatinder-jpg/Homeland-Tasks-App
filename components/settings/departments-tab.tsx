"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarBadge } from "@/components/task/avatar-badge";
import {
  getOrgDepartmentsAction,
  createDepartmentAction,
  deleteDepartmentAction,
  getDepartmentMembersAction,
  addDepartmentMemberAction,
  removeDepartmentMemberAction,
} from "@/lib/actions/departments";
import { getOrgMembersAction } from "@/lib/actions/tasks";

type Department = { id: string; name: string };
type Member = { id: string; full_name: string };

export function DepartmentsTab({ isAdmin }: { isAdmin: boolean }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [newName, setNewName] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [roster, setRoster] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getOrgDepartmentsAction().then(setDepartments);
    getOrgMembersAction().then(setMembers);
  }, []);

  function refresh() {
    getOrgDepartmentsAction().then(setDepartments);
  }

  function handleCreate() {
    if (!newName.trim()) return;
    const name = newName.trim();
    setNewName("");
    startTransition(async () => {
      const result = await createDepartmentAction(name);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Department created");
      refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteDepartmentAction(id);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Department deleted");
      if (expandedId === id) setExpandedId(null);
      refresh();
    });
  }

  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    getDepartmentMembersAction(id).then(setRoster);
  }

  function handleToggleMember(departmentId: string, profileId: string, isMember: boolean) {
    startTransition(async () => {
      const result = isMember
        ? await removeDepartmentMemberAction(departmentId, profileId)
        : await addDepartmentMemberAction(departmentId, profileId);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      setRoster((prev) => (isMember ? prev.filter((id) => id !== profileId) : [...prev, profileId]));
    });
  }

  return (
    <Card className="max-w-lg space-y-5 p-6">
      <div>
        <h2 className="text-sm font-medium">Departments</h2>
        <p className="text-xs text-muted-foreground">
          Departments organize tasks and hold a roster of members. Admins and the super admin can manage them.
        </p>
      </div>

      <div className="space-y-1.5">
        {departments.length === 0 && <p className="text-sm text-muted-foreground">No departments yet.</p>}
        {departments.map((dept) => {
          const isExpanded = expandedId === dept.id;
          return (
            <div key={dept.id} className="rounded-md border">
              <div className="flex items-center justify-between px-3 py-2">
                <button
                  className="flex items-center gap-1.5 text-sm"
                  onClick={() => toggleExpand(dept.id)}
                  disabled={!isAdmin}
                >
                  {isAdmin &&
                    (isExpanded ? (
                      <ChevronDown className="size-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-3.5 text-muted-foreground" />
                    ))}
                  {dept.name}
                </button>
                {isAdmin && (
                  <button onClick={() => handleDelete(dept.id)} aria-label="Delete department" disabled={isPending}>
                    <X className="size-4 text-muted-foreground hover:text-destructive" />
                  </button>
                )}
              </div>
              {isExpanded && isAdmin && (
                <div className="space-y-1 border-t px-3 py-2">
                  <p className="mb-1 text-xs text-muted-foreground">Members</p>
                  {members.length === 0 && <p className="text-xs text-muted-foreground">No org members yet.</p>}
                  <div className="max-h-48 space-y-1 overflow-y-auto">
                    {members.map((m) => {
                      const isMember = roster.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          onClick={() => handleToggleMember(dept.id, m.id, isMember)}
                          disabled={isPending}
                          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent ${
                            isMember ? "bg-primary/5" : ""
                          }`}
                        >
                          <AvatarBadge name={m.full_name} size="sm" />
                          <span className="flex-1">{m.full_name}</span>
                          {isMember && <span className="text-xs text-primary">Added</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isAdmin ? (
        <div className="space-y-1.5">
          <Label>New department name</Label>
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. CEO Office"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
            />
            <Button onClick={handleCreate} disabled={isPending}>
              Add
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Only admins and the super admin can manage departments.</p>
      )}
    </Card>
  );
}
