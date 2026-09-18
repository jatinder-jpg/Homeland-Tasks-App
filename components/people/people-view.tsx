"use client";

import { useEffect, useState } from "react";
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
  const [isMobile, setIsMobile] = useState(false);
  const selected = members.find((m) => m.id === selectedId) ?? null;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const memberOptions = members.map((m) => ({ id: m.id, full_name: m.full_name }));
  const showDirectory = !isMobile || !selected;
  const showDetail = !isMobile || Boolean(selected);

  return (
    <div className="flex h-full min-w-0">
      {showDirectory && (
        <PeopleDirectory members={members} selectedId={selectedId} onSelect={setSelectedId} />
      )}
      {showDetail &&
        (selected ? (
          <MemberDetailPanel
            member={selected}
            members={memberOptions}
            projects={orgProjects}
            isSuperAdmin={viewerRole === "super_admin"}
            isSelf={selected.id === viewerId}
            onBack={isMobile ? () => setSelectedId(null) : undefined}
          />
        ) : (
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Users className="size-10" />
            <p>Select a team member to view details</p>
          </div>
        ))}
    </div>
  );
}
