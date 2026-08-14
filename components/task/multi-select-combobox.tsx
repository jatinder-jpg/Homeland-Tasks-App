"use client";

import { useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export function MultiSelectCombobox({
  options,
  selectedIds,
  onToggle,
  placeholder,
  emptyMessage,
  searchPlaceholder = "Search…",
  renderLeading,
}: {
  options: { id: string; label: string }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  placeholder: string;
  emptyMessage: string;
  searchPlaceholder?: string;
  renderLeading?: (option: { id: string; label: string }) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.trim().toLowerCase()));
  const selected = options.filter((o) => selectedIds.includes(o.id));

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border px-2 py-1.5 text-left text-sm hover:bg-accent/50"
        >
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selected.map((o) => (
              <span
                key={o.id}
                className="flex items-center gap-1 rounded bg-muted py-0.5 pl-1.5 pr-1 text-xs"
              >
                {renderLeading?.(o)}
                {o.label}
                <button
                  type="button"
                  aria-label={`Remove ${o.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(o.id);
                  }}
                >
                  <X className="size-3 cursor-pointer text-muted-foreground hover:text-foreground" />
                </button>
              </span>
            ))
          )}
          <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-2" align="start">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 pl-7 text-sm"
            autoFocus
          />
        </div>
        <div className="mt-1 max-h-48 space-y-1 overflow-y-auto">
          {options.length === 0 && (
            <p className="p-2 text-center text-sm text-muted-foreground">{emptyMessage}</p>
          )}
          {options.length > 0 && filtered.length === 0 && (
            <p className="p-2 text-center text-sm text-muted-foreground">No matches.</p>
          )}
          {filtered.map((o) => (
            <label
              key={o.id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
            >
              <Checkbox checked={selectedIds.includes(o.id)} onCheckedChange={() => onToggle(o.id)} />
              {renderLeading?.(o)}
              <span className="text-sm">{o.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
