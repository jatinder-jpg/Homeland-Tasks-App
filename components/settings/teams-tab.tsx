"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOrgTeamsAction, createTeamAction, deleteTeamAction } from "@/lib/actions/teams";

export function TeamsTab({ isAdmin }: { isAdmin: boolean }) {
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getOrgTeamsAction().then(setTeams);
  }, []);

  function refresh() {
    getOrgTeamsAction().then(setTeams);
  }

  function handleCreate() {
    if (!newName.trim()) return;
    const name = newName.trim();
    setNewName("");
    startTransition(async () => {
      const result = await createTeamAction(name);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Team created");
      refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteTeamAction(id);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Team deleted");
      refresh();
    });
  }

  return (
    <Card className="max-w-lg space-y-5 p-6">
      <div>
        <h2 className="text-sm font-medium">Teams</h2>
        <p className="text-xs text-muted-foreground">
          Teams can be assigned to tasks for department-level organization.
        </p>
      </div>

      <div className="space-y-1.5">
        {teams.length === 0 && <p className="text-sm text-muted-foreground">No teams yet.</p>}
        {teams.map((team) => (
          <div key={team.id} className="flex items-center justify-between rounded-md border px-3 py-2">
            <span className="text-sm">{team.name}</span>
            {isAdmin && (
              <button onClick={() => handleDelete(team.id)} aria-label="Delete team" disabled={isPending}>
                <X className="size-4 text-muted-foreground hover:text-destructive" />
              </button>
            )}
          </div>
        ))}
      </div>

      {isAdmin ? (
        <div className="space-y-1.5">
          <Label>New team name</Label>
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
        <p className="text-xs text-muted-foreground">Only workspace admins can manage teams.</p>
      )}
    </Card>
  );
}
