"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getOrgCustomFieldsAction, createCustomFieldAction, deleteCustomFieldAction } from "@/lib/actions/custom-fields";
import type { CustomFieldDef } from "@/lib/queries/custom-fields";

export function CustomFieldsTab({ isAdmin }: { isAdmin: boolean }) {
  const [fields, setFields] = useState<CustomFieldDef[]>([]);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"text" | "select">("text");
  const [newOptions, setNewOptions] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getOrgCustomFieldsAction().then(setFields);
  }, []);

  function refresh() {
    getOrgCustomFieldsAction().then(setFields);
  }

  function handleCreate() {
    if (!newName.trim()) return;
    const name = newName.trim();
    const options = newOptions
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    if (newType === "select" && options.length === 0) {
      toast.error("Add at least one option for a dropdown field");
      return;
    }
    setNewName("");
    setNewOptions("");
    startTransition(async () => {
      const result = await createCustomFieldAction({ name, fieldType: newType, options });
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Custom field created");
      refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCustomFieldAction(id);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Custom field deleted");
      refresh();
    });
  }

  return (
    <Card className="max-w-lg space-y-5 p-6">
      <div>
        <h2 className="text-sm font-medium">Custom Fields</h2>
        <p className="text-xs text-muted-foreground">
          Extra text or dropdown fields shown on every task.
        </p>
      </div>

      <div className="space-y-1.5">
        {fields.length === 0 && <p className="text-sm text-muted-foreground">No custom fields yet.</p>}
        {fields.map((field) => (
          <div key={field.id} className="flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <span className="text-sm">{field.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {field.field_type === "select" ? `Dropdown: ${field.options.join(", ")}` : "Text"}
              </span>
            </div>
            {isAdmin && (
              <button onClick={() => handleDelete(field.id)} aria-label="Delete custom field" disabled={isPending}>
                <X className="size-4 text-muted-foreground hover:text-destructive" />
              </button>
            )}
          </div>
        ))}
      </div>

      {isAdmin ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Field name</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Meeting with" />
          </div>
          <div className="space-y-1.5">
            <Label>Field type</Label>
            <Select value={newType} onValueChange={(v) => setNewType(v as "text" | "select")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="select">Dropdown</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {newType === "select" && (
            <div className="space-y-1.5">
              <Label>Options (comma-separated)</Label>
              <Input
                value={newOptions}
                onChange={(e) => setNewOptions(e.target.value)}
                placeholder="e.g. Task, Meeting"
              />
            </div>
          )}
          <Button onClick={handleCreate} disabled={isPending}>
            Add field
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Only workspace admins can manage custom fields.</p>
      )}
    </Card>
  );
}
