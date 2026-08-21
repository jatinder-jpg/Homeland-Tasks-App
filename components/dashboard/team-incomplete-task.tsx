import { Card } from "@/components/ui/card";
import { AvatarBadge } from "@/components/task/avatar-badge";
import type { MemberWithCounts } from "@/lib/queries/people";

export function TeamIncompleteTask({ members }: { members: MemberWithCounts[] }) {
  const ranked = [...members]
    .filter((m) => m.incompleteTasks > 0)
    .sort((a, b) => b.incompleteTasks - a.incompleteTasks)
    .slice(0, 6);

  return (
    <Card className="p-4">
      <h2 className="mb-3 font-heading text-sm font-semibold">Team Incomplete Task</h2>
      {ranked.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing outstanding right now.</p>
      ) : (
        <div className="space-y-2.5">
          {ranked.map((member) => (
            <div key={member.id} className="flex items-center gap-3">
              <AvatarBadge name={member.full_name} />
              <span className="flex-1 truncate text-sm font-medium">{member.full_name}</span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                {member.incompleteTasks}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
