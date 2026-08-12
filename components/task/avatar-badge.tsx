import { getInitials, colorForString } from "@/lib/utils/avatar";

export function AvatarBadge({
  name,
  size = "sm",
}: {
  name: string | null;
  size?: "sm" | "md";
}) {
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
      title={name}
    >
      {getInitials(name)}
      <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border-2 border-card bg-emerald-500" />
    </span>
  );
}
