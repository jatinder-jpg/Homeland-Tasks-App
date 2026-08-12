"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { PeopleDirectory } from "@/components/people/people-directory";
import { MemberDetailPanel } from "@/components/people/member-detail-panel";
import type { MemberWithCounts } from "@/lib/queries/people";

export function PeopleView({
  members,
  orgProjects,
  viewerId,
  viewerRole,
}: {
  members: MemberWithCounts[];
  orgProjects: { id: string; name: string }[];
  viewerId: string;
  viewerRole: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(members[0]?.id ?? null);
  const selected = members.find((m) => m.id === selectedId) ?? null;

  const memberOptions = members.map((m) => ({ id: m.id, full_name: m.full_name }));

  return (
    <div className="flex h-full min-w-0">
      <PeopleDirectory members={members} selectedId={selectedId} onSelect={setSelectedId} />
      {selected ? (
        <MemberDetailPanel
          member={selected}
          members={memberOptions}
          projects={orgProjects}
          isSuperAdmin={viewerRole === "super_admin"}
          isSelf={selected.id === viewerId}
        />
      ) : (
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
          <Users className="size-10" />
          <p>Select a team member to view details</p>
        </div>
      )}
    </div>
  );
}
