"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Search, Users, User, Archive, MoreVertical, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AvatarBadge } from "@/components/task/avatar-badge";
import { NewChatDialog } from "@/components/discussion/new-chat-dialog";
import { archiveChannelAction } from "@/lib/actions/discussion";
import type { ChannelWithMembers } from "@/lib/queries/discussion";

function channelDisplayName(channel: ChannelWithMembers, currentUserId: string) {
  if (channel.type === "group") return channel.name || "Group Chat";
  const other = channel.members.find((m) => m.profile_id !== currentUserId);
  return other?.profile.full_name ?? "Direct message";
}

export function ChannelList({
  channels,
  archivedChannels,
  selectedId,
  onSelect,
  members,
  currentUserId,
  onCreated,
  onArchiveChange,
}: {
  channels: ChannelWithMembers[];
  archivedChannels: ChannelWithMembers[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  members: { id: string; full_name: string }[];
  currentUserId: string;
  onCreated: (channelId: string) => void;
  onArchiveChange: (channelId: string, archived: boolean) => void;
}) {
  const [tab, setTab] = useState<"general" | "task">("general");
  const [search, setSearch] = useState("");
  const [dialogMode, setDialogMode] = useState<"group" | "direct" | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [, startTransition] = useTransition();

  const source = showArchived ? archivedChannels : channels;

  const filtered = useMemo(() => {
    const scoped = source.filter((c) => (tab === "task" ? c.type === "task" : c.type !== "task"));
    if (!search.trim()) return scoped;
    const q = search.toLowerCase();
    return scoped.filter((c) => channelDisplayName(c, currentUserId).toLowerCase().includes(q));
  }, [source, tab, search, currentUserId]);

  function toggleArchive(channelId: string, archived: boolean) {
    startTransition(async () => {
      const result = await archiveChannelAction(channelId, archived);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      onArchiveChange(channelId, archived);
      toast.success(archived ? "Chat archived" : "Chat unarchived");
    });
  }

  return (
    <div className="flex w-80 shrink-0 flex-col border-r">
      <div className="space-y-3 p-3">
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => setDialogMode("group")}>
            <Plus className="size-4" />
            Group Chat
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => setDialogMode("direct")}>
            <Plus className="size-4" />
            Member chat
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant={showArchived ? "default" : "outline"}
            size="icon"
            aria-label={showArchived ? "Show active chats" : "Show archived chats"}
            onClick={() => setShowArchived((v) => !v)}
          >
            <Archive className="size-4" />
          </Button>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "general" | "task")}>
          <TabsList className="w-full">
            <TabsTrigger value="general" className="flex-1">
              General
            </TabsTrigger>
            <TabsTrigger value="task" className="flex-1">
              Task
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
            {tab === "task" ? <Users className="size-8" /> : <User className="size-8" />}
            {showArchived
              ? "No archived chats."
              : tab === "task"
                ? "No task discussions yet."
                : "No chats yet. Start one above."}
          </div>
        )}
        {filtered.map((channel) => {
          const name = channelDisplayName(channel, currentUserId);
          return (
            <div
              key={channel.id}
              className={`group flex w-full items-center gap-3 border-b px-4 py-3 transition-colors hover:bg-accent/50 ${
                selectedId === channel.id ? "bg-primary/10" : ""
              }`}
            >
              <button onClick={() => onSelect(channel.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <AvatarBadge name={name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {channel.last_message_preview || "No messages yet"}
                  </p>
                </div>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="opacity-0 group-hover:opacity-100"
                    aria-label="More options"
                  >
                    <MoreVertical className="size-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => toggleArchive(channel.id, !showArchived)}>
                    {showArchived ? (
                      <>
                        <ArchiveRestore className="size-4" />
                        Unarchive
                      </>
                    ) : (
                      <>
                        <Archive className="size-4" />
                        Archive
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>

      {dialogMode && (
        <NewChatDialog
          open={dialogMode !== null}
          onOpenChange={(open) => !open && setDialogMode(null)}
          mode={dialogMode}
          members={members}
          currentUserId={currentUserId}
          onCreated={(id) => {
            onCreated(id);
            setDialogMode(null);
          }}
        />
      )}
    </div>
  );
}
