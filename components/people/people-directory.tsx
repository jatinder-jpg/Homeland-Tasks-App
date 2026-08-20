"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AvatarBadge } from "@/components/task/avatar-badge";
import { ROLE_LABEL } from "@/lib/utils/roles";
import type { MemberWithCounts } from "@/lib/queries/people";

export function PeopleDirectory({
  members,
  selectedId,
  onSelect,
}: {
  members: MemberWithCounts[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter((m) => m.full_name.toLowerCase().includes(q));
  }, [members, search]);

  return (
    <div className="flex w-72 shrink-0 flex-col border-r">
      <div className="p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Type here to Search"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.map((member) => (
          <button
            key={member.id}
            onClick={() => onSelect(member.id)}
            className={`flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-accent/50 ${
              selectedId === member.id ? "bg-primary/10" : ""
            }`}
          >
            <AvatarBadge name={member.full_name} profileId={member.id} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{member.full_name}</p>
              <p className="truncate text-xs text-muted-foreground">{ROLE_LABEL[member.role] ?? member.role}</p>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="p-4 text-center text-sm text-muted-foreground">No members found.</p>
        )}
      </div>
    </div>
  );
}
