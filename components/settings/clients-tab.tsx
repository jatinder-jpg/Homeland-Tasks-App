"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOrgClientsAction, createClientAction, deleteClientAction } from "@/lib/actions/clients";

export function ClientsTab({ isAdmin }: { isAdmin: boolean }) {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getOrgClientsAction().then(setClients);
  }, []);

  function refresh() {
    getOrgClientsAction().then(setClients);
  }

  function handleCreate() {
    if (!newName.trim()) return;
    const name = newName.trim();
    setNewName("");
    startTransition(async () => {
      const result = await createClientAction(name);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Client created");
      refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteClientAction(id);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Client deleted");
      refresh();
    });
  }

  return (
    <Card className="max-w-lg space-y-5 p-6">
      <div>
        <h2 className="text-sm font-medium">Clients</h2>
        <p className="text-xs text-muted-foreground">Clients can be linked to tasks for CRM-style tracking.</p>
      </div>

      <div className="space-y-1.5">
        {clients.length === 0 && <p className="text-sm text-muted-foreground">No clients yet.</p>}
        {clients.map((client) => (
          <div key={client.id} className="flex items-center justify-between rounded-md border px-3 py-2">
            <span className="text-sm">{client.name}</span>
            {isAdmin && (
              <button onClick={() => handleDelete(client.id)} aria-label="Delete client" disabled={isPending}>
                <X className="size-4 text-muted-foreground hover:text-destructive" />
              </button>
            )}
          </div>
        ))}
      </div>

      {isAdmin ? (
        <div className="space-y-1.5">
          <Label>New client name</Label>
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Ab Alcobev Pvt Ltd"
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
        <p className="text-xs text-muted-foreground">Only workspace admins can manage clients.</p>
      )}
    </Card>
  );
}
