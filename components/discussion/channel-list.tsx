"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Search, Users, User, Archive, MoreVertical, ArchiveRestore, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AvatarBadge } from "@/components/task/avatar-badge";
import { NewChatDialog } from "@/components/discussion/new-chat-dialog";
import { archiveChannelAction, deleteChatForMeAction, renameChannelAction } from "@/lib/actions/discussion";
import type { ChannelWithMembers } from "@/lib/queries/discussion";

function channelDisplayName(channel: ChannelWithMembers, currentUserId: string) {
  if (channel.type === "group") return channel.name || "Group Chat";
  const other = channel.members.find((m) => m.profile_id !== currentUserId);
  return other?.profile.full_name ?? "Direct message";
}

function otherMemberId(channel: ChannelWithMembers, currentUserId: string) {
  if (channel.type !== "direct") return undefined;
  return channel.members.find((m) => m.profile_id !== currentUserId)?.profile_id;
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
  onDeleted,
  onRenamed,
}: {
  channels: ChannelWithMembers[];
  archivedChannels: ChannelWithMembers[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  members: { id: string; full_name: string }[];
  currentUserId: string;
  onCreated: (channelId: string) => void;
  onArchiveChange: (channelId: string, archived: boolean) => void;
  onDeleted: (channelId: string) => void;
  onRenamed: (channelId: string, name: string) => void;
}) {
  const [tab, setTab] = useState<"general" | "task">("general");
  const [search, setSearch] = useState("");
  const [dialogMode, setDialogMode] = useState<"group" | "direct" | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenamePending, startRenameTransition] = useTransition();
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

  function confirmDelete() {
    if (!deleteTargetId) return;
    const channelId = deleteTargetId;
    setDeleteTargetId(null);
    startTransition(async () => {
      const result = await deleteChatForMeAction(channelId);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      onDeleted(channelId);
      toast.success("Chat deleted");
    });
  }

  function confirmRename() {
    if (!renameTarget) return;
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    const channelId = renameTarget.id;
    startRenameTransition(async () => {
      const result = await renameChannelAction(channelId, trimmed);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      onRenamed(channelId, trimmed);
      toast.success("Group renamed");
      setRenameTarget(null);
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
          const unread = channel.unreadCount > 0;
          return (
            <div
              key={channel.id}
              className={`group flex w-full items-center gap-3 border-b px-4 py-3 transition-colors hover:bg-accent/50 ${
                selectedId === channel.id ? "bg-primary/10" : ""
              }`}
            >
              <button onClick={() => onSelect(channel.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <AvatarBadge name={name} profileId={otherMemberId(channel, currentUserId)} />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm ${unread ? "font-semibold" : "font-medium"}`}>{name}</p>
                  <p className={`truncate text-xs ${unread ? "text-foreground/80" : "text-muted-foreground"}`}>
                    {channel.last_message_preview || "No messages yet"}
                  </p>
                </div>
                {unread && (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                    {channel.unreadCount > 9 ? "9+" : channel.unreadCount}
                  </span>
                )}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="shrink-0 rounded p-1 text-muted-foreground/50 opacity-100 hover:bg-accent hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:data-[state=open]:opacity-100"
                    aria-label="More options"
                  >
                    <MoreVertical className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {channel.type === "group" && (
                    <DropdownMenuItem
                      onSelect={() => {
                        setRenameTarget({ id: channel.id, name: channel.name || "" });
                        setRenameValue(channel.name || "");
                      }}
                    >
                      <Pencil className="size-4" />
                      Rename Group
                    </DropdownMenuItem>
                  )}
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
                  {channel.type !== "task" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTargetId(channel.id)}>
                        <Trash2 className="size-4" />
                        Delete Chat
                      </DropdownMenuItem>
                    </>
                  )}
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

      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the conversation from your chat list. It stays visible to the other participant(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={renameTarget !== null} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename group</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="rename-group">Group name</Label>
            <Input
              id="rename-group"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmRename()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button onClick={confirmRename} disabled={isRenamePending || !renameValue.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
