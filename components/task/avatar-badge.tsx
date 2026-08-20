"use client";

import { getInitials, colorForString } from "@/lib/utils/avatar";
import { usePresenceStatus } from "@/lib/presence/presence-context";

const STATUS_COLOR: Record<string, string> = {
  online: "bg-emerald-500",
  idle: "bg-amber-400",
};

export function AvatarBadge({
  name,
  size = "sm",
  profileId,
}: {
  name: string | null;
  size?: "sm" | "md";
  profileId?: string | null;
}) {
  const status = usePresenceStatus(profileId);
  const dotColor = status ? STATUS_COLOR[status] : null;

  if (!name) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground ${
          size === "sm" ? "size-7 text-[10px]" : "size-9 text-xs"
        }`}
        title="Unassigned"
      >
        ?
      </span>
    );
  }

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${colorForString(name)} ${
        size === "sm" ? "size-7 text-[10px]" : "size-9 text-xs"
      }`}
      title={status ? `${name} — ${status === "online" ? "Online" : "Idle"}` : name}
    >
      {getInitials(name)}
      {dotColor && (
        <span className={`absolute -bottom-0.5 -right-0.5 size-2 rounded-full border-2 border-card ${dotColor}`} />
      )}
    </span>
  );
}
