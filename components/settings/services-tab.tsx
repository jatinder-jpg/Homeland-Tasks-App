"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOrgServicesAction, createServiceAction, deleteServiceAction } from "@/lib/actions/services";

export function ServicesTab({ isAdmin }: { isAdmin: boolean }) {
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getOrgServicesAction().then(setServices);
  }, []);

  function refresh() {
    getOrgServicesAction().then(setServices);
  }

  function handleCreate() {
    if (!newName.trim()) return;
    const name = newName.trim();
    setNewName("");
    startTransition(async () => {
      const result = await createServiceAction(name);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Service created");
      refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteServiceAction(id);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Service deleted");
      refresh();
    });
  }

  return (
    <Card className="max-w-lg space-y-5 p-6">
      <div>
        <h2 className="text-sm font-medium">Services</h2>
        <p className="text-xs text-muted-foreground">Services can be linked to tasks to tag which service line they belong to.</p>
      </div>

      <div className="space-y-1.5">
        {services.length === 0 && <p className="text-sm text-muted-foreground">No services yet.</p>}
        {services.map((service) => (
          <div key={service.id} className="flex items-center justify-between rounded-md border px-3 py-2">
            <span className="text-sm">{service.name}</span>
            {isAdmin && (
              <button onClick={() => handleDelete(service.id)} aria-label="Delete service" disabled={isPending}>
                <X className="size-4 text-muted-foreground hover:text-destructive" />
              </button>
            )}
          </div>
        ))}
      </div>

      {isAdmin ? (
        <div className="space-y-1.5">
          <Label>New service name</Label>
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Site Visit"
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
        <p className="text-xs text-muted-foreground">Only workspace admins can manage services.</p>
      )}
    </Card>
  );
}
