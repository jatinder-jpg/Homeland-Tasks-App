"use client";

import { useState, useTransition } from "react";
import { Folder, Star, MoreVertical, Trash2, Share2 } from "lucide-react";
import { toast } from "sonner";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AvatarBadge } from "@/components/task/avatar-badge";
import { ShareDialog } from "@/components/documents/share-dialog";
import { toggleFolderStarAction, deleteFolderAction } from "@/lib/actions/documents";
import { formatNumericDate } from "@/lib/utils/format-date";
import type { FolderRow as FolderRowType } from "@/lib/queries/documents";

export function FolderRow({
  folder,
  starred,
  currentUserId,
  members,
  onOpen,
}: {
  folder: FolderRowType;
  starred: boolean;
  currentUserId: string;
  members: { id: string; full_name: string }[];
  onOpen: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const isOwner = folder.owner_id === currentUserId;

  function toggleStar(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      const result = await toggleFolderStarAction(folder.id, !starred);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteFolderAction(folder.id);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Folder deleted");
    });
  }

  return (
    <div
      onClick={onOpen}
      className={`flex cursor-pointer items-center gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-accent/50 ${isPending ? "opacity-60" : ""}`}
    >
      <Folder className="size-5 shrink-0 fill-sky-100 text-sky-500" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{folder.name}</span>
      <div className="hidden w-32 shrink-0 items-center gap-1.5 text-xs text-muted-foreground sm:flex">
        <AvatarBadge name={folder.owner?.full_name ?? null} />
        <span className="truncate">{folder.owner?.full_name}</span>
      </div>
      <span className="hidden w-24 shrink-0 text-xs text-muted-foreground md:inline">{formatNumericDate(new Date(folder.created_at))}</span>
      <span className="hidden w-16 shrink-0 text-xs text-muted-foreground md:inline">—</span>
      <button onClick={toggleStar} aria-label={starred ? "Unstar" : "Star"}>
        <Star className={`size-4 ${starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button onClick={(e) => e.stopPropagation()} aria-label="More options">
            <MoreVertical className="size-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {isOwner && (
            <DropdownMenuItem onSelect={() => setShareOpen(true)}>
              <Share2 className="size-4" />
              Share
            </DropdownMenuItem>
          )}
          {isOwner && (
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}>
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this folder?</AlertDialogTitle>
            <AlertDialogDescription>
              Files inside this folder will remain but become unfiled. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {isOwner && (
        <ShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          itemType="folder"
          itemId={folder.id}
          itemName={folder.name}
          members={members.filter((m) => m.id !== currentUserId)}
        />
      )}
    </div>
  );
}
